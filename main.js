const {app, Menu, Tray, BrowserWindow, dialog, ipcMain} = require('electron');
const {store} = require('./store');


ipcMain.on('store.gitPath', (event, arg) => {
    store.set('gitPath', arg);
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
            nodeIntegration: true
        }
    });

    mainWindow.loadFile('./index.html');
};

app.whenReady().then(() => {
    const tray = new Tray('./favicon.ico');
    tray.setToolTip('Git Push Monitor');
    tray.setContextMenu(Menu.buildFromTemplate([
        {label: 'Show', type: 'normal', click: onShow},
        {label: 'separator1', type: 'separator'},
        {label: 'About', type: 'normal', click: onAbout},
        {label: 'Quit', type: 'normal', click: onExit},
    ]));
});

app.on('window-all-closed', () => {
    // use tray
});
