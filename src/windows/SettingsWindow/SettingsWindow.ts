import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { getSettings } from '../../components/Settings/Settings';


var window: BrowserWindow | undefined;

export function SettingWindow() {
    let settings = getSettings();
    window = new BrowserWindow({
        show: true,
        icon: path.join(__dirname, "..", "..", "icon", "logo.png"),
        height: 310,
        width: 550,
        resizable: false,
        webPreferences:{
            nodeIntegration:true,
            contextIsolation: false,
            sandbox:false,
        }
    })
    window.setMenu(null);
    window.once("close", () => {
        window = undefined;
        ipcMain.removeAllListeners("send");

    })
    
    if(process.env.DEBUG){
        window.webContents.openDevTools();
    }

    window.setSkipTaskbar(true);

    window.loadURL('file://' + path.join(__dirname, 'settings.html'))

    ipcMain.once("send", (event: any, arg: any) => {
        if (arg) {
            for(let k in arg){
                settings.saveConfig(k,arg[k]);
            }
        }
        window.close();
    })

    ipcMain.once("getData", (event: any, arg: any) => {
        window.webContents.send('settings',{
            settings:settings.getAllConfigs()
        });
    })
}
