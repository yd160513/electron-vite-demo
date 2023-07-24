import { ipcMain } from 'electron';

ipcMain.on('createIrregularWindow', () => {
  console.log('createIrregularWindow');
})