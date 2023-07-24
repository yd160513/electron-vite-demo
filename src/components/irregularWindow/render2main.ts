import { ipcRenderer } from 'electron';

export const createIrregularWindow = () => {
  console.log('createIrregularWindow');
  
  ipcRenderer.send('createIrregularWindow')
}
