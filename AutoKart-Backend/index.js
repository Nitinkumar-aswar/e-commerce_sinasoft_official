const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const cookieParser = require("cookie-parser");
require("dotenv").config();

const adminRoutes = require("./src/routes/admin");
const userRoutes = require("./src/routes/user.routes");

const app = express();
const PORT = 5000;

/* =========================
   TRUST PROXY (IMPORTANT)
========================= */
app.set("trust proxy", 1);

/* =========================
   SESSION DATABASE (POOL)
========================= */
const sessionDB = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
port: process.env.DB_PORT
});

/* =========================
   SESSION STORE
========================= */

const sessionStore = new MySQLStore(
  {
    expiration: 1000 * 60 * 60 * 24 * 7,
    clearExpired: true,
    checkExpirationInterval: 900000,
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
    secret: process.env.SESSION_SECRET || "autokart-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: false // production मध्ये true
    }
  })
);


/* =========================
   MIDDLEWARE
========================= */

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "../AutoKart-Frontend/public")));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../AutoKart-Frontend/public/uploads"))
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../AutoKart-Frontend/views"));

/* =========================
   MAIN DATABASE
========================= */

const db = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
port: process.env.DB_PORT
});

console.log("✅ MySQL Pool ready");

/* =========================
   MAKE DB AVAILABLE
========================= */

app.use((req, res, next) => {
  req.db = db;
  next();
});

/* =========================
   GLOBAL USER SESSION (EJS)
========================= */

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

/* =========================
   GLOBAL NAVBAR DATA
========================= */

app.use((req, res, next) => {
  const sectionQuery = `
    SELECT id, name, display_slug
    FROM sections
  `;

  const subSectionQuery = `
    SELECT id, name, section_id, display_slug
    FROM sub_sections
  `;

  req.db.query(sectionQuery, (err, sections) => {
    if (err) {
      console.error("Section query failed:", err);
      res.locals.sections = [];
      res.locals.subSectionsBySection = {};
      return next();
    }

    req.db.query(subSectionQuery, (err, subSections) => {
      if (err) {
        console.error("Sub-section query failed:", err);
        res.locals.sections = sections || [];
        res.locals.subSectionsBySection = {};
        return next();
      }

      const grouped = {};
      subSections.forEach(s => {
        if (!grouped[s.section_id]) grouped[s.section_id] = [];
        grouped[s.section_id].push(s);
      });

      res.locals.sections = sections;
      res.locals.subSectionsBySection = grouped;
      next();
    });
  });
});



app.use((req, res, next) => {
  res.locals.contact = {
    phone: "+91 9876543210",
    email: "support@autokart.com",
    whatsapp: "919876543210",
    address: "Baner,Pune"
  };
  next();
});

/* =========================
   ROUTES
========================= */

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

/* =========================
   SERVER
========================= */
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  res.status(500).send("Internal Server Error");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 AutoKart running on port ${PORT}`);
});