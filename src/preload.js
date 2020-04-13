const {store} = require('./store');
const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;

document.addEventListener('DOMContentLoaded', () => {
    const gitPath = document.getElementById('gitPath');
    const gitPathBtn = document.getElementById('gitPathBtn');
    const repositoriesAddBtn = document.getElementById('repositoriesAddBtn');
    /**
     * @type {HTMLTableElement}
     */
    const repositories = document.getElementById('repositories');

    const setGitPath = (path) => {
        ipcRenderer.send('store.gitPath', path);
        gitPath.value = path;
    };

    const removeRepository = (path) => {
        let storeRepositories = store.get('repositories') || [];
        if (!storeRepositories.includes(path)) {
            return;
        }

        storeRepositories = storeRepositories.filter(item => item !== path);

        ipcRenderer.send('store.repositories', storeRepositories);

        for (const row of repositories.rows) {
            if (path === row.cells.item(0).innerText) {
                repositories.deleteRow(row.rowIndex);
            }
        }
    };

    const addRepository = (path) => {
        const storeRepositories = store.get('repositories') || [];
        if (storeRepositories.includes(path)) {
            return;
        }

        storeRepositories.push(path);

        ipcRenderer.send('store.repositories', storeRepositories);

        const row = repositories.insertRow();
        row.insertCell().innerText = path;
        row.insertCell().innerHTML = `<input type="button" value="Remove" />`;
    };

    // initialization
    (() => {
        gitPath.value = store.get('gitPath');

        const storeRepositories = store.get('repositories') || [];

        storeRepositories.forEach(path => {
            const row = repositories.insertRow();
            row.insertCell().innerText = path;
            row.insertCell().innerHTML = `<input type="button" value="Remove" />`;
        });
    })();


    gitPathBtn.addEventListener('click', () => {
        dialog.showOpenDialog({title: 'Git path', properties: ['openFile']}).then(e => {
            if (e.filePaths && e.filePaths.length === 1) {
                setGitPath(e.filePaths[0]);
            }
        });
    });

    repositoriesAddBtn.addEventListener('click', () => {
        dialog.showOpenDialog({title: 'Repository path', properties: ['openDirectory']}).then(e => {
            if (e.filePaths && e.filePaths.length === 1) {
                addRepository(e.filePaths[0]);
            }
        });
    });

    repositories.addEventListener('click', (e) => {
        if ('INPUT' === e.target.tagName) { // remove
            const row = e.target.parentElement.parentElement;
            removeRepository(row.cells.item(0).innerText);
        }
    });
});
