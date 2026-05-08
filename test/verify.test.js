const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs')

const runScript = (db, script) => {
  const sql = fs.readFileSync(script, 'utf8');
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

const getTableInfo = (db, tableName) => {
  const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`;
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

const getColumnInfo = (db, tableName) => {
  const sql = `PRAGMA table_info(${tableName});`;
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

const getForeignKeyInfo = (db, tableName) => {
  const sql = `PRAGMA foreign_key_list(${tableName});`;
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

describe('the SQL in the `exercise.sql` file', () => {
  let db;
  let scriptPath;
  let cleanup;

  beforeAll( async () => {
    const dbPath = path.resolve(__dirname, '..', 'lesson21.db');
    db = new sqlite3.Database(dbPath);
    scriptPath = path.resolve(__dirname, '..', 'exercise.sql');
    cleanup = path.resolve(__dirname, './cleanup.sql')
    await runScript(db, cleanup);
  });

  afterAll( async () => {
    await runScript(db, cleanup);
    db.close();
  });

  test('Should create a new table named Stores with specified columns and foreign key constraint', async () => {
    await runScript(db, scriptPath);
    
    const tableName = 'Stores';
    const expectedColumns = ['ID', 'LOCATION', 'EMPLOYEE_ID', 'REVENUE'];
    const expectedForeignKey = {
      column: 'LOCATION',
      foreignTable: 'Employee',
      foreignColumn: 'LOCATION'
    };
    
    const tableExistsResult = await getTableInfo(db, tableName);
    expect(tableExistsResult[0].name).toBe(tableName);

    const columnsInfo = await getColumnInfo(db, tableName)
    const columnResultNames = columnsInfo.map(col => col.name);

    expect(columnResultNames.sort()).toStrictEqual(expectedColumns.sort());
    expect(columnsInfo.filter(col => col.pk === 1).length).toEqual(1);

    const foreignKeys = await getForeignKeyInfo(db, tableName);
    const foreignKeyResult = (foreignKeys[0].from === expectedForeignKey.column &&
                              foreignKeys[0].table === expectedForeignKey.foreignTable &&
                              foreignKeys[0].to === expectedForeignKey.foreignColumn);

    expect(foreignKeyResult).toBe(true);
  });
});
