import path from 'path';
import fs from 'fs';
import { app } from 'electron'
import { ValueSettings, SettingsInterface, SettingConfigInterface, ValueTypes, TabSections } from './SettingInterface';
import { EventEmitter } from 'events';
import { getAvailableBrowsers, BrowserElement } from '../../utils/browsers';

export class Settings extends EventEmitter {
    private data: SettingsInterface = {
        configs:{}
    };
    constructor() {
        super();
        this.loadSetting();
    }

    private loadSetting(): void {
        let configDir: string = getWhatsdeskPath();
        let data = {}
        try {
            
            if(fs.existsSync(path.resolve(configDir, "settings.json"))){
                data = JSON.parse(fs.readFileSync(path.resolve(configDir, "settings.json"), "utf8"));
            }
            
        } catch (ex) {
            
        }
        this.loadDefaultConfigValue(data);
    }
    private saveSetting(): void {
        let configDir: string = getWhatsdeskPath();
        let dataToSave = {
            version:this.data.version,
            configs:this.ConfigurationToSave()
        };

        fs.writeFileSync(path.resolve(configDir, "settings.json"), JSON.stringify(dataToSave), "utf8");
    }

    private ConfigurationToSave(): any{
        let d:any = {};
        for(let k in this.data.configs){
            d[k] = this.data.configs[k].value;
        }
        return d;
    }

    updateVersion(version: string) {
        this.data.version = version;
        this.saveSetting();
    }

    saveConfig(key: string, value: string | boolean): void {
        if(!this.data.configs[key]){
            throw new Error('config not defined');
        }
        this.data.configs[key].value = value;
        this.saveSetting();
        this.emit('updateSettings',key,this.data.configs[key]);
    }

    getConfig(key: string): string | boolean {
        return this.data.configs[key] && this.data.configs[key].value;
    }

    getAllConfigs(): SettingConfigInterface {
        return this.data.configs;
    }

    loadDefaultConfigValue(data: any): void {
        let AvailableBrowsers = getAvailableBrowsers().map((e:BrowserElement)=>({key:e.exec,text:e.label}))
        let defaultConfigs: SettingConfigInterface = {
            closeExit: {
                section: TabSections.GENERAL,
                type: ValueTypes.CHECKBOX,
                value: false,
                text: "Close window and Exit",
                tinytext: null
            },
            skipTaskbar: {
                section: TabSections.GENERAL,
                type: ValueTypes.CHECKBOX,
                value: false,
                text: "Skip Taskbar",
                tinytext: "Makes the window not show in the taskbar."
            },
            /* multiInstance: {
                section: TabSections.BETA,
                type: ValueTypes.CHECKBOX,
                value: false,
                text: "Multi instance"
            }, */
            openInternal: {
                section: TabSections.GENERAL,
                type: ValueTypes.CHECKBOX,
                value: false,
                text: "Open links internal",
                tinytext: "Open links in internal windows"
            },
            BrowserOpen: {
                section: TabSections.GENERAL,
                type: ValueTypes.SELECT,
                value: "default",
                text: "Open external links with",
                tinytext: "Select which browser will open external links.",
                options:[
                    {key:"default",text:"default"},
                    ...AvailableBrowsers
                ]
            },
            SoundNotification: {
                section: TabSections.GENERAL,
                type: ValueTypes.FILE,
                value: "",
                text: "Sound notification",
                tinytext: "Sound of notification"
            },
            /* theme: {
                section: TabSections.GENERAL,
                type: ValueTypes.SELECT,
                value: "",
                text: "Theme",
                options:[
                    {key:"",text:"Light"},
                    {key:"dark",text:"Dark"},
                ]
            }, */
        }
        this.data.configs = this.mergeData(defaultConfigs, data.configs);
    }
    mergeData(def: SettingConfigInterface, data: any): SettingConfigInterface {
        let merge:SettingConfigInterface = {}
        if(!data){
            data = {};
        }
        for (let k in def) {
            def[k].value = data[k] || def[k].value;
            merge[k] = def[k];
        }
        return merge;
    }
}

let settingsInit: Settings | undefined;

export function getSettings(): Settings {
    if (!settingsInit) {
        settingsInit = new Settings();
    }
    return settingsInit;
}


export function getWhatsdeskPath(): string {
    const dir = "whatsdesk"

    let home = app.getPath('home');
    if (home.indexOf("/snap/") != -1) {
        home = home.substring(0, home.indexOf("/whatsdesk/") + 11) + "current";
    }

    let xdg = process.env["XDG_CONFIG_HOME"]
    const prefer_xdg = !(xdg === undefined)
    if (!prefer_xdg) {
        xdg = `${home}/.config`
    }

    let cfg = path.resolve(`${xdg}/${dir}`)
    if (!fs.existsSync(cfg)) {
        if (prefer_xdg) {
            fs.mkdirSync(cfg);
        } else {
            cfg = path.resolve(`${home}/.${dir}`);
            if (!fs.existsSync(cfg)) {
                fs.mkdirSync(cfg);
            }
        }
    }

    return cfg;
}

/* function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
} */

/* function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return mergeDeep(target, ...sources);
} */
