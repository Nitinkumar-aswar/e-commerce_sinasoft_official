const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const session = require("express-session");

const adminRoutes = require("./src/routes/admin");

const app = express();
const PORT = 3000;
app.use(
  session({
    secret: "autokart-secret",
    resave: false,
    saveUninitialized: true
  })
);

/* =========================
   MIDDLEWARE
========================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "src/public")));
app.use("/uploads", express.static(path.join(__dirname, "src/public/uploads")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

/* =========================
   DATABASE CONNECTION
========================= */

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "autokart_db"
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL failed:", err);
  } else {
    console.log("✅ MySQL connected");
  }
});

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
      res.locals.sections = [];
      res.locals.subSectionsBySection = {};
      return next();
    }

    req.db.query(subSectionQuery, (err, subSections) => {
      const grouped = {};

      if (!err && subSections.length) {
        subSections.forEach(s => {
          if (!grouped[s.section_id]) {
            grouped[s.section_id] = [];
          }
          grouped[s.section_id].push(s);
        });
      }

      res.locals.sections = sections;
      res.locals.subSectionsBySection = grouped;

      next();
    });
  });
});

/* =========================
   USER ROUTES
========================= */

/* HOME */
app.get("/", (req, res) => {
  const sectionQuery = `SELECT id, name, display_slug FROM sections`;
  const subSectionQuery = `SELECT id, name, section_id, display_slug FROM sub_sections`;
  const productQuery = `SELECT * FROM products WHERE is_active = 1`;
  const sliderQuery = `SELECT * FROM sliders WHERE status = 'active'`;

  db.query(sectionQuery, (err, sections) => {
    if (err) return res.send("Error loading sections");

    db.query(subSectionQuery, (err, subSections) => {
      if (err) return res.send("Error loading sub-sections");

      db.query(productQuery, (err, products) => {
        if (err) return res.send("Error loading products");

        db.query(sliderQuery, (err, sliders) => {
          if (err) return res.send("Error loading sliders");

          const productsBySection = {};
          products.forEach(p => {
            if (!productsBySection[p.section_id]) {
              productsBySection[p.section_id] = [];
            }
            productsBySection[p.section_id].push(p);
          });

          const subSectionsBySection = {};
          subSections.forEach(s => {
            if (!subSectionsBySection[s.section_id]) {
              subSectionsBySection[s.section_id] = [];
            }
            subSectionsBySection[s.section_id].push(s);
          });

          res.render("user/home", {
            sections,
            productsBySection,
            subSectionsBySection,
            sliders
          });
        });
      });
    });
  });
});

/* SHOP */
app.get("/shop", (req, res) => {
  const type = req.query.type;
  let where = "WHERE is_active = 1";

  if (type === "new") {
    where += " ORDER BY created_at DESC";
  }

  const query = `
    SELECT products.*, sections.name AS section_name
    FROM products
    JOIN sections ON products.section_id = sections.id
    ${where}
  `;

  db.query(query, (err, products) => {
    if (err) return res.send("Error loading shop");
    res.render("user/shop", { products });
  });
});

/* SECTION PRODUCTS */
app.get("/section/:id", (req, res) => {
  const sectionId = req.params.id.split("-")[0];

  db.query(
    "SELECT * FROM sections WHERE id = ?",
    [sectionId],
    (err, section) => {
      if (err || !section.length) return res.send("Section not found");

      db.query(
        "SELECT * FROM products WHERE section_id = ?",
        [sectionId],
        (err, products) => {
          if (err) return res.send("Error loading products");

          res.render("user/section-products", {
            section: section[0],
            products
          });
        }
      );
    }
  );
});

/* SUB-SECTION PRODUCTS */
/* SUB-SECTION PRODUCTS */
app.get("/sub-section/:slug", (req, res) => {
  const slug = req.params.slug;

  const subSectionQuery = `
    SELECT * FROM sub_sections
    WHERE display_slug = ?
  `;

  req.db.query(subSectionQuery, [slug], (err, subResult) => {
    if (err || !subResult.length) {
      return res.send("Sub-section not found");
    }

    const subSection = subResult[0];

    const productsQuery = `
      SELECT *
      FROM products
      WHERE sub_section_id = ?
      ORDER BY id DESC
    `;

    req.db.query(productsQuery, [subSection.id], (err, products) => {
      if (err) {
        return res.send("Error loading products");
      }

      res.render("user/sub-section-products", {
        subSection,
        products
      });
    });
  });
});

/* PRODUCT DETAILS */
app.get("/product/:slug", (req, res) => {
  const slug = req.params.slug;

  const query = `
    SELECT p.*, s.name AS section_name, ss.name AS sub_section_name
    FROM products p
    JOIN sections s ON p.section_id = s.id
    LEFT JOIN sub_sections ss ON p.sub_section_id = ss.id
    WHERE p.display_slug = ?
    LIMIT 1
  `;

  db.query(query, [slug], (err, result) => {
    if (err) {
      console.error("❌ PRODUCT FETCH ERROR:", err);
      return res.send("Error loading product");
    }

    if (!result.length) {
      return res.send("Product not found");
    }

    const product = result[0];

    // 👉 FETCH GALLERY IMAGES
    db.query(
      "SELECT image FROM product_images WHERE product_id = ?",
      [product.id],
      (imgErr, images) => {
        if (imgErr) {
          console.error("❌ IMAGE FETCH ERROR:", imgErr);
          return res.send("Error loading images");
        }

        res.render("user/product-details", {
          product,
          images
        });
      }
    );
  });
});


/* =========================
   ADMIN ROUTES
========================= */

app.use("/admin", adminRoutes);

/* =========================
   SERVER
========================= */

app.listen(PORT, () => {
  console.log(`🚀 AutoKart running at http://localhost:${PORT}`);
});
