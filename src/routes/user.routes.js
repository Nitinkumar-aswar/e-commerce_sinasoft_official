const express = require("express");
const router = express.Router();

/* =========================
   HOME PAGE
========================= */

router.get("/", (req, res) => {
  const db = req.db;

  const sectionQuery = "SELECT id, name FROM sections";
  const productQuery = `
    SELECT *
    FROM products
    ORDER BY id DESC
  `;

  db.query(sectionQuery, (err, sections) => {
    if (err) return res.send("Error loading sections");

    db.query(productQuery, (err, products) => {
      if (err) return res.send("Error loading products");

      const productsBySection = {};
      products.forEach(p => {
        if (!productsBySection[p.section_id]) {
          productsBySection[p.section_id] = [];
        }
        productsBySection[p.section_id].push(p);
      });

      res.render("user/home", {
        sections,
        productsBySection
      });
    });
  });
});

/* =========================
   SHOP – ALL PRODUCTS
========================= */
router.get("/shop", (req, res) => {
  const db = req.db;
  const type = req.query.type;

  let query = `
    SELECT 
      products.*,
      sections.name AS section_name
    FROM products
    JOIN sections ON products.section_id = sections.id
  `;

  if (type === "new") {
    query += " ORDER BY products.id DESC";
  } else if (type === "best") {
    query += " ORDER BY products.quantity DESC";
  } else if (type === "trending") {
    query += " ORDER BY products.price DESC";
  } else {
    query += " ORDER BY products.id DESC";
  }

  db.query(query, (err, products) => {
    if (err) return res.send("Error loading shop");

    res.render("user/shop", {
      products,
      type
    });
  });
});


/* =========================
   SUB-SECTION PRODUCTS
========================= */

router.get("/sub-section/:id", (req, res) => {
  const subSectionId = req.params.id;
  const db = req.db;

  const subSectionQuery = `
    SELECT id, name, section_id
    FROM sub_sections
    WHERE id = ?
  `;

  const productQuery = `
    SELECT *
    FROM products
    WHERE sub_section_id = ?
    ORDER BY id DESC
  `;

  db.query(subSectionQuery, [subSectionId], (err, subResult) => {
    if (err || subResult.length === 0) {
      return res.send("Sub-section not found");
    }

    db.query(productQuery, [subSectionId], (err, products) => {
      if (err) {
        return res.send("Error loading products");
      }

      res.render("user/sub-section-products", {
        subSection: subResult[0],
        products
      });
    });
  });
});



module.exports = router;
