import { BrowserWindow, Menu, shell,protocol,session } from "electron";
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { SettingWindow } from "../../windows/SettingsWindow/SettingsWindow";
import { getSettings } from "../Settings/Settings";
import { SettingConfigInterface, ValueSettings } from "../Settings/SettingInterface";
import { exec } from "child_process";

//const
const SettingController = getSettings();
const Settings = SettingController.getAllConfigs();


export class MainBrowser extends EventEmitter {
    private win: Electron.BrowserWindow | undefined;
    private app: Electron.App;
    constructor(app: Electron.App) {
        super();
        this.app = app;
        this.init();
    }
    init(): void {
        let icon:string | undefined;
        if(fs.existsSync(path.resolve(__dirname, "..", "..", "icon", "logo.png"))){
            icon = path.resolve(__dirname, "..", "..", "icon", "logo.png");
        }
        

        this.win = new BrowserWindow({
            show: true,
            icon,
            webPreferences: {
                plugins: true,
                spellcheck: false,
                sandbox:false,
                // partition:"persist:main"
            }
        });

        if(!this.win){
            throw new Error("Browser window is not create");
        }

        if (Settings.skipTaskbar.value) {
            this.win.setSkipTaskbar(true);
        }

        if (process.env.DEBUG) {
            this.win.webContents.openDevTools();
        }
        this.EventsInit();
        this.LoadUrl();
        this.CreateMenu();

    }
    getBrowser(): Electron.BrowserWindow{
        return this.win;
    }
    LoadUrl(): boolean {
        try{
            protocol.handle('events', async (request) => {
                try {
                    // Process the event and get the content
                    const content = await this.processEvent(request);
                    
                    return content;
                } catch (error) {
                    console.error('Error processing event:', error);
                    throw error;
                }
            });
        }catch(ex){
            console.error(ex);
        }
        let serviceWorkers = this.win.webContents.session.serviceWorkers.getAllRunning()
        
        this.win.webContents.session.webRequest.onBeforeSendHeaders({ urls: ['https://web.whatsapp.com/*'] }, (details, callback) => {
            details.requestHeaders['User-Agent'] = this.win.webContents.getUserAgent().replace(/(Electron|whatsdesk)\/([0-9\.]+)\ /gi, "").replace(/\-(beta|alfa)/gi, "")
            callback({ requestHeaders: details.requestHeaders })
        })

        this.win.webContents.setUserAgent(this.win.webContents.getUserAgent().replace(/(Electron|whatsdesk)\/([0-9\.]+)\ /gi, "").replace(/\-(beta|alfa)/gi,""));
        this.win.loadURL("https://web.whatsapp.com/", {
            userAgent: this.win.webContents.getUserAgent().replace(/(Electron|whatsdesk)\/([0-9\.]+)\ /gi, "").replace(/\-(beta|alfa)/gi,"")
        });
        const content = Buffer.from("you've been conned!");
        
        this.win.webContents.session.webRequest.onHeadersReceived({urls:['https://web.whatsapp.com/*']},(details,cb)=>{
            delete details.responseHeaders['content-security-policy-report-only'];
            delete details.responseHeaders['content-security-policy'];
            
            /* console.log(details.responseHeaders); */
            
            cb({
                cancel:false,
                responseHeaders:details.responseHeaders
            })
        })
   
        
        
		return true;
    }
    async processEvent(req): Promise<Response> {
        let url = req.url;
        url = url.replace('events://', '');
        let params = url.split('/');
        console.log(params);
    
        if (params[0] === 'notifications') {
            this.Notification();
        }
    
        // Return an empty Globalresponse Object
        return new Response();
    }
    
