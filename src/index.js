const {store} = require('./store');
const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;
const {spawnSync} = require('child_process');

document.addEventListener('DOMContentLoaded', () => {
    /**
     * @type {HTMLInputElement}
     */
    const gitPath = document.getElementById('gitPath');
    /**
     * @type {HTMLButtonElement}
     */
    const gitPathBtn = document.getElementById('gitPathBtn');
    /**
     * @type {HTMLButtonElement}
     */
    const repositoriesAddBtn = document.getElementById('repositoriesAddBtn');
    /**
     * @type {HTMLTableElement}
     */
    const repositories = document.getElementById('repositories');
    /**
     * @type {HTMLDialogElement}
     */
    const dialog = document.getElementById('dialog');
    /**
     * @type {HTMLButtonElement}
     */
    const dialogCloseBtn = document.getElementById('dialogCloseBtn');
    /**
     * @type {HTMLDivElement}
     */
    const dialogContent = document.getElementById('dialogContent');

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

    const addRepositoryToView = (path) => {
        const row = repositories.insertRow();
        row.insertCell().innerText = path;

        const bat = spawnSync(store.get('gitPath'), ['status', '--short'], {
            cwd: path
        });
        const err = bat.stderr.toString();
        const out = bat.stdout.toString();

        row.insertCell().innerText = err ? err : out;
        row.insertCell().innerHTML = `<input type="button" value="C" title="Config" /> <input type="button" value="R" title="Remove" />`;
    };

    const addRepository = (path) => {
        const storeRepositories = store.get('repositories') || [];
        if (storeRepositories.includes(path)) {
            return;
        }

        storeRepositories.push(path);

        ipcRenderer.send('store.repositories', storeRepositories);

        addRepositoryToView(path);
    };



    // initialization
    (() => {
        gitPath.value = store.get('gitPath');

        (store.get('repositories') || []).forEach(path => {
            addRepositoryToView(path);
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
        if ('INPUT' !== e.target.tagName) {
            return;
        }

        if ('R' === e.target.value) { // Remove
            /**
             * @type {HTMLTableRowElement}
             */
            const row = e.target.parentElement.parentElement;
            removeRepository(row.cells.item(0).innerText);
        }

        if ('C' === e.target.value) { // Config
            /**
             * @type {HTMLTableRowElement}
             */
            const row = e.target.parentElement.parentElement;

            dialogContent.innerHTML = row.toString() ; // todo
            dialog.showModal();
        }
    });

    dialogCloseBtn.addEventListener('click', () => dialog.close());
});
