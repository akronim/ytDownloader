import { ActionTypes } from "../store/index.js";

export type DownloadArgs = {
    url: string;
    title: string;
    format: string;
    dir?: string;
}

export type UserInput = {
    url: string;
    isSingleUrl: boolean;
    isPlaylistUrl: boolean;
    format: string;
    isReadFromFile: boolean;
}

export type DownloadCompletionType =
    | ActionTypes.INCREMENT_SUCCESS_LENGTH
    | ActionTypes.DECREMENT_SUCCESS_LENGTH;
