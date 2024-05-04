import fs from 'fs';
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { createRequire } from 'module';
import colorize from './colorize.js';
import { DOWNLOAD_DIR_PATH, LOG, LOG_ERROR, MP3, MP4, URLS_FILE_PATH } from '../constants/index.js';
import { normalizeTitle, createDirectory, readVideoUrlsFromFile, getFileDownloadPath } from './common.js';
import { Readable } from 'stream';
import { DownloadArgs, DownloadCompletionType } from '../types/index.js';
import store, { ActionTypes } from '../store/index.js';

try {
    const nRequire = createRequire(import.meta.url);
    const ffmpegStatic = nRequire('ffmpeg-static');

    if (ffmpegStatic) {
        ffmpeg.setFfmpegPath(ffmpegStatic);
    }
} catch (error) {
    console.log("Cannot find module 'ffmpeg-static'. Please ensure it is properly installed. Exiting...");
    process.exit(1);
}

const delay = promisify(setTimeout);

let successLengthCounter = 0;

const unsubscribe = store.subscribe(() => {
    const { listLength: listL, successLength: successL, errorLength: errorL, currentVideoTitle: title } = store.getState();

    if (!listL || !successL || successL === successLengthCounter) {
        return;
    }

    successLengthCounter = successL;

    if (successL < listL) {
        console.log(colorize(`${LOG} - ${title}`, 'magenta') + colorize(` - Progress: ${successL}/${listL}, Errors: ${errorL}`, "cyan"));
    }

    if (successL === listL) {
        console.log(colorize(`${LOG} - ${title}`, 'magenta') + colorize(` - Progress: ${successL}/${listL}, Errors: ${errorL}`, "cyan"));
        console.log(colorize(`${LOG} - Download Complete!`, 'green'));
        unsubscribe();
    }
});

function handleDownloadCompletion(type: DownloadCompletionType) {
    store.dispatch({ type });
}

function incrementDownloadError() {
    store.dispatch({ type: ActionTypes.INCREMENT_ERROR_LENGTH })
}

async function downloadSingle(url: string, format: string) {
    const info = await getYTInfo(url);

    if (!store.getState().readingFromFile) {
        store.dispatch({ type: ActionTypes.SET_LIST_LENGTH, payload: 1 });
    }

    if (!info) {
        console.log(colorize(`${LOG_ERROR} - Video ${url}`, 'red'));
        incrementDownloadError();
        return;
    }

    const videoUrl = info.videoDetails.video_url;
    const title = info.videoDetails.title;
    processDownload({ url: videoUrl, title, format });
}

const processPlaylistItems = async (items: ytpl.Item[], format: string, playlistDir: string) => {
    for (let i = 0; i < items.length; i++) {
        const vid = items[i];
        const info: ytdl.videoInfo | undefined = await getYTInfo(vid.shortUrl);

        if (!info) {
            console.log(colorize(`${LOG_ERROR} - Video ${vid.index} - ${vid.shortUrl}`, 'red'));
            handleDownloadCompletion(ActionTypes.DECREMENT_SUCCESS_LENGTH);
            incrementDownloadError();
        } else {
            const videoUrl = info.videoDetails.video_url;
            const title = info.videoDetails.title;
            processDownload({ url: videoUrl, title, format, dir: playlistDir });
        }
        await delay(1500);
    }
};

const downloadPlaylist = async (playlistUrl: string, format: string) => {
    let listData: ytpl.Result;

    try {
        listData = await ytpl(playlistUrl, { pages: 1 });
    } catch (error) {
        console.log(colorize(`${LOG_ERROR} - An error occurred! Check the link and try again. ${(<Error>error).message}`, 'red'));
        process.exit(1);
    }

    if (listData.items.length <= 0) {
        console.log(colorize(`${LOG_ERROR} - No videos.`, 'red'));
        process.exit(1);
    }

    if (listData.estimatedItemCount > 100) {
        listData = await ytpl(listData.url, { pages: Math.ceil(listData.estimatedItemCount / 100) });
    }

    const playlistDir = `${DOWNLOAD_DIR_PATH}/${normalizeTitle(listData.title)}-${format}`;
    createDirectory(playlistDir);

    if (!store.getState().readingFromFile) {
        store.dispatch({ type: ActionTypes.SET_LIST_LENGTH, payload: listData.items.length });
    }

    await processPlaylistItems(listData.items, format, playlistDir);
};

const handleReadFromFile = async (format: string) => {
    const youtubeUrls = await readVideoUrlsFromFile(URLS_FILE_PATH);

    if (youtubeUrls.length === 0) {
        console.log(`${LOG_ERROR} - No urls, aborting.`);
        process.exit(1);
    }

    let totalLength = 0;
    for (const url of youtubeUrls) {
        const isSingle = ytdl.validateURL(url);
        const isPlaylist = ytpl.validateID(url);

        if (isSingle) {
            totalLength++;
        } else if (isPlaylist) {
            const listData = await ytpl(url)
            totalLength += listData.items.length
        }
    }

    store.dispatch({ type: ActionTypes.SET_LIST_LENGTH, payload: totalLength });

    for (const url of youtubeUrls) {
        const isSingle = ytdl.validateURL(url);
        const isPlaylist = ytpl.validateID(url);

        if (isSingle) {
            await downloadSingle(url, format);
        } else if (isPlaylist) {
            await downloadPlaylist(url, format);
        } else {
            throw new Error(`${LOG_ERROR} - Invalid YouTube url.`);
        }
    }
};

async function getYTInfo(url: string) {
    try {
        return await ytdl.getInfo(url);
    } catch (error) {
        return undefined;
    }
}

function downloadMP4(url: string, title: string, outputPath: string) {
    ytdl(url, { filter: format => format.itag === 18 })
        .pipe(fs.createWriteStream(`${outputPath}`))
        .on('finish', () => {
            store.dispatch({ type: ActionTypes.SET_CURRENT_VIDEO_TITLE, payload: title });
            handleDownloadCompletion(ActionTypes.INCREMENT_SUCCESS_LENGTH);
        })
        .on('error', () => {
            console.log(colorize(`${LOG_ERROR} - Video: ${title} - ${url}`, 'red'));
            incrementDownloadError();
        });
}

function downloadMP3(url: string, title: string, outputPath: string) {
    const stream: Readable = ytdl(url, { quality: 'highestaudio' });

    ffmpeg(stream)
        .audioBitrate(320)
        .save(`${outputPath}`)
        .on('end', () => {
            store.dispatch({ type: ActionTypes.SET_CURRENT_VIDEO_TITLE, payload: title });
            handleDownloadCompletion(ActionTypes.INCREMENT_SUCCESS_LENGTH);
        })
        .on('error', () => {
            console.log(colorize(`${LOG_ERROR} - Music: ${title} - ${url}`, 'red'));
            incrementDownloadError();
        });
}

function processDownload({ url, title, format, dir }: DownloadArgs) {
    const outputPath = getFileDownloadPath(normalizeTitle(title), format, dir);

    if (format === MP4.toUpperCase()) {
        downloadMP4(url, title, outputPath);
    } else if (format === MP3.toUpperCase()) {
        downloadMP3(url, title, outputPath);
    }
}

export { downloadSingle, downloadPlaylist, handleReadFromFile };
