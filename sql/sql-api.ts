import connectDb from './index';

export function initDb() {
  const db = connectDb()

  return new Promise((resolve) => {
    db.serialize(() => {
      // 测试数据库
      /**
       * 创建的所有表格都需要放置到 serialize 方法里面，然后创建的字段根据 sql 语法自行创建即可
       * 注意: 这里创建的是 test 表，表名后面的 () 里面的字段表示表需要创建的字段名以及类型；() 中最后一个字段的后面不能有逗号，否则会报错创建表格不成功
       */
      db.run(`create table if not exists test (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          buyerType varchar(64) DEFAULT '1',
          tel TEXT,
          cookie varchar(2000),
          uin TEXT DEFAULT null,
          uid TEXT DEFAULT null,
          type TEXT DEFAULT null,
          createdTimer int
      )`);

      resolve(0);
    })
  })
}

export default {

  /**
   * 增加数据
   * db.all(inquire 查询表格中是否有该用户，如果有该用户就不插入到表格中；反之插入表格；sql和inquire都是一些sql语法；sql是插入，inquire是查询语法
   * @returns 
   */
  addTest({ tel, cookie, uin, type = 1 }: { tel: string, cookie: string, uin: string, type: number }) {
    let db = connectDb();

    let createdTimer = new Date().getTime();

    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO test (type, tel, cookie, createdTimer, uin) `;
      sql += `values ("${type}", "${tel}", "${cookie}", "${createdTimer}", "${uin}")`;

      let inquire = `select * from test where tel = "${tel}"`;

      db.all(inquire, (err: Error, list: any) => { // 查询用户
        if (err) {
          reject({ code: 400, msg: err, data: [] });
        } else {
          if (list.length) { // 有用户
            resolve({ code: 201, msg: '已有该用户', data: list })
          } else { // 没有用户
            db.all(sql, (error: Error, data: any) => {
              if (error) {
                reject({ code: 400, msg: error });
              } else {
                resolve({ code: 200, msg: '成功', data });
              }
            });
          }
        }
      })
    })

  },

  /**
   * 获取数据列表
   * 首先通过totalSql语法获取test表格有多少条数据，如果有附加条件也是可以where这个查找的；得到总数以后根据sql语法实现分页效果。
   * 如果增加了tel电话号码的话，也是可以搜索的
   */
  getTest({ page = 1, pageSize = 10, tel = '' }) {
    let db = connectDb();
    // 获取total语法
    let totalSql = `select count(*) total from test`;

    let total = 0;
    return new Promise((resolve, reject) => {
      // 统计总数
      db.all(totalSql, (err: Error, totalData: any[]) => {
        if (err) { reject({ code: 200, msg: err, data: '总计条数错误' }) };
        total = totalData[0].total;
      });

      // 实现分页语法
      let sql = `select * from test`;
      if (tel) {
        sql += ` where tel = "${tel}"`;
      };
      sql += ` limit ${(page - 1) * pageSize},${pageSize}`;

      db.all(sql, (error: Error, data: any[]) => {
        if (error) {
          reject({ code: 400, msg: error });
        } else {
          resolve({ code: 200, msg: '成功', data });
        }
      });
    })
  },

  delTest({ id = 1 }) {
    let sql = `DELETE FROM test WHERE id = ${id}`;
    let weightSql = `select * from test where id = ${id}`;
    return new Promise((resolve, reject) => {
      let db = connectDb();
      db.all(weightSql, (err: Error, list: any[]) => {
        if (err) {
          reject({ code: 400, msg: err, data: [] });
        } else {
          if (list.length) {
            db.all(sql, (error: Error, data: any[]) => {
              if (error) {
                reject({ code: 400, msg: error });
              } else {
                resolve({ code: 200, msg: '删除成功', data: list });
              }
            });
          } else {
            resolve({ code: 400, msg: `买家号不存在` });
          }
        }
      });
    })
  }


}
