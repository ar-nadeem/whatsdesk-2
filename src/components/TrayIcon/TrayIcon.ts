import { Tray, app, Menu } from "electron";
import path from 'path';
import { MainBrowser } from "../BrowserWindow/MainBrowser";

let appIcon:Electron.Tray | any = null;

export function TrayIcon(win:MainBrowser,app:Electron.App):Electron.Tray | undefined{
    
    appIcon = new Tray(path.resolve(__dirname, "..","..","icon", "tray-icon-off.png"));
    
    win.on('title-updated', (title:string) => {
        appIcon.setToolTip(title);
    })
    win.on('notification:new', (title:string) => {
        appIcon.setImage(path.resolve(__dirname, "..","..","icon", "tray-icon-on.png"))
    })
    win.on('notification:clear', (title:string) => {
        appIcon.setImage(path.resolve(__dirname, "..","..","icon", "tray-icon-off.png"))
    })
    createMenu(appIcon,win,app);
    return appIcon;
}

function createMenu(appIcon:Tray,win:MainBrowser,app:Electron.App){
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show/Hide WhatsDesk', click: function () {
                win.toogleVisibility();
            }
        },
        {
            label: 'Quit', click: function () {
                win.destroy();
                app.quit();
                process.exit(0);
            }
        }
    ])
    appIcon.on('click', () => {
        win.toogleVisibility();
    })

    // Make a change to the context menu
    contextMenu.items[1].checked = false
    appIcon.setToolTip('WhatsDesk')

    // Call this again for Linux because we modified the context menu
    appIcon.setContextMenu(contextMenu)
}