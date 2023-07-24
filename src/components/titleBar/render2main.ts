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