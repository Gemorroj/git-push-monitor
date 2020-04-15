const Store = require('electron-store');
const yaml = require('js-yaml');

module.exports.store = new Store({
    fileExtension: 'yaml',
    serialize: yaml.safeDump,
    deserialize: yaml.safeLoad,

    schema: {
        gitPath: {
            type: 'string',
            default: 'git'
        },
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
                        default: 60
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
