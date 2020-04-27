import {app, Menu, Tray, BrowserWindow, dialog, ipcMain, Notification, MenuItem, KeyboardEvent} from 'electron';
import {store, TypedStoreRepository} from './store';
import * as path from 'path'
import {setInterval} from 'timers';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'fs';

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
        type: 'info',
        message: 'Version: 1.0.0',
        detail: 'details',
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

    let p = new Promise((resolve, reject) => {
        let promises: Promise<any>[] = [];
        repository.remotes.forEach(remote => {
            promises.push(git.fetch({
                fs,
                http,
                dir: repository.path,
                remote: remote.name
            }));
        });
        Promise.all(promises).then(() => {
            resolve();
        });
    });

    p.then(() => {
        repository.remotes.forEach(remote => {
            remote.branches.forEach(branch => {
                git.log({
                    fs,
                    dir: repository.path,
                    ref: `remotes/${remote.name}/${branch.name}`,
                    since: new Date(branch.lastCommit)
                }).then(logData => { // todo: modify lastCommit date
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
