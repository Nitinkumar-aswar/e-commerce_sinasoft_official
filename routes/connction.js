const mysql = require("mysql");
const util = require("util");

/* ===============================
   MYSQL CONNECTION
================================ */

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
 database: "autokart",
  multipleStatements: false
});

/* ===============================
   CONNECT & ERROR CHECK
================================ */

conn.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    return;
  }
  console.log("✅ MySQL connected to auto_kart_database");
});

/* ===============================
   PROMISIFY QUERY (ASYNC/AWAIT)
================================ */

const exe = util.promisify(conn.query).bind(conn);

module.exports = exe;
