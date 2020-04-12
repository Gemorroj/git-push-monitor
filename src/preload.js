const {store} = require('./store');
const {ipcRenderer} = require('electron');
const {dialog} = require('electron').remote;

document.addEventListener('DOMContentLoaded', () => {
    const gitPath = document.getElementById('gitPath');
    const gitPathBtn = document.getElementById('gitPathBtn');

    gitPath.value = store.get('gitPath');

    gitPathBtn.addEventListener('click', () => {
        dialog.showOpenDialog({title: 'Git path', properties: ['openFile']}).then(e => {
            if (e.filePaths && e.filePaths.length === 1) {
                ipcRenderer.send('store.gitPath', e.filePaths[0]);
                gitPath.value = e.filePaths[0];
            }
        });
    });
});
