import { app, BrowserView, BrowserWindow, ipcMain, nativeTheme, webContents } from 'electron'
import path from 'node:path'
import windowToolHandle from './windowTool';

console.log('nativeTheme.shouldUseDarkColors: ', nativeTheme.shouldUseDarkColors);


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

  // 窗口聚焦之后
  win.on('focus', () => {
    console.log('focus');
    // 获取聚焦的 webContents
    const contents = webContents.getFocusedWebContents()
    console.log('focus 之后 webContents: ', contents);
  })

  // 设置网页缩放，大于1为放大
  win.webContents.setZoomFactor(2)
  const zoomFactor = win.webContents.getZoomFactor()
  console.log('zoomFactor: ', zoomFactor);
  // 设置网页缩放，最终缩放比例为参数 * 1.2
  win.webContents.setZoomLevel(2)
  const zoomLevel = win.webContents.getZoomLevel()
  console.log('zoomLevel: ', zoomLevel);

  // 创建 BrowserView
  const view = new BrowserView({})
  win.setBrowserView(view)
  const size = win.getSize()
  view.setBounds({
    x: 0,
    y: 80,
    width: size[0],
    height: size[1] - 80
  })
  view.setAutoResize({
    width: true,
    height: true
  })
  view.webContents.loadURL('https://www.baidu.com/')
}

app.on('window-all-closed', () => {
  win = null
  irregularWindow = null

  /**
   * mac 系统下的特殊用户体验: 
   * 应用程序关闭所有窗口后不会退出，而是继续保留在 Dock 栏，以便用户再想使用应用时，可以直接通过 Dock 栏快速打开应用窗口。
   * 
   * process.platform 值为 darwin 时代表 mac 系统；
   *                  值为 win32 时代表 windows 系统；
   *                  值为 linux 时代表 linux 系统；
   * 也可以通过 require('os').platform() 获取。
   */
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * app 的 activate 事件是 mac 专有事件，当应用程序被激活时会被触发。
 * 因为主进程中每关闭一个窗口，都会把窗口对应的 win 对象设置为 null，所以当用户激活应用程序时，再创建一个全新的窗口即可。
 * activate 事件回调的第二个参数 hasVisibleWindows 表示当前是否存在可见的窗口，开发者也可利用此参数优化用户体验。
 */
app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
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
