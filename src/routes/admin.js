const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const router = express.Router();

/* =========================
   MULTER (ADMIN ONLY)
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../public/uploads")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only images allowed"), false)
});

/* =========================
   SLIDER MULTER (SEPARATE)
========================= */

const sliderStorage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../public/uploads/sliders")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const uploadSlider = multer({
  storage: sliderStorage,
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only images allowed"), false)
});

/* =========================
   ADMIN DASHBOARD
========================= */

router.get("/", (req, res) => {
  const page = req.query.page || "dashboard";

  if (page === "products") {
    const db = req.db;

    const productQuery = `
      SELECT p.*, s.name AS section_name
      FROM products p
      JOIN sections s ON p.section_id = s.id
      ORDER BY p.id DESC
    `;

    const sectionQuery = "SELECT id, name FROM sections";

    db.query(sectionQuery, (err, sections) => {
      if (err) return res.send("Error");

      db.query(productQuery, (err, products) => {
        if (err) return res.send("Error");

        res.render("admin/dashboard", {
          page: "products",
          products,
          sections
        });
      });
    });

    return;
  }

  res.render("admin/dashboard", { page });
});


/* =========================
   ADMIN SLIDERS
========================= */

router.get("/sliders", (req, res) => {
  const db = req.db;

  db.query("SELECT * FROM sliders ORDER BY id DESC", (err, sliders) => {
    if (err) return res.send("Error loading sliders");

    res.render("admin/dashboard", {
      page: "sliders",
      sliders
    });
  });
});



router.post(
  "/sliders/add",
  uploadSlider.single("image"),
  (req, res) => {
    const db = req.db;

    if (!req.file) return res.send("Image upload failed");

    db.query(
      "INSERT INTO sliders (image, status) VALUES (?, 'active')",
      [req.file.filename],
      err => {
        if (err) return res.send("Slider save failed");
        res.redirect("/admin/sliders");
      }
    );
  }
);
router.get("/sliders/delete/:id", (req, res) => {
  const db = req.db;
  const sliderId = req.params.id;

  db.query(
    "SELECT image FROM sliders WHERE id = ?",
    [sliderId],
    (err, result) => {
      if (err || !result.length) return res.redirect("/admin/sliders");

      const imagePath = path.join(
        __dirname,
        "../public/uploads/sliders",
        result[0].image
      );

      db.query(
        "DELETE FROM sliders WHERE id = ?",
        [sliderId],
        err => {
          if (err) return res.redirect("/admin/sliders");

          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }

          res.redirect("/admin/sliders");
        }
      );
    }
  );
});

/* =========================
   ADMIN PRODUCTS LIST
========================= */

router.get("/products", (req, res) => {
  const db = req.db;

  const sectionQuery = "SELECT id, name FROM sections";

  const productQuery = `
    SELECT 
      p.id,
      p.product_name,
      p.price,
      p.quantity,
      p.image,
      p.section_id,
      p.sub_section_id,
      p.product_description,
      p.display_slug,
      s.name AS section_name
    FROM products p
    JOIN sections s ON p.section_id = s.id
    ORDER BY p.id DESC
  `;

  db.query(sectionQuery, (err, sections) => {
    if (err) return res.send("Error loading sections");

    db.query(productQuery, (err, products) => {
      if (err) return res.send("Error loading products");

      res.render("admin/products", {
        sections,
        products
      });
    });
  });
});

/* =========================
   SAVE PRODUCT
========================= */

router.post("/products", upload.single("product_image"), (req, res) => {
  const db = req.db;
  console.log("REQ BODY:", req.body);

  const {
    section_id,
    sub_section_id,
    product_name,
    price,
    quantity,
    product_description
  } = req.body;

  if (!section_id) return res.send("Section is required");
  if (!product_name || product_name.trim() === "")
    return res.send("Product name is required");
  if (!quantity || isNaN(quantity))
    return res.send("Quantity is required");
  if (!req.file) return res.send("Image upload failed");

  const slugBase = product_name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const displaySlug = `${Date.now()}-${slugBase}`;

  const safeSubSectionId =
    sub_section_id && sub_section_id !== ""
      ? parseInt(sub_section_id)
      : null;

  const query = `
    INSERT INTO products
      (section_id, sub_section_id, product_name, price, quantity, product_description, image, display_slug)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    Number(section_id),
    safeSubSectionId,
    product_name.trim(),
    price || null,
    Number(quantity),
    product_description || null,
    req.file.filename,
    displaySlug
  ];

  db.query(query, values, err => {
    if (err) {
      console.error("❌ INSERT ERROR:", err.sqlMessage || err);
      return res.send("Save failed");
    }
    res.redirect("/admin/products");
  });
});

/* =========================
   UPDATE PRODUCT
========================= */

router.post(
  "/products/edit/:id",
  upload.single("product_image"),
  (req, res) => {
    const db = req.db;
    const productId = req.params.id;

    const {
      section_id,
      sub_section_id,
      product_name,
      price,
      quantity,
      product_description
    } = req.body;

    const safeSubSectionId =
      sub_section_id && sub_section_id !== ""
        ? parseInt(sub_section_id)
        : null;

    let query, values;

    if (req.file) {
      query = `
        UPDATE products SET
          section_id = ?,
          sub_section_id = ?,
          product_name = ?,
          price = ?,
          quantity = ?,
          product_description = ?,
          image = ?
        WHERE id = ?
      `;
      values = [
        section_id,
        safeSubSectionId,
        product_name,
        price,
        quantity,
        product_description,
        req.file.filename,
        productId
      ];
    } else {
      query = `
        UPDATE products SET
          section_id = ?,
          sub_section_id = ?,
          product_name = ?,
          price = ?,
          quantity = ?,
          product_description = ?
        WHERE id = ?
      `;
      values = [
        section_id,
        safeSubSectionId,
        product_name,
        price,
        quantity,
        product_description,
        productId
      ];
    }

    db.query(query, values, err => {
      if (err) {
        console.error("❌ UPDATE ERROR:", err.sqlMessage || err);
        return res.send("Update failed");
      }
      res.redirect("/admin/products");
    });
  }
);

/* =========================
   DELETE PRODUCT
========================= */

router.get("/products/delete/:id", (req, res) => {
  const db = req.db;
  const productId = req.params.id;

  db.query(
    "SELECT image FROM products WHERE id = ?",
    [productId],
    (err, result) => {
      if (err || !result.length)
        return res.send("Product not found");

      const imagePath = path.join(
        __dirname,
        "../public/uploads",
        result[0].image
      );

      db.query(
        "DELETE FROM products WHERE id = ?",
        [productId],
        err => {
          if (err) return res.send("Delete failed");

          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          res.redirect("/admin/products");
        }
      );
    }
  );
});

/* =========================
   API: SUB-SECTIONS
========================= */

router.get("/api/subsections/:sectionId", (req, res) => {
  const db = req.db;

  db.query(
    "SELECT id, name, display_slug FROM sub_sections WHERE section_id = ?",
    [req.params.sectionId],
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    }
  );
});

module.exports = router;
