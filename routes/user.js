var express = require("express");
var router = express.Router();
var exe = require("./connction"); // ✅ correct

/* ===========================
   HOME PAGE (FIXED)
   =========================== */
router.get("/", async function (req, res) {
  try {
    // 🔹 Fetch products safely (from products1)
    var products = await exe("SELECT * FROM products1");

    // 🔹 Always pass products to EJS
    res.render("user/Home", { products });

  } catch (err) {
    console.error("Home page error:", err);

    // 🔹 Even if DB fails, page should NOT crash
    res.render("user/Home", { products: [] });
  }
});

/* ===========================
   AUTH PAGES (UNCHANGED)
   =========================== */
router.get("/login", function (req, res) {
  res.render("user/Login");
});

router.get("/register", function (req, res) {
  res.render("user/Register");
});

/* ===========================
   REGISTER (UNCHANGED)
   =========================== */
router.post("/save_flipkart_account", async function (req, res) {
  var d = req.body;

  var sql = `
    INSERT INTO user_create_account 
    (user_first_name, user_last_name, user_user_name, user_mobile, user_email, user_password)
    VALUES 
    ('${d.user_first_name}', '${d.user_last_name}', '${d.user_user_name}', 
     '${d.user_mobile}', '${d.user_email}', '${d.user_password}')
  `;

  await exe(sql);
  res.redirect("/register");
});

/* ===========================
   USER LOGIN (UNCHANGED)
   =========================== */
router.get("/user_login", function (req, res) {
  res.render("user/user_login.ejs");
});

router.post("/login_Flipkart_account", async function (req, res) {
  var d = req.body;

  var sql = `
    SELECT * FROM user_create_account 
    WHERE user_user_name='${d.user_user_name}' 
    AND user_password='${d.user_password}'
  `;

  var data = await exe(sql);

  if (data.length > 0) {
    res.send("Login successful. Welcome back!");
  } else {
    res.send("Invalid email or password. Please try again.");
  }
});

/* ===========================
   PROFILE (UNCHANGED)
   =========================== */
router.get("/my_profile", function (req, res) {
  res.render("user/my-profile.ejs");
});

module.exports = router;
