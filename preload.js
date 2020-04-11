const {store} = require('./store');
const {ipcRenderer} = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const gitPath = document.getElementById('gitPath');
    gitPath.value = store.get('gitPath');

    gitPath.addEventListener('change', e => {
        ipcRenderer.send('store.gitPath', e.target.value);
    });
});
