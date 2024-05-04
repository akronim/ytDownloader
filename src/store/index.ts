export enum ActionTypes {
    SET_LIST_LENGTH = 'SET_LIST_LENGTH',
    INCREMENT_SUCCESS_LENGTH = 'INCREMENT_SUCCESS_LENGTH',
    DECREMENT_SUCCESS_LENGTH = 'DECREMENT_SUCCESS_LENGTH',
    INCREMENT_ERROR_LENGTH = 'INCREMENT_ERROR_LENGTH',
    SET_READING_FROM_FILE = 'SET_READING_FROM_FILE',
    SET_CURRENT_VIDEO_TITLE = 'SET_CURRENT_VIDEO_TITLE'
}

type SetListLengthAction = { type: ActionTypes.SET_LIST_LENGTH; payload: number };
type IncrementSuccessLengthAction = { type: ActionTypes.INCREMENT_SUCCESS_LENGTH; };
type DecrementSuccessLengthAction = { type: ActionTypes.DECREMENT_SUCCESS_LENGTH; };
type IncrementErrorLengthAction = { type: ActionTypes.INCREMENT_ERROR_LENGTH; };
type SetReadingFromFileAction = { type: ActionTypes.SET_READING_FROM_FILE; payload: boolean };
type SetCurrentVideoTitle = { type: ActionTypes.SET_CURRENT_VIDEO_TITLE; payload: string };

type Action =
    SetListLengthAction
    | IncrementSuccessLengthAction
    | IncrementErrorLengthAction
    | DecrementSuccessLengthAction
    | SetReadingFromFileAction
    | SetCurrentVideoTitle;

type State = {
    listLength: number;
    successLength: number;
    errorLength: number;
    readingFromFile: boolean;
    currentVideoTitle: string;
};

type Listener = () => void;

type Reducer = (state: State, action: Action) => State;

type Store = {
    getState: () => State;
    dispatch: (action: Action) => void;
    subscribe: (listener: Listener) => () => void;
};

const createStore = (reducer: Reducer): Store => {
    let listeners: Listener[] = [];

    const initialState: State = {
        listLength: 0,
        successLength: 0,
        errorLength: 0,
        readingFromFile: false,
        currentVideoTitle: ''
    };

    let currentState: State = reducer(initialState, {} as Action);

    return {
        getState: () => currentState,
        dispatch: (action: Action) => {
            currentState = reducer(currentState, action);

            listeners.forEach((listener) => {
                listener();
            });
        },
        subscribe: (newListener: Listener) => {
            listeners.push(newListener);

            const unsubscribe = () => {
                listeners = listeners.filter((l) => l !== newListener);
            };

            return unsubscribe;
        },
    };
};

const useReducer: Reducer = (state: State, action) => {
    switch (action.type) {
        case ActionTypes.SET_LIST_LENGTH:
            return {
                ...state,
                listLength: action.payload,
            };

        case ActionTypes.INCREMENT_SUCCESS_LENGTH:
            return {
                ...state,
                successLength: state.successLength + 1,
            };

        case ActionTypes.DECREMENT_SUCCESS_LENGTH:
            return {
                ...state,
                successLength: state.successLength - 1,
            };

        case ActionTypes.INCREMENT_ERROR_LENGTH:
            return {
                ...state,
                errorLength: state.errorLength + 1,
            };

        case ActionTypes.SET_READING_FROM_FILE:
            return {
                ...state,
                readingFromFile: action.payload,
            };
        case ActionTypes.SET_CURRENT_VIDEO_TITLE:
            return {
                ...state,
                currentVideoTitle: action.payload
            }
        default:
            return state;
    }
};

const store = createStore(useReducer);
export default store;


// export const actions = {
//     setListLength: (payload: number): Action => ({
//         type: ActionTypes.SET_LIST_LENGTH,
//         payload,
//     }),
//     incrementSuccessLength: (): Action => ({
//         type: ActionTypes.INCREMENT_ERROR_LENGTH,
//     }),
//     decrementSuccessLength: (): Action => ({
//         type: ActionTypes.DECREMENT_SUCCESS_LENGTH,
//     }),
//     incrementErrorLength: (): Action => ({
//         type: ActionTypes.INCREMENT_ERROR_LENGTH,
//     }),
//     setReadingFromFile: (payload: boolean): Action => ({
//         type: ActionTypes.SET_READING_FROM_FILE,
//         payload,
//     }),
// };