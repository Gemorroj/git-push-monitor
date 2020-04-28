import {app, Menu, Tray, BrowserWindow, dialog, ipcMain, Notification, MenuItem, KeyboardEvent} from 'electron';
import {store, TypedStoreRepository} from './store';
import * as path from 'path'
import {setInterval} from 'timers';
import {fetchRemotes, logRemoteBranch} from './git';

// all intervals
const intervals: NodeJS.Timeout[] = [];

ipcMain.on('store.repositories', (event, arg: TypedStoreRepository[]) => {
    store.set('repositories', arg);
    processListeners();
});
ipcMain.on('store.repository', (event, arg: TypedStoreRepository) => {
    store.set('repositories', store.get('repositories').map(item => {
        if (item.path === arg.path) {
            item = arg;
        }
        return item;
    }));
    processListeners();
});


const onExit = (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) => {
    app.quit();
};
const onAbout = (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) => {
    dialog.showMessageBoxSync({
        title: 'About',
        type: 'info',
        message: 'Git push monitor',
        detail: 'Version: 1.0.0\nhttps://github.com/Gemorroj/git-push-monitor',
    });
};
const onShow = (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) => {
    (new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: true,
            preload: path.join(app.getAppPath(), 'index.js')
        }
    })).loadFile(path.join(app.getAppPath(), 'index.html'));
};



const process = (repository: TypedStoreRepository) => {
    fetchRemotes(
        repository.path,
        repository.remotes.map(remote => remote.name)
    ).then(() => {
        repository.remotes.forEach(remote => {
            remote.branches.forEach(branch => {
                logRemoteBranch(
                    repository.path,
                    remote.name,
                    branch.name,
                    new Date(branch.lastCommit)
                ).then(logData => { // todo: modify lastCommit date
                    for (const log of logData) {
                        new Notification({
                            title: repository.path,
                            body: `${log.commit.author.name}\n${log.commit.message}`
                        }).show();
                    }
                });
            });
        });
    });
};
const processListeners = () => {
    for (let interval of intervals) {
        clearInterval(interval);
    }

    store.get('repositories').forEach(repository => {
        process(repository);
        const intervalObj = setInterval(() => {
            process(repository);
        }, repository.interval * 1000);

        intervals.push(intervalObj);
    });
};



app.whenReady().then(() => {
    let tray = new Tray(path.join(__dirname, 'icon.png'));
    tray.setToolTip('Git Push Monitor');
    tray.setContextMenu(Menu.buildFromTemplate([
        {label: 'Config', type: 'normal', click: onShow},
        {label: 'separator1', type: 'separator'},
        {label: 'About', type: 'normal', click: onAbout},
        {label: 'Quit', type: 'normal', click: onExit},
    ]));

    processListeners();
});

app.on('window-all-closed', () => {
    // use tray
});
