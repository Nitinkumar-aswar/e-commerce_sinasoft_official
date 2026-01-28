const express = require("express");
const router = express.Router();

/* =========================
   USER ROUTES
========================= */

/* HOME */
router.get("/", (req, res) => {
  const sectionQuery = `SELECT id, name, display_slug FROM sections`;
  const subSectionQuery = `SELECT id, name, section_id, display_slug FROM sub_sections`;
  const productQuery = `SELECT * FROM products WHERE is_active = 1`;
  const sliderQuery = `SELECT * FROM sliders WHERE status = 'active'`;

  req.db.query(sectionQuery, (err, sections) => {
    if (err) return res.send("Error loading sections");

    req.db.query(subSectionQuery, (err, subSections) => {
      if (err) return res.send("Error loading sub-sections");

      req.db.query(productQuery, (err, products) => {
        if (err) return res.send("Error loading products");

        req.db.query(sliderQuery, (err, sliders) => {
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


router.get("/test-session-write", (req, res) => {
  req.session.test = "hello";
  res.send("session written");
});


/* SHOP */
router.get("/shop", (req, res) => {
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

  req.db.query(query, (err, products) => {
    if (err) return res.send("Error loading shop");
    res.render("user/shop", { products });
  });
});

/* SECTION PRODUCTS */
router.get("/section/:id", (req, res) => {
  const sectionId = req.params.id.split("-")[0];

  req.db.query(
    "SELECT * FROM sections WHERE id = ?",
    [sectionId],
    (err, section) => {
      if (err || !section.length) return res.send("Section not found");

      req.db.query(
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
router.get("/sub-section/:slug", (req, res) => {
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
router.get("/product/:slug", (req, res) => {
  const slug = req.params.slug;

  const query = `
    SELECT p.*, s.name AS section_name, ss.name AS sub_section_name
    FROM products p
    JOIN sections s ON p.section_id = s.id
    LEFT JOIN sub_sections ss ON p.sub_section_id = ss.id
    WHERE p.display_slug = ?
    LIMIT 1
  `;

  req.db.query(query, [slug], (err, result) => {
    if (err) {
      console.error("❌ PRODUCT FETCH ERROR:", err);
      return res.send("Error loading product");
    }

    if (!result.length) {
      return res.send("Product not found");
    }

    const product = result[0];

    // 👉 FETCH GALLERY IMAGES
    req.db.query(
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
  SEARCH BOX
========================= */
router.get("/search", (req, res) => {
  const q = req.query.q;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const sql = `
    SELECT id, product_name, image, price
    FROM products
    WHERE product_name LIKE ?
    LIMIT 6
  `;

  req.db.query(sql, [`%${q}%`], (err, results) => {
    if (err) {
      console.error(err);
      return res.json([]);
    }

    res.json(results);
  });
});
router.get("/api/search", (req, res) => {
  const q = req.query.q;

  const sql = `
    SELECT id, product_name, price, image, display_slug
    FROM products
    WHERE product_name LIKE ?
    LIMIT 5
  `;

  req.db.query(sql, [`%${q}%`], (err, results) => {
    if (err) return res.json([]);
    res.json(results);
  });
});

/* =========================
   CART PAGE
========================= */

router.get("/cart", (req, res) => {
 const sessionId = req.sessionID;


  const query = `
    SELECT 
      c.product_id,
      c.quantity,
      p.product_name,
      p.price,
      p.image
    FROM cart c
    JOIN products p ON p.id = c.product_id
    WHERE c.session_id = ?
  `;

  req.db.query(query, [sessionId], (err, cart) => {
    if (err) return res.send("Cart error");

    res.render("user/cart", { cart });
  });
});



router.post("/cart/update", (req, res) => {
  const { product_id, action } = req.body;
  const sessionId = req.sessionID;

  const sql =
    action === "increase"
      ? "UPDATE cart SET quantity = quantity + 1 WHERE session_id = ? AND product_id = ?"
      : "UPDATE cart SET quantity = GREATEST(quantity - 1, 1) WHERE session_id = ? AND product_id = ?";

  req.db.query(sql, [sessionId, product_id], err => {
    if (err) {
      console.error(err);
    }

    // ✅ THIS IS THE FIX
    res.redirect("/cart");
  });
});



router.post("/cart/remove", (req, res) => {
  const { product_id } = req.body;
 const sessionId = req.sessionID;


  req.db.query(
    "DELETE FROM cart WHERE session_id = ? AND product_id = ?",
    [sessionId, product_id],
    () => {
      res.redirect("/cart");
    }
  );
});



/* =========================
   ADD TO CART (DB)
========================= */
router.post("/add-to-cart", (req, res) => {
  const db = req.db;
  const { productId, qty } = req.body;
  const sessionId = req.sessionID;

  if (!productId) {
    return res.json({ success: false });
  }

  const checkSql =
    "SELECT * FROM cart WHERE session_id = ? AND product_id = ?";

  db.query(checkSql, [sessionId, productId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.json({ success: false });
    }

    if (rows.length > 0) {
      db.query(
        "UPDATE cart SET quantity = quantity + 1 WHERE session_id = ? AND product_id = ?",
        [sessionId, productId],
        err => {
          if (err) return res.json({ success: false });
         res.redirect("/cart");

        }
      );
    } else {
      db.query(
        "INSERT INTO cart (session_id, product_id, quantity) VALUES (?, ?, ?)",
        [sessionId, productId, qty || 1],
        err => {
          if (err) return res.json({ success: false });
          res.redirect("/cart");

        }
      );
    }
  });
});


/* =========================
   CHECKOUT (BUY NOW + CART)
========================= */

router.get("/checkout", (req, res) => {
  const type = req.query.type;
  const sessionId = req.sessionID;

  const address = {
    name: "Darshan Yadav",
    address: "17 Kartikeyan Boys Hostel, Tathawade",
    city: "Pimpri Chinchwad",
    state: "Maharashtra",
    pincode: "411033"
  };

  // 🟠 BUY NOW FLOW
  if (type === "buy-now") {
    const productId = req.query.productId;

    if (!productId) {
      return res.send("Product missing");
    }

    const sql = `
      SELECT id, product_name, price, image
      FROM products
      WHERE id = ?
      LIMIT 1
    `;

    req.db.query(sql, [productId], (err, result) => {
      if (err || !result.length) {
        return res.send("Product not found");
      }

      return res.render("user/checkout", {
        mode: "buy-now",
        product: result[0],
        cart: [],
        address
      });
    });

    return;
  }

  // 🔵 CART FLOW (DEFAULT)
  const cartSql = `
    SELECT 
      p.id,
      p.product_name,
      p.price,
      p.image,
      c.quantity
    FROM cart c
    JOIN products p ON p.id = c.product_id
    WHERE c.session_id = ?
  `;

  req.db.query(cartSql, [sessionId], (err, cart) => {
    if (err) {
      return res.send("Cart error");
    }

    return res.render("user/checkout", {
      mode: "cart",
      product: null,
      cart,
      address
    });
  });
});

/* =========================
   PAY (CHECKOUT FLOW)
========================= */

router.post("/pay", (req, res) => {
  const { productId, paymentMethod } = req.body;

  // 🔒 Basic validation
  if (!paymentMethod) {
    return res.status(400).send("Payment method is required");
  }

  console.log("PAY REQUEST RECEIVED");
  console.log("Payment Method:", paymentMethod);

  // 🟠 BUY NOW FLOW
  if (productId) {
    console.log("Checkout Type: BUY NOW");
    console.log("Product ID:", productId);
  }

  // 🔵 CART FLOW
  else {
    console.log("Checkout Type: CART");
  }

  // 🚚 CASH ON DELIVERY → instant success
  if (paymentMethod === "cod") {
    return res.redirect("/payment-success?method=cod");
  }

  /*
    💳 ONLINE PAYMENTS (SIMULATED)
    --------------------------------
    Card / UPI / Net Banking
    Payment gateway will be integrated later
  */

  return res.redirect(`/payment-success?method=${paymentMethod}`);
});


/* =========================
   PAYMENT SUCCESS (TEMP)
========================= */

router.get("/payment-success", (req, res) => {
  const method = req.query.method || "unknown";

  res.render("user/payment-success", {
    method
  });
});


module.exports = router;
