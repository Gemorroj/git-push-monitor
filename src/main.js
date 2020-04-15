const {app, Menu, Tray, BrowserWindow, dialog, ipcMain, Notification} = require('electron');
const {store} = require('./store');
const path = require('path');
const {spawn} = require('child_process');

// all intervals
const intervals = [];

ipcMain.on('store.gitPath', (event, arg) => {
    store.set('gitPath', arg);
});
ipcMain.on('store.repositories', (event, arg) => {
    store.set('repositories', arg);
    processListeners();
});


const onExit = (menuItem, browserWindow, event) => {
    app.quit();
};
const onAbout = (menuItem, browserWindow, event) => {
    dialog.showMessageBoxSync({
        type: 'info',
        message: 'Version: 1.0.0',
        detail: 'details',
    });
};
const onShow = (menuItem, browserWindow, event) => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'index.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

const process = (repository) => {
    const fetch = spawn(store.get('gitPath'), ['fetch'], {
        cwd: repository.path
    });
    fetch.on('close', (fetchExitCode) => {
        if (0 !== fetchExitCode) {
            console.log(`git fetch process exited with code ${fetchExitCode}`);
        }

        const log = spawn(store.get('gitPath'), ['log', '--since', repository.lastCommit, 'origin/HEAD'], { // todo: hardcoded remote
            cwd: repository.path
        });
        log.stdout.on('data', (data) => { // todo: modify lastCommit date
            const notification = new Notification({
                title: repository.path,
                body: data.toString()
            });
            notification.show();
        });
        log.stderr.on('data', (data) => {
            console.error({
                repository: repository,
                error: data.toString()
            });
        });

    });
    fetch.stderr.on('data', (data) => {
        console.error({
            repository: repository,
            error: data.toString()
        });
    });
};

const processListeners = () => {
    for (let interval of intervals) {
        clearInterval(interval);
    }

    const repositories = store.get('repositories') || [];

    repositories.forEach(repository => {
        const intervalObj = setInterval(() => {
            process(repository);
        }, repository.interval * 1000);

        intervals.push(intervalObj);
    });
};


app.whenReady().then(() => {
    const tray = new Tray(path.join(__dirname, 'icon.png'));
    tray.setToolTip('Git Push Monitor');
    tray.setContextMenu(Menu.buildFromTemplate([
        {label: 'Show', type: 'normal', click: onShow},
        {label: 'separator1', type: 'separator'},
        {label: 'About', type: 'normal', click: onAbout},
        {label: 'Quit', type: 'normal', click: onExit},
    ]));

    processListeners();
});

app.on('window-all-closed', () => {
    // use tray
});
