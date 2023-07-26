import { ipcRenderer } from 'electron';

export const close = () => {
  ipcRenderer.send('close')
}
export const minimize = () => {
  ipcRenderer.send('minimize')
}
export const unmaximize = () => {
  ipcRenderer.send('unmaximize')
}
export const maximize = () => {
  ipcRenderer.send('maximize')
}

export const outherMaximizeListener = (handle: Function) => {
  ipcRenderer.on('outherMaximize', (e) => {
    handle()
  })
}

export const outherUnmaximizeListener = (handle: Function) => {
  ipcRenderer.on('outherUnmaximize', (e) => {
    handle()
  })
}

ipcRenderer.on('closeBefore', event => {
  console.log('关闭窗口前的提示并通知主进程');
  console.log('等待确认');
  
  
  setTimeout(() => {
    console.log('同意关闭');
    
    ipcRenderer.send('destoryWin')
  }, 5000)
})