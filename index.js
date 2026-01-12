var express = require("express");
var bodyparser = require("body-parser");
var session = require("express-session");
const path = require("path");

// ROUTES
var userroute = require("./routes/user");
var adminroute = require("./routes/admin");

var app = express();

/* ===============================
   VIEW ENGINE (EJS)
================================ */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ===============================
   MIDDLEWARE
================================ */
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

app.use(
  session({
    secret: "gghh",
    resave: false,
    saveUninitialized: true,
  })
);

/* ===============================
   STATIC FILES
================================ */
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   REACT ADMIN BUILD (SINGLE PORT)
   http://localhost:1000/admin
================================ */
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

/* ===============================
   USER & ADMIN API ROUTES
================================ */
app.use("/", userroute);
app.use("/admin-api", adminroute);

/* ==========================================================
   DECORATION PRODUCT PAGES
   /products/decoration/:tag
========================================================== */
app.get("/products/decoration/:tag", (req, res) => {
  const { tag } = req.params;

  const images = [
    "led-lights.jpg",
    "flowers.jpg",
    "wall-decor.jpg",
    "fairy.jpg",
  ];

  // Generate 30 unique products
  const generateProducts = (prefix) => {
    let products = [];
    for (let i = 1; i <= 30; i++) {
      products.push({
        name: `${prefix} Item ${i}`,
        price: 499 + i * 10,
        image: images[i % images.length],
      });
    }
    return products;
  };

  /* ===== ALL PAGE (BIG FLIPKART SECTIONS) ===== */
  if (tag === "all") {
    const allProducts = generateProducts("Decoration");

    return res.render("products", {
      newArrivals: allProducts.slice(0, 8),
      bestSelling: allProducts.slice(8, 16),
      trending: allProducts.slice(16, 24),
      combo: allProducts.slice(24, 30),
      festive: allProducts.slice(0, 6),
    });
  }

  /* ===== INDIVIDUAL CATEGORY PAGES ===== */
  const headingMap = {
    new: "New Decoration Arrivals",
    best: "Best Selling Decoration Items",
    trending: "Trending Decoration Products",
    combo: "Decoration Combo Packs",
    festive: "Festive Decoration Specials",
  };

  if (!headingMap[tag]) {
    return res.status(404).send("Page not found");
  }

  return res.render("decoration-category", {
    title: headingMap[tag],
    heading: headingMap[tag],
    products: generateProducts(headingMap[tag]),
  });
});

/* ===============================
   ADMIN SPA FALLBACK
================================ */
app.use("/admin", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public/admin/index.html")
  );
});

/* ===============================
   START SERVER
================================ */
app.listen(1000, () => {
  console.log("🚀 Flipkart + AutoKart Admin running on port 1000");
});
