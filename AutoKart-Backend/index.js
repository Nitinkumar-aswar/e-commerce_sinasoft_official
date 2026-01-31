const express = require("express");
require("dotenv").config();
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const adminRoutes = require("./src/routes/admin");
const userRoutes = require("./src/routes/user.routes");

const app = express();
const PORT = 5000;


/* =========================
   SESSION DATABASE (FIRST)
========================= */

const sessionDB = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "autokart_db"
});

/* =========================
   SESSION STORE (SECOND)
========================= */

const sessionStore = new MySQLStore(
  {
    expiration: 1000 * 60 * 60 * 24 * 7, // 7 days
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 mins
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data"
      }
    }
  },
  sessionDB
);

/* =========================
   SESSION MIDDLEWARE
========================= */

app.use(
  session({
    name: "autokart_session",
    secret: "autokart-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

/* =========================
   MIDDLEWARE
========================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../AutoKart-Frontend/public')));
app.use(
  "/uploads",
  express.static(path.join(__dirname, '../AutoKart-Frontend/public/uploads'))
);

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, '../AutoKart-Frontend/views'));

/* =========================
   MAIN DATABASE
========================= */

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "autokart_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();



/* =========================
   MAKE DB AVAILABLE
========================= */

app.use((req, res, next) => {
  req.db = db;
  next();
});

/* =========================
    GLOBAL NAVBAR DATA
   ========================= */

app.use(async (req, res, next) => {
  try {
    const [sections] = await req.db.query(
      "SELECT id, name, display_slug FROM sections"
    );

    const [subSections] = await req.db.query(
      "SELECT id, name, section_id, display_slug FROM sub_sections"
    );

    const grouped = {};
    subSections.forEach(s => {
      if (!grouped[s.section_id]) {
        grouped[s.section_id] = [];
      }
      grouped[s.section_id].push(s);
    });

    res.locals.sections = sections;
    res.locals.subSectionsBySection = grouped;
    next();
  } catch (err) {
    console.error("NAVBAR ERROR:", err);
    res.locals.sections = [];
    res.locals.subSectionsBySection = {};
    next();
  }
});

/* =========================
   ROUTES
========================= */

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

/* =========================
   SERVER
========================= */

app.listen(PORT, () => {
  console.log(`🚀 AutoKart running at http://localhost:${PORT}`);
});