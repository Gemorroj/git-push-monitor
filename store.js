const Store = require('electron-store');

module.exports.store = new Store({
    schema: {
        gitPath: {
            type: 'string',
            format: 'uri-reference',
            default: 'git'
        },
        repositories: {
            type: 'array',
            items: {
                type: 'string',
                format: 'uri-reference'
            }
        }
    }
});
