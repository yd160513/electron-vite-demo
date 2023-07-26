import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import windowToolHandle from './windowTool';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
// TODO: __dirname: 当前 node 运行环境所在目录的全局路径。
process.env.DIST = path.join(__dirname, '../dist')
// app.isPackaged: A boolean property that returns true if the app is packaged, false otherwise. For many apps, this property can be used to distinguish development and production environments.
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')
console.log('app.isPackaged: ', app.isPackaged);



let win: BrowserWindow | null
let irregularWindow: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 400,
    x: 0,
    y: 0,
    icon: path.join(process.env.PUBLIC, 'electron-vite.svg'), // TODO: 设置未生效
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  win.on('close', event => {
    event.preventDefault()
    win?.webContents.send('closeBefore')
  })

}

app.on('window-all-closed', () => {
  win = null
  irregularWindow = null
  app.quit()
})

app.whenReady().then(() => {
  createWindow()
  win && windowToolHandle(win)
})

/**
 * 不规则窗口的原理是设置窗口为透明，然后控制好内容区域的 DOM 形状，这样看起来就是不规则的。
 * 不规则窗口需要自定义边框和标题栏。
 * 阻止窗口最大化
 */
function createIrregularWindow() {
  irregularWindow = new BrowserWindow({
    width: 380,
    height: 380,
    transparent: true, // 设置窗口为透明
    frame: false, // 无边框
    maximizable: false, // 阻止窗口最大化
    resizable: false, // 不能改变窗口尺寸
    alwaysOnTop: true, // 永远在置顶    
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  irregularWindow.setIgnoreMouseEvents(true, { forward: true })

  console.log('VITE_DEV_SERVER_URL: ', VITE_DEV_SERVER_URL);

  if (VITE_DEV_SERVER_URL) {
    irregularWindow.loadURL(`${VITE_DEV_SERVER_URL}/irregularWindow.html`)
  } else {
    irregularWindow.loadFile(path.join(process.env.DIST, 'irregularWindow.html'))
  }

  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    console.log('set-ignore-mouse-events: ', ignore, options)
    
    irregularWindow?.setIgnoreMouseEvents(ignore, options)
  })

}

ipcMain.on('createIrregularWindow', () => {
  console.log('createIrregularWindow');
  createIrregularWindow()
})



ipcMain.on('destoryWin', () => {
  console.log('退出 app');
  win?.destroy()
  const count = BrowserWindow.getAllWindows().length
  console.log('count: ', count);
  
})
