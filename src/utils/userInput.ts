import ytdlCore from 'ytdl-core';
import ytpl from 'ytpl';
import inquirer, { Answers } from 'inquirer';
import { MP3, MP4 } from '../constants/index.js';
import { UserInput } from '../types/index.js';

const getUserInput = async (): Promise<UserInput> => {
    let isSingleUrl = false;
    let isPlaylistUrl = false;
    let isReadFromFile = false;

    const validateLink = (answer: string): string | boolean => {
        if (answer.trim().length < 1) {
            return 'Please enter a URL';
        }

        isPlaylistUrl = ytpl.validateID(answer);
        isSingleUrl = ytdlCore.validateURL(answer);

        if (!isPlaylistUrl && !isSingleUrl) {
            return 'Please enter a valid URL';
        }

        return true;
    };


    const data = await inquirer.prompt([
        {
            type: 'list',
            name: 'source',
            message: 'Choose url source:',
            choices: ['Enter link manually', 'Read from a file'],
        },
        {
            when: (answers: Answers) => answers.source === 'Enter link manually',
            name: 'url',
            message: 'Video or playlist url:',
            validate: validateLink,
        },
        {
            name: 'format',
            type: 'list',
            message: 'Choose download format:',
            choices: [MP4.toUpperCase(), MP3.toUpperCase()],
        },
    ]);

    if (data.source === 'Read from a file') {
        isReadFromFile = true;
    }

    return {
        url: data.url,
        isSingleUrl,
        isPlaylistUrl,
        format: data.format,
        isReadFromFile,
    };
};

export { getUserInput };
