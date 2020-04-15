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
     * @type {HTMLDivElement}
     */
    const gitPathInfo = document.getElementById('gitPathInfo');
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
    const modalWindow = document.getElementById('modalWindow');
    /**
     * @type {HTMLButtonElement}
     */
    const modalWindowCloseBtn = document.getElementById('modalWindowCloseBtn');
    /**
     * @type {HTMLDivElement}
     */
    const modalWindowContent = document.getElementById('modalWindowContent');

    const setGitPath = (path) => {
        ipcRenderer.send('store.gitPath', path);
        setGitPathToView(path);
    };
    const setGitPathToView = (path) => {
        gitPath.value = path;

        const bat = spawnSync(path, ['--version']);
        const err = bat.stderr ? bat.stderr.toString() : null;
        const out = bat.stdout ? bat.stdout.toString() : null;

        gitPathInfo.innerText = err ? err : out;
    };

    const removeRepository = (path) => {
        let storeRepositories = store.get('repositories') || [];

        storeRepositories = storeRepositories.filter(item => item.path !== path);

        ipcRenderer.send('store.repositories', storeRepositories);

        for (const row of repositories.rows) {
            if (path === row.cells.item(0).innerText) {
                repositories.deleteRow(row.rowIndex);
            }
        }
    };

    const addRepositoryToView = (repositoryPath) => {
        const row = repositories.insertRow();
        row.insertCell().innerText = repositoryPath;

        const bat = spawnSync(store.get('gitPath'), ['count-objects', '--human-readable'], {
            cwd: repositoryPath
        });
        const err = bat.stderr ? bat.stderr.toString() : null;
        const out = bat.stdout ? bat.stdout.toString() : null;

        row.insertCell().innerText = err ? err : out;
        row.insertCell().innerHTML = `<input type="button" value="C" title="Config" /> <input type="button" value="R" title="Remove" />`;
    };

    const addRepository = (path) => {
        const storeRepositories = store.get('repositories') || [];
        for (let storeRepository of storeRepositories) {
            if (storeRepository.path === path) {
                return;
            }
        }

        storeRepositories.push({
            path: path,
            lastCommit: new Date().toISOString()
        });
        ipcRenderer.send('store.repositories', storeRepositories);

        addRepositoryToView(path);
    };



    // initialization
    (() => {
        setGitPathToView(store.get('gitPath'));

        (store.get('repositories') || []).forEach(repository => {
            addRepositoryToView(repository.path);
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

            modalWindowContent.innerText = row.innerHTML; // todo
            modalWindow.showModal();
        }
    });

    modalWindowCloseBtn.addEventListener('click', () => modalWindow.close());
});
