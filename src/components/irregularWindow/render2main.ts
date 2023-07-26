import { ipcRenderer } from 'electron';

export const createIrregularWindow = () => {
  console.log('createIrregularWindow');

  ipcRenderer.send('createIrregularWindow')
}

export const setIgnoreMouseEvents = (flag: boolean) => {
  console.log('setIgnoreMouseEvents', flag);
  if (flag) {
    ipcRenderer.send('set-ignore-mouse-events', true, { forward: true })
  } else {
    ipcRenderer.send('set-ignore-mouse-events', false)
  }
}

// 不规则窗口透明部分鼠标事件可穿透
export const eventPenetration = () => {
  const el = document.getElementById('app')
  console.log('注册事件监听', el);
  
  el?.addEventListener('mouseenter', () => {
    console.log('mouseenter');
    setIgnoreMouseEvents(false)
  })
  el?.addEventListener('mouseleave', () => {
    console.log('mouseleave');
    setIgnoreMouseEvents(true)
  })
}
