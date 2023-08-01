import { app } from 'electron';
// import sqlite from 'sqlite3';
const sqlite = require('sqlite3')
import path from 'node:path';

const sqliteIns = sqlite.verbose()

let db: sqlite.Database

export default function connectDb() {
  const userDataPath = app.getPath('userData')
  console.log('userDataPath: ', userDataPath);
  
  const dbPath = path.join(userDataPath, './sql.db')
  
  if (!db) {
    db = new sqliteIns.Database(dbPath); // 保存地址文件
  };
  
  return db
}