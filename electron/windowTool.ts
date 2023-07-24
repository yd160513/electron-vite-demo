import { ipcMain, BrowserWindow } from 'electron';

export default function handle(win: BrowserWindow) {
  ipcMain.on('close', () => {
    console.log('close');
    win.close()
  })
  ipcMain.on('minimize', () => {
    console.log('minimize');
    win.minimize()
  })
  ipcMain.on('unmaximize', () => {
    console.log('unmaximize');
    win.unmaximize()
  })
  ipcMain.on('maximize', () => {
    console.log('maximize');
    win.maximize()
  })

  // 除了最大最小化按钮以外其他地方（双击顶栏）触发最大最小化
  win.on('maximize', (e: any) => {
    console.log('maximize', e);
    e.sender.send('outherMaximize')
  })
  win.on('unmaximize', (e: any) => {
    console.log('unmaximize', e);
    e.sender.send('outherUnmaximize')
  })
}