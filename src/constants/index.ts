import path from "path";

export const FUYT = 'FUYT'
export const LOG: string = `[${FUYT}]`;
export const LOG_ERROR: string = `[${FUYT}][ERROR]`;
export const DOWNLOAD_DIRECTORY_NAME: string = 'downloads';
export const URLS_FILE_NAME: string = 'urls.txt';
export const MP3: string = 'mp3';
export const MP4: string = 'mp4';
export const URLS_FILE_PATH = path.join(process.cwd(), URLS_FILE_NAME);
export const DOWNLOAD_DIR_PATH = path.join(process.cwd(), DOWNLOAD_DIRECTORY_NAME);