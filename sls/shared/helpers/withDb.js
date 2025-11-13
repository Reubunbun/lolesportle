const mysql = require('mysql2/promise');

/** @param {(dbConn: mysql.Connection) => Promise<void>} handler */
function withDb(handler) {
  return async function() {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    try {
      await handler(conn);
    } catch (e) {
      console.error(e);
    } finally {
      await conn.end();
    }
  };
}

module.exports = withDb;
