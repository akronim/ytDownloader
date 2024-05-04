#! /usr/bin/env node
import figlet from 'figlet';
import colorize from './utils/colorize.js';
import { downloadSingle, downloadPlaylist, handleReadFromFile } from './utils/download.js';
import { createDirectory } from './utils/common.js';
import { getUserInput } from './utils/userInput.js';
import { FUYT, DOWNLOAD_DIR_PATH } from './constants/index.js';
import { UserInput } from './types/index.js';
import store, { ActionTypes } from './store/index.js';

const main = async (): Promise<void> => {
    createDirectory(DOWNLOAD_DIR_PATH);

    console.log(colorize(figlet.textSync(FUYT), 'cyan'));

    const userInput = await getUserInput();
    const { url, format, isSingleUrl, isPlaylistUrl, isReadFromFile }: UserInput = userInput;

    if (isSingleUrl) {
        await downloadSingle(url, format);
    } else if (isPlaylistUrl) {
        await downloadPlaylist(url, format);
    } else if (isReadFromFile) {
        store.dispatch({ type: ActionTypes.SET_READING_FROM_FILE, payload: true });
        await handleReadFromFile(format);
    }
};

await main();

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error, origin) => {
    console.error(`Uncaught Exception:\n\n${error}\n\nOrigin: ${origin}`);
    process.exit(1);
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
    console.error(`Uncaught Exception (Monitor):\n\n${error}\n\nOrigin: ${origin}`);
});
