import {DEFAULT_REPOSITORY_INTERVAL, store} from './store';
import {ipcRenderer, remote} from 'electron';

window.addEventListener('DOMContentLoaded', () => {
    const repositoriesAddBtn = document.getElementById('repositoriesAddBtn') as HTMLButtonElement;
    const repositories = document.getElementById('repositories') as HTMLTableElement;
    const modalWindow = document.getElementById('modalWindow') as HTMLDialogElement;
    const modalWindowCloseBtn = document.getElementById('modalWindowCloseBtn') as HTMLButtonElement;
    const modalWindowContent = document.getElementById('modalWindowContent') as HTMLDivElement;

    const removeRepository = (path: string) => {
        let storeRepositories = store.get('repositories') || [];

        storeRepositories = storeRepositories.filter(item => item.path !== path);

        ipcRenderer.send('store.repositories', storeRepositories);

        for (let i = 0; i < repositories.rows.length; ++i) {
            const row = repositories.rows[i];
            const firstCell = row.cells.item(0);
            if (firstCell && path === firstCell.innerText) {
                repositories.deleteRow(row.rowIndex);
            }
        }
    };

    const addRepositoryToView = (repositoryPath: string) => {
        const row = repositories.insertRow();
        row.insertCell().innerText = repositoryPath;
        row.insertCell().innerHTML = `<input type="button" value="C" title="Config" /> <input type="button" value="R" title="Remove" />`;
    };

    const addRepository = (path: string) => {
        const storeRepositories = store.get('repositories') || [];
        for (let storeRepository of storeRepositories) {
            if (storeRepository.path === path) {
                return;
            }
        }

        storeRepositories.push({
            path: path,
            interval: DEFAULT_REPOSITORY_INTERVAL,
            lastCommit: new Date().toISOString()
        });
        ipcRenderer.send('store.repositories', storeRepositories);

        addRepositoryToView(path);
    };



    // initialization
    (() => {
        (store.get('repositories') || []).forEach(repository => {
            addRepositoryToView(repository.path);
        });
    })();

    repositoriesAddBtn.addEventListener('click', () => {
        remote.dialog.showOpenDialog({title: 'Repository path', properties: ['openDirectory']}).then(e => {
            if (e.filePaths && e.filePaths.length === 1) {
                addRepository(e.filePaths[0]);
            }
        });
    });

    repositories.addEventListener('click', (e) => {
        if (!e.target || 'INPUT' !== (e.target as HTMLElement).tagName) {
            return;
        }
        const target = e.target as HTMLInputElement;

        if ('R' === target.value) { // Remove
            const row = (target.parentElement as HTMLTableCellElement).parentElement as HTMLTableRowElement;
            const firstCell = row.cells.item(0);
            if (firstCell) {
                removeRepository(firstCell.innerText);
            }
        }

        if ('C' === target.value) { // Config
            const row = (target.parentElement as HTMLTableCellElement).parentElement as HTMLTableRowElement;

            modalWindowContent.innerText = row.innerHTML; // todo
            modalWindow.showModal();
        }
    });

    modalWindowCloseBtn.addEventListener('click', () => modalWindow.close());
});
