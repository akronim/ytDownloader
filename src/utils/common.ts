import * as fs from 'fs';
import { LOG, DOWNLOAD_DIR_PATH } from '../constants/index.js';

function normalizeTitle(title: string): string {
    return title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}

function getFileDownloadPath(normalizedTitle: string, format: string, directory?: string): string {
    let dir: string | null = null

    if (directory) {
        dir = directory
    } else {
        dir = DOWNLOAD_DIR_PATH;
    }

    return `${dir}/${normalizedTitle}.${format.toLowerCase()}`;
}

const createDirectory = (dir: string): void => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};

async function readVideoUrlsFromFile(filePath: string): Promise<string[]> {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return data.split('\n')
            .map(link => link.trim())
            .filter(line => !line.startsWith('#'))
            .filter(Boolean);
    } catch (error) {
        throw new Error(`${LOG} Error reading file: ${(error as Error).message}`);
    }
}

export { normalizeTitle, getFileDownloadPath, createDirectory, readVideoUrlsFromFile };