    reload(): boolean {
        return this.LoadUrl();
    }
    Notification(): void {
        this.win.flashFrame(true);
        this.emit('notification:new');
    }
    NotificationClear(): void {
        this.win.flashFrame(false);
        this.emit('notification:clear');
    }
    getFocus(): void {
        if (!this.win.isVisible()) this.win.show();
        if (this.win.isMinimized()) this.win.restore()
        this.win.focus()
    }
    CreateMenu(): void {
        const menu = Menu.buildFromTemplate([
            {
                label: '&Tools',
                submenu: [
                    {
                        label: 'Settings',
                        accelerator: "CommandOrControl+s",
                        click() {
                            SettingWindow();
                        }
                    },
                    {
                        label: 'Reload',
                        accelerator: "CommandOrControl+r",
                        click: () => {
                            this.reload();
                        }
                    }
                ]
            },
            {
                label: '&View',
                submenu: [
                    {
                        label: 'show/hide Menu',
                        accelerator: "CommandOrControl+h",
                        click: _ => {
                            this.win.setMenuBarVisibility(!this.win.isMenuBarVisible())
                            this.win.setAutoHideMenuBar(!this.win.isMenuBarVisible())
                        }
                    },
					{
                        label: 'Zoom +',
                        accelerator: "CommandOrControl+numadd",
                        click: _ => {
                            this.win.webContents.zoomLevel *= 2;
                        }
                    },
					{
                        label: 'Zoom -',
                        accelerator: "CommandOrControl+numsub",
                        click: _ => {
                            this.win.webContents.zoomLevel *= 0.5;
                        }
                    },
					
                ]
            }
        ])
        this.win.setMenu(menu);
    }
    toogleVisibility(): void {
        this.win.isVisible() ? this.win.hide() : this.win.show()
    }
    destroy(): void {
        this.win.destroy();
    }
    isVisible(): void {
        this.win.isVisible();
    }
    hide(): void {
        this.win.hide();
    }
    show(): void {
        this.win.show();
    }
    EventsInit(): void {
        //window events
        this.win.on('page-title-updated', (evt: any, title: string) => {
            evt.preventDefault()
            title = title.replace(/(\([0-9]+\) )?.*/, "$1WhatsDesk");
            this.win.setTitle(title);
            this.emit('title-updated', title);
            if (!/\([0-9]+\)/.test(title)) {
                this.emit('clear-title');
                this.NotificationClear();
            }
        })
        this.win.on('close', (event: any) => {
            if (Settings.closeExit.value) {
                this.app.quit();
                process.exit(0);
            } else {
                event.preventDefault();
                this.win.hide();
            }
        });

        //content events
        this.win.webContents.on('did-finish-load', async () => {
            await this.ScriptLoad();
            this.SendConfigs();
        })

        this.win.webContents.on('will-navigate', this.HandleRedirect)
        //this.win.webContents.on('new-window', this.HandleRedirect)
        this.win.webContents.setWindowOpenHandler(({ url }) => { this.HandleRedirect(null, url); return { action: 'deny' } });
        //internal events
        SettingController.on('updateSettings', (name: string, value: ValueSettings) => {
            switch (name) {
                case "theme":
                    /* this.win.webContents.send('eventsSended', {
                        type: "changeTheme",
                        theme: value.value
                    }); */
                    break;
                case "skipTaskbar":
                    if (value.value) {
                        this.win.setSkipTaskbar(true);
                    }else{
                        this.win.setSkipTaskbar(false);
                    }
                    break;
            }
        })
    }
    SendConfigs(): void {
        /* this.win.webContents.send('settings', SettingController.getAllConfigs()); */
    }
    HandleRedirect(e: any, url: string): void {
        if (!Settings.openInternal.value) {
            if (!url.startsWith("https://web.whatsapp.com/")) {
                // e.preventDefault()
                if (Settings.BrowserOpen.value == "default") {
                    shell.openExternal(url)
                } else {
                    exec(`${Settings.BrowserOpen.value} ${url}`);
                }
            }
        }
    }
    async ScriptLoad(): Promise<void> {
        let injectScripts: Array<string> = fs.readdirSync(path.resolve(__dirname, "..", "..", "scripts"));
        for (let scriptName of injectScripts) {
            let script = fs.readFileSync(path.resolve(__dirname, "..", "..", "scripts", scriptName), "utf8");
            try{
                await this.win.webContents.executeJavaScript(`${script};`);
            }catch(ex){
                console.error(ex);
            }
        }
    }
}

