//imports
import { app, ipcMain,protocol } from 'electron';
import { MainBrowser } from './components/BrowserWindow/MainBrowser';
import { TrayIcon } from './components/TrayIcon/TrayIcon';
import { checkUpdates } from './utils/updates';
import { Notify } from './utils/notifications';
import { getSettings } from './components/Settings/Settings';
import { getEnvironment } from './utils/environment';
const envConfig = getEnvironment();

//Vars 
let win: MainBrowser;
let appIcon: Electron.Tray | any = null;
let SettingsController = getSettings();

//Process name
process.title = envConfig.name;

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'events',
        privileges: {
            secure: true,
            standard: true,
            bypassCSP: true,
            supportFetchAPI: true,
            allowServiceWorkers: true // Optional, if you need service worker support
        }
    }
]);

app.on("ready", _ => {
    
    
    win = new MainBrowser(app);
    appIcon = TrayIcon(win, app);
    if(!SettingsController.getConfig('multiInstance')){
        if(!app.requestSingleInstanceLock()){
            app.quit();
            process.exit(1020);
            return;
        }
        app.on('second-instance', (event, argv, cwd) => {
            if(!SettingsController.getConfig('multiInstance')){
                win.getFocus();
            }
        })
    }
    
    checkUpdates().then(hasUpdate => {
        if (hasUpdate) {
            Notify({ title: "Update", body: "Update avalible", url: "https://zerkc.gitlab.io/whatsdesk/" });
        }
    })

    initEvents();
})

function initEvents(): void {
    ipcMain.on('notifications', (event, arg) => {
        //TODO: Resolver doble notificacion
        //NotificationSound();
        win.Notification();
        event.sender.send('notification:new', true);
    })
}
