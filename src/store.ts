import * as Store from 'electron-store'

export const DEFAULT_REPOSITORY_INTERVAL = 60;


export type TypedStoreRepositoryRemoteBranch = {
    name: string,
    lastCommit: string
};
export type TypedStoreRepositoryRemote = {
    name: string,
    branches: TypedStoreRepositoryRemoteBranch[]
};
export type TypedStoreRepository = {
    path: string,
    remotes: TypedStoreRepositoryRemote[],
    interval: number,
};
export type TypedStore = {
    repositories: TypedStoreRepository[]
};

export const store = new Store<TypedStore>({
    schema: {
        repositories: {
            type: 'array',
            uniqueItems: true,
            default: [],
            items: {
                type: 'object',
                properties: {
                    path: { // local path to git repository
                        type: 'string'
                    },
                    remotes: { // subscribed origins and branches
                        type: 'array',
                        default: [],
                        uniqueItems: true,
                        items: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string'
                                },
                                branches: {
                                    type: 'array',
                                    default: [],
                                    uniqueItems: true,
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: {
                                                type: 'string'
                                            },
                                            lastCommit: {
                                                default: new Date().toISOString(),
                                                type: 'string',
                                                format: 'date-time' // example: 2018-11-13T20:20:39+00:00
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    interval: { // interval seconds
                        type: 'number',
                        minimum: 1,
                        default: DEFAULT_REPOSITORY_INTERVAL
                    }
                }
            }
        }
    }
});


export const getStoreRepository = (gitPath: string): TypedStoreRepository|undefined => {
    return store.get('repositories').find(item => item.path === gitPath);
};
