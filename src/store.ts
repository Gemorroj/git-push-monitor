import * as Store from 'electron-store'

export const DEFAULT_REPOSITORY_INTERVAL = 60;

export type TypedStoreRepository = {
    path: string,
    interval: number,
    lastCommit: string
};

export type TypedStore = {
    repositories: TypedStoreRepository[]
};

export const store = new Store<TypedStore>({
    schema: {
        repositories: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    path: { // local path to git repository
                        type: 'string'
                    },
                    interval: { // interval seconds
                        type: 'number',
                        minimum: 1,
                        default: DEFAULT_REPOSITORY_INTERVAL
                    },
                    lastCommit: {
                        type: 'string',
                        format: 'date-time' // example: 2018-11-13T20:20:39+00:00
                    }
                }
            }
        }
    }
});
