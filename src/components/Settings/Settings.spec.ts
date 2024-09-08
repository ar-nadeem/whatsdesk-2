import { app, BrowserWindow } from 'electron';
import { getSettings,Settings } from './Settings';

/* app.commandLine.appendArgument('no-sandbox'); */
app.commandLine.appendSwitch('no-sandbox')
describe('Settings', function () {
    let settings = getSettings();
    app.on('ready',_=>{
        it('create', function () {
            expect(settings).toBeInstanceOf(Settings)
        })
        it('getData',function(){
            let data = settings.getAllConfigs();
            expect(data).toBeDefined()
        })
        it('saveConfig',function(){
            
            expect(()=>{
                settings.saveConfig("sadasd","SADasd")
            }).toThrowError("config not defined");
            expect(()=>{
                settings.saveConfig("closeExit",false)
            }).not.toThrow();
        })
    })
    
});