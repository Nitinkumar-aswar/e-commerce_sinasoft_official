var mysql = require("mysql");
var util = require("util");
var adminAuth = require("../middleware/adminAuth");


var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "auto_kart_database"   // तुझं DB नाव
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;





