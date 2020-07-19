import {DEFAULT_REPOSITORY_INTERVAL, getStoreRepository, store, TypedStoreRepository} from './store';
import {ipcRenderer, remote} from 'electron';
import {listRefs} from './git';

window.addEventListener('DOMContentLoaded', () => {
    const repositoriesAddBtn = document.getElementById('repositoriesAddBtn') as HTMLButtonElement;
    const repositoriesTable = document.getElementById('repositories') as HTMLTableElement;
    const modalWindow = document.getElementById('modalWindow') as HTMLDialogElement;
    const modalWindowCloseBtn = document.getElementById('modalWindowCloseBtn') as HTMLButtonElement;
    const refsSelect = document.getElementById('refs') as HTMLSelectElement;
    const intervalInput = document.getElementById('interval') as HTMLInputElement;

    const removeRepository = (path: string) => {
        let storeRepositories = store.get('repositories');
        storeRepositories = storeRepositories?.filter(item => item.path !== path);

        ipcRenderer.send('store.repositories', storeRepositories);

        for (let i = 0; i < repositoriesTable.rows.length; ++i) {
            let row = repositoriesTable.rows[i];
            let firstCell = row.cells.item(0);
            if (firstCell && path === firstCell.innerText) {
                repositoriesTable.deleteRow(row.rowIndex);
            }
        }
    };

    const addRepositoryToView = (repositoryPath: string) => {
        let row = repositoriesTable.insertRow();
        row.insertCell().innerText = repositoryPath;
        row.insertCell().innerHTML = `<input type="button" value="C" title="Config" /> <input type="button" value="R" title="Remove" />`;
    };

    const addRepository = (path: string) => {
        if (getStoreRepository(path)) {
            return;
        }
        let storeRepositories = store.get('repositories');

        storeRepositories?.push({
            path: path,
            interval: DEFAULT_REPOSITORY_INTERVAL,
            remotes: []
        });
        ipcRenderer.send('store.repositories', storeRepositories);

        addRepositoryToView(path);
    };

    const configRepository = (gitRepositoryPath: string) => {
        let repository = getStoreRepository(gitRepositoryPath) as TypedStoreRepository;
        if (!repository) {
            return;
        }

        intervalInput.value = repository.interval.toString();
        intervalInput.dataset.repository = gitRepositoryPath;

        refsSelect.innerHTML = '';
        refsSelect.dataset.repository = gitRepositoryPath;

        listRefs(gitRepositoryPath).then(remotes => {
            remotes.forEach(remote => {
                let g = document.createElement('optgroup');
                g.label = remote.name;
                refsSelect.add(g);

                remote.branches.forEach(branch => {

                    let isSelected = false;
                    let lastCommit = undefined;
                    for (let storeRemote of repository.remotes) {
                        if (storeRemote.name === remote.name) {
                            let b = storeRemote.branches.find(b => b.name === branch);
                            if (b) {
                                isSelected = true;
                                lastCommit = b.lastCommit;
                                break;
                            }
                        }
                    }

                    let o = document.createElement('option');
                    o.dataset.remote = remote.name;
                    o.dataset.lastCommit = lastCommit || '';
                    o.value = branch;
                    o.selected = isSelected;
                    o.text = branch;

                    refsSelect.add(o);
                });
            });

            modalWindow.showModal();
        });
    };



    // initialization
    (() => {
        store.get('repositories')?.forEach(repository => {
            addRepositoryToView(repository.path);
        });
    })();


    // listeners
    repositoriesAddBtn.addEventListener('click', () => {
        remote.dialog.showOpenDialog({title: 'Repository path', properties: ['openDirectory']}).then(e => {
            if (e.filePaths && e.filePaths.length === 1) {
                addRepository(e.filePaths[0]);
            }
        });
    });

    repositoriesTable.addEventListener('click', (e) => {
        if (!e.target) {
            return;
        }

        if ('INPUT' === (e.target as HTMLElement).tagName) {
            let target = e.target as HTMLInputElement;

            if ('R' === target.value) { // Remove
                let row = (target.parentElement as HTMLTableCellElement).parentElement as HTMLTableRowElement;
                let gitRepositoryPath = row.cells.item(0)?.innerText;
                if (gitRepositoryPath) {
                    removeRepository(gitRepositoryPath);
                }
            }

            if ('C' === target.value) { // Config
                let row = (target.parentElement as HTMLTableCellElement).parentElement as HTMLTableRowElement;
                let gitRepositoryPath = row.cells.item(0)?.innerText;
                if (gitRepositoryPath) {
                    configRepository(gitRepositoryPath);
                }
            }
        }

        if ('TD' === (e.target as HTMLElement).tagName && null === (e.target as HTMLElement).previousSibling) {
            console.log('TODO: show logs, check messages to read.. etc');
        }
    });

    modalWindowCloseBtn.addEventListener('click', () => modalWindow.close());

    refsSelect.addEventListener('change', (e) => {
        let repositoryPath = refsSelect.dataset.repository as string;
        let repository = getStoreRepository(repositoryPath);
        if (!repository) {
            return;
        }
        repository.remotes = [];

        for (let i = 0; i < refsSelect.selectedOptions.length; ++i) {
            let selectedOption = refsSelect.selectedOptions.item(i) as HTMLOptionElement;

            let remote = repository.remotes.find(remote => remote.name === selectedOption.dataset.remote);
            if (remote) {
                remote.branches.push({
                    name: selectedOption.value,
                    lastCommit: selectedOption.dataset.lastCommit || new Date().toISOString()
                });
            } else {
                repository.remotes.push({
                    name: selectedOption.dataset.remote as string,
                    branches: [{
                        name: selectedOption.value,
                        lastCommit: selectedOption.dataset.lastCommit || new Date().toISOString()
                    }]
                });
            }
        }

        ipcRenderer.send('store.repository', repository);
    });

    intervalInput.addEventListener('change', () => {
        let repositoryPath = refsSelect.dataset.repository as string;
        let repository = getStoreRepository(repositoryPath);
        if (!repository) {
            return;
        }

        repository.interval = Number(intervalInput.value);

        ipcRenderer.send('store.repository', repository);
    });
});
