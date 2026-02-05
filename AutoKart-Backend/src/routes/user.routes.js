const express = require("express");
const router = express.Router();
const generateInvoicePDF = require("../utils/invoice");


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
  if (err) {
  console.error("SECTIONS ERROR >>>>>>>", err);
  return res.status(500).send(err.sqlMessage || err.message || err);
}



    req.db.query(subSectionQuery, (err, subSections) => {
      if (err) {
  console.error("SUB SECTIONS ERROR:", err);
  return res.status(500).send(err.sqlMessage || err.message || err);
}


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


/* =========================
   REGISTER PAGE
========================= */
router.get("/register", (req, res) => {
  res.render("user/Login/register");
});
/* =========================
   REGISTER (SAVE USER)
========================= */
router.post("/register", (req, res) => {
  const {
    user_first_name,
    user_last_name,
    user_user_name,
    user_mobile,
    user_email,
    user_password
  } = req.body;

  // 🔒 Basic validation
  if (
    !user_first_name ||
    !user_last_name ||
    !user_user_name ||
    !user_mobile ||
    !user_email ||
    !user_password
  ) {
    return res.send("All fields are required");
  }

  const insertSql = `
    INSERT INTO user_create_account
    (
      user_first_name,
      user_last_name,
      user_user_name,
      user_mobile,
      user_email,
      user_password
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  req.db.query(
    insertSql,
    [
      user_first_name,
      user_last_name,
      user_user_name,
      user_mobile,
      user_email,
      user_password
    ],
    (err, result) => {
      if (err) {
        console.error("REGISTER ERROR:", err);
        return res.send("Registration failed");
      }

      // ✅ IMPORTANT: DO NOT CREATE SESSION
      // ✅ IMPORTANT: DO NOT LOGIN USER

      // Redirect to login page
      return res.redirect("/customer_login");
    }
  );
});

/* =========================
   LOGIN PAGE
========================= */
router.get("/customer_login", (req, res) => {
  res.render("user/Login/customer_login");
});
/* =========================
   LOGIN (USER)
========================= */
router.post("/customer_login", (req, res) => {
  const { user_user_name, user_password } = req.body;

  // 🔒 Basic validation
  if (!user_user_name || !user_password) {
    return res.send("Please enter username and password");
  }

  // 🔍 Check user credentials
  const sql = `
    SELECT *
    FROM user_create_account
    WHERE user_user_name = ? AND user_password = ?
    LIMIT 1
  `;

  req.db.query(sql, [user_user_name, user_password], (err, results) => {
    if (err) {
      console.error("LOGIN ERROR:", err);
      return res.send("Database error");
    }

    if (results.length === 0) {
      return res.send("Invalid credentials");
    }

    const user = results[0];

    /* =========================
       ✅ CREATE SESSION USER
    ========================= */

    req.session.user = {
      user_id: user.user_id,
      user_user_name: user.user_user_name
    };

    /* =========================
       🔥 FORCE SESSION SAVE
    ========================= */

    req.session.save(saveErr => {
      if (saveErr) {
        console.error("SESSION SAVE ERROR:", saveErr);
        return res.send("Session error");
      }

      /* =========================
         🔗 CLAIM GUEST CART
      ========================= */

      const sessionId = req.sessionID;

      req.db.query(
        `
        UPDATE cart
        SET user_id = ?
        WHERE session_id = ?
          AND user_id IS NULL
        `,
        [user.user_id, sessionId],
        cartErr => {
          if (cartErr) {
            console.error("CART CLAIM ERROR:", cartErr);
          }

          // ✅ LOGIN COMPLETE
          return res.redirect("/");
        }
      );
    });
  });
});

/* =========================
   LOGOUT
========================= */
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("LOGOUT ERROR:", err);
      return res.send("Logout failed");
    }
    res.redirect("/customer_login");
  });
});

/* =========================
   MY PROFILE
========================= */
router.get("/my_profile", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/customer_login");
  }

  const username = req.session.user.user_user_name;

  req.db.query(
    "SELECT * FROM user_create_account WHERE user_user_name = ?",
    [username],
    (err, result) => {
      if (err) return res.send("Database error");
      if (result.length === 0) return res.send("User not found");

      res.render("user/Login/my_profile", {
        user: result[0]
      });
    }
  );
});

router.get("/test-session-write", (req, res) => {
  req.session.test = "hello";
  res.send("session written");
});


/* =========================
   ORDERS PAGE (NO LOGIN BARRIER)
========================= */
router.get("/orders", (req, res) => {
  // 🔐 Auth check
  if (!req.session.user) {
    return res.redirect("/customer_login");
  }

  const userId = req.session.user.user_id;
  console.log("📦 FETCHING ORDERS FOR USER:", userId);

  const ordersSql = `
    SELECT
      o.order_id,
      o.created_at,
      o.order_status,
      o.total_amount,
      o.total_items,
      oi.product_name,
      oi.product_image,
      oi.quantity,
      oi.price
    FROM orders o
    INNER JOIN order_items oi
      ON oi.order_id = o.order_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;

  req.db.query(ordersSql, [userId], (err, orders) => {
    if (err) {
      console.error("❌ ORDERS FETCH ERROR:", err);
      return res.status(500).send("Error loading orders");
    }

    // 🧪 Debug (optional)
    console.log("✅ ORDERS FOUND:", orders.length);

    res.render("user/Login/orders", {
      orders
    });
  });
});

/* =========================
   ORDER DETAILS PAGE
========================= */
router.get("/orders/:orderId", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/customer_login");
  }

  const userId = req.session.user.user_id;
  const orderId = req.params.orderId;

  /* 1️⃣ Fetch order header */
  const orderSql = `
  SELECT
    o.*,
    a.full_name,
    a.mobile,
    a.address_line,
    a.landmark,
    a.city,
    a.state,
    a.pincode,
    a.address_type
  FROM orders o
  JOIN user_addresses a ON o.address_id = a.address_id
  WHERE o.order_id = ?
    AND o.user_id = ?
  LIMIT 1
`;


  req.db.query(orderSql, [orderId, userId], (err, orderRows) => {
    if (err || orderRows.length === 0) {
      return res.send("Order not found");
    }

    const order = orderRows[0];

    /* 2️⃣ Fetch order items */
    const itemsSql = `
      SELECT
        product_name,
        product_image,
        price,
        quantity
      FROM order_items
      WHERE order_id = ?
    `;

    req.db.query(itemsSql, [orderId], (err, items) => {
      if (err || items.length === 0) {
        return res.send("No items found for this order");
      }

      /* 3️⃣ Calculate total safely */
      let totalAmount = 0;
      items.forEach(i => {
        totalAmount += i.price * i.quantity;
      });

      res.render("user/Login/order_details", {
        order,
        items,
        totalAmount
      });
    });
  });
});

/* =========================
   DOWNLOAD INVOICE
========================= */
router.get("/orders/:orderId/invoice", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/customer_login");
  }

  const userId = req.session.user.user_id;
  const orderId = req.params.orderId;

  /* 1️⃣ Fetch order */
 const orderSql = `
  SELECT
    o.order_id,
    o.created_at,
    o.payment_method,
    a.full_name,
    a.mobile,
    a.address_type,
    a.address_line,
    a.city,
    a.state,
    a.pincode
  FROM orders o
  JOIN user_addresses a
    ON o.address_id = a.address_id
  WHERE o.order_id = ?
    AND o.user_id = ?
  LIMIT 1
`;


  req.db.query(orderSql, [orderId, userId], (err, orderRows) => {
    if (err || orderRows.length === 0) {
      return res.status(404).send("Order not found");
    }

    const order = orderRows[0];

    /* 2️⃣ Fetch order items */
    const itemsSql = `
      SELECT
        product_name,
        price,
        quantity
      FROM order_items
      WHERE order_id = ?
        AND user_id = ?
    `;

    req.db.query(itemsSql, [orderId, userId], (err, items) => {
      if (err || items.length === 0) {
        return res.status(404).send("No items found");
      }

      /* 3️⃣ Calculate total */
      let totalAmount = 0;
      items.forEach(i => {
        totalAmount += i.price * i.quantity;
      });

      /* 4️⃣ GENERATE PDF */
      generateInvoicePDF(res, order, items, totalAmount);
    });
  });
});



router.post("/orders/:orderId/cancel", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/customer_login");
  }

  const userId = req.session.user.user_id;
  const orderId = req.params.orderId;

  /* =========================
     1️⃣ VERIFY ORDER
  ========================= */
  const checkSql = `
    SELECT order_status
    FROM orders
    WHERE order_id = ?
      AND user_id = ?
    LIMIT 1
  `;

  req.db.query(checkSql, [orderId, userId], (err, rows) => {
    if (err || rows.length === 0) {
      return res.send("Order not found");
    }

    const status = rows[0].order_status;

    // ❌ BLOCK IF ALREADY SHIPPED
    if (!["PLACED", "CONFIRMED"].includes(status)) {
      return res.send("Order cannot be cancelled at this stage");
    }

    /* =========================
       2️⃣ DELETE ORDER ITEMS
    ========================= */
    req.db.query(
      "DELETE FROM order_items WHERE order_id = ?",
      [orderId],
      err => {
        if (err) {
          console.error("❌ ORDER ITEMS DELETE ERROR:", err);
          return res.send("Cancel failed");
        }

        /* =========================
           3️⃣ DELETE ORDER
        ========================= */
        req.db.query(
          "DELETE FROM orders WHERE order_id = ?",
          [orderId],
          err => {
            if (err) {
              console.error("❌ ORDER DELETE ERROR:", err);
              return res.send("Cancel failed");
            }

            console.log("❌ ORDER CANCELLED:", orderId);

            return res.redirect("/orders");
          }
        );
      }
    );
  });
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

  console.log("SESSION ID:", sessionId);
  console.log("SESSION USER:", req.session.user);

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
    if (err) {
      console.error("CART FETCH ERROR:", err);
      return res.send("Cart error");
    }

    console.log("CART ROWS:", cart.length);
    res.render("user/cart", { cart });
  });
});


// Get cart count API
router.get("/cart-count", (req, res) => {
    const sessionId = req.sessionID;
    req.db.query(
        "SELECT SUM(quantity) AS count FROM cart WHERE session_id = ?",
        [sessionId],
        (err, rows) => {
            if (err) return res.json({ count: 0 });
            res.json({ count: rows[0].count || 0 });
        }
    );
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
    return res.json({ success: false, message: "Product missing" });
  }

  const checkSql =
    "SELECT * FROM cart WHERE session_id = ? AND product_id = ?";

  db.query(checkSql, [sessionId, productId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.json({ success: false });
    }

    // 🔁 UPDATE QUANTITY
    if (rows.length > 0) {
      db.query(
        "UPDATE cart SET quantity = quantity + 1 WHERE session_id = ? AND product_id = ?",
        [sessionId, productId],
        err => {
          if (err) return res.json({ success: false });
          return res.json({ success: true });
        }
      );
    }

    // ➕ INSERT NEW
    else {
      db.query(
        "INSERT INTO cart (session_id, product_id, quantity) VALUES (?, ?, ?)",
        [sessionId, productId, qty || 1],
        err => {
          if (err) return res.json({ success: false });
          return res.json({ success: true });
        }
      );
    }
  });
});


router.get("/create-checkout", (req, res) => {
  return res.redirect("/cart");
});


router.post("/create-checkout", (req, res) => {
  console.log("✅ POST /create-checkout HIT");

  if (!req.session.user) {
    return res.redirect("/customer_login");
  }

  const userId = req.session.user.user_id;
  const sessionId = req.sessionID;
  const productId = req.body.product_id; // buy-now
  const checkoutId = "CHK" + Date.now();
  console.log("🔥 /create-checkout HIT");

  let itemsSql;
  let params;

  // 🟠 BUY NOW
  if (productId) {
    itemsSql = `
      SELECT
        p.id AS product_id,
        1 AS quantity,
        p.product_name,
        p.image,
        p.price
      FROM products p
      WHERE p.id = ?
      LIMIT 1
    `;
    params = [productId];
  }
  // 🔵 CART
  else {
    itemsSql = `
      SELECT
        c.product_id,
        c.quantity,
        p.product_name,
        p.image,
        p.price
      FROM cart c
      JOIN products p ON p.id = c.product_id
      WHERE c.session_id = ?
    `;
    params = [sessionId];
  }

  req.db.query(itemsSql, params, (err, items) => {
    if (err || items.length === 0) {
      return res.send("Nothing to checkout");
    }

    let totalAmount = 0;
    let totalItems = 0;

    items.forEach(i => {
      totalAmount += i.price * i.quantity;
      totalItems += i.quantity;

    });



    // 1️⃣ CREATE CHECKOUT SESSION
  req.db.query(
`
INSERT INTO checkout_sessions
(
  checkout_id,
  user_id,
  session_id,
  mode,
  status,
  total_amount,
  total_items
)
VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
`,
[
  checkoutId,
  userId,
  sessionId,
  productId ? "BUY_NOW" : "CART",
  totalAmount,
  totalItems
],


      err => {
        if (err) {
  console.error("CHECKOUT INSERT ERROR 👉", err);
  return res.send("Checkout failed");
}


        // 2️⃣ INSERT CHECKOUT ITEMS
        const values = items.map(i => [
          checkoutId,
          userId,
          i.product_id,
          i.product_name,
          i.image,
          i.price,
          i.quantity
        ]);

        req.db.query(
          `
          INSERT INTO checkout_session_items
          (checkout_id, user_id, product_id, product_name, product_image, price, quantity)
          VALUES ?
          `,
          [values],
          err => {
            if (err) {
  console.error("CHECKOUT INSERT ERROR 👉", err);
  return res.send("Checkout failed");
}
    /* =====================================================
   🔧 SAVE TOTALS INTO CHECKOUT SESSION (CRITICAL)
===================================================== */

            // 3️⃣ REDIRECT TO CHECKOUT PAGE
            res.redirect(`/checkout?checkout_id=${checkoutId}`);
          }
        );
      }
    );
  });
});










/* =========================
   CHECKOUT (AMAZON / FLIPKART STYLE)
   SOURCE: checkout_sessions
========================= */
router.get("/checkout", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/customer_login");
  }

  const userId = req.session.user.user_id;
  const checkoutId = req.query.checkout_id;

  if (!checkoutId) {
    return res.send("Checkout session missing");
  }

  /* =========================
     1️⃣ FETCH CHECKOUT SESSION
  ========================= */
  const checkoutSql = `
    SELECT checkout_id, total_amount, total_items, status
    FROM checkout_sessions
    WHERE checkout_id = ?
      AND user_id = ?
      AND status = 'ACTIVE'
    LIMIT 1
  `;

  req.db.query(checkoutSql, [checkoutId, userId], (err, checkoutRows) => {
    if (err || checkoutRows.length === 0) {
      console.error("❌ CHECKOUT SESSION ERROR:", err);
      return res.send("Invalid checkout session");
    }

    const checkout = checkoutRows[0];

    /* =========================
       2️⃣ FETCH CHECKOUT ITEMS
    ========================= */
    const itemsSql = `
      SELECT product_id, product_name, product_image, price, quantity
      FROM checkout_session_items
      WHERE checkout_id = ?
        AND user_id = ?
    `;

    req.db.query(itemsSql, [checkoutId, userId], (err, items) => {
      if (err || items.length === 0) {
        console.error("❌ CHECKOUT ITEMS ERROR:", err);
        return res.send("Checkout items missing");
      }

      /* =========================
         3️⃣ FETCH LATEST ADDRESS
      ========================= */
      const addressSql = `
        SELECT *
        FROM user_addresses
        WHERE user_id = ?
        ORDER BY created_at DESC

      `;

      req.db.query(addressSql, [userId], (addrErr, addressRows) => {
        if (addrErr) {
          console.error("❌ ADDRESS FETCH ERROR:", addrErr);
          return res.send("Address error");
        }

       const addresses = addressRows;
let selectedAddress = null;

// if user selected an address from modal
if (req.session.selectedAddressId) {
  selectedAddress = addresses.find(
    a => a.address_id == req.session.selectedAddressId
  );
}

// fallback: first address
if (!selectedAddress && addresses.length > 0) {
  selectedAddress = addresses[0];
}


res.render("user/checkout", {
  checkout,
  items,
  addresses,
  selectedAddress
});


      });
    });
  });
});



router.post("/select-address", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ success: false });
  }

  const userId = req.session.user.user_id;
  const { address_id } = req.body;

  req.db.query(
    `
    UPDATE user_addresses
    SET is_selected = CASE
      WHEN address_id = ? THEN 1
      ELSE 0
    END
    WHERE user_id = ?
    `,
    [address_id, userId],
    err => {
      if (err) {
        console.error("❌ ADDRESS SELECT ERROR:", err);
        return res.json({ success: false });
      }

      return res.json({ success: true });
    }
  );
});


router.post("/checkout/select-address", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false });
  }

  const userId = req.session.user.user_id;
  const { address_id } = req.body;

  // save selected address in session
  req.session.selectedAddressId = address_id;

  res.json({ success: true });
});

/* =========================
   PAY (CHECKOUT FLOW)
========================= */
router.post("/pay", (req, res) => {
  const paymentMethod = req.body.paymentMethod?.toUpperCase();
  const checkoutId = req.body.checkout_id;

  console.log("REQ BODY 👉", req.body);
  console.log("PAYMENT METHOD 👉", paymentMethod);
  console.log("CHECKOUT ID 👉", checkoutId);

  /* =========================
     AUTH CHECK
  ========================= */
  if (!req.session.user) {
    return res.redirect("/customer_login");
  }

  if (!checkoutId) {
    return res.send("Checkout session missing");
  }

  if (paymentMethod !== "COD") {
    return res.send("Invalid payment method");
  }

  const userId = req.session.user.user_id;
  const sessionId = req.sessionID;

  /* =====================================================
     1️⃣ FETCH CHECKOUT SESSION
  ===================================================== */
  const checkoutSql = `
    SELECT *
    FROM checkout_sessions
    WHERE checkout_id = ?
      AND user_id = ?
      AND status = 'ACTIVE'
    LIMIT 1
  `;

  req.db.query(checkoutSql, [checkoutId, userId], (err, checkoutRows) => {
    if (err) {
      console.error("❌ CHECKOUT FETCH ERROR:", err);
      return res.send("Order failed");
    }

    if (checkoutRows.length === 0) {
      return res.send("Invalid or expired checkout session");
    }

    const checkout = checkoutRows[0];

    /* =====================================================
       2️⃣ FETCH CHECKOUT SESSION ITEMS
    ===================================================== */
    const itemsSql = `
      SELECT *
      FROM checkout_session_items
      WHERE checkout_id = ?
        AND user_id = ?
    `;

    req.db.query(itemsSql, [checkoutId, userId], (err, items) => {
      if (err) {
        console.error("❌ CHECKOUT ITEMS ERROR:", err);
        return res.send("Order failed");
      }

      if (items.length === 0) {
        return res.send("No items found for checkout");
      }


 // 3.5️⃣ FETCH SELECTED ADDRESS
const addressSql = req.session.selectedAddressId
  ? `
      SELECT *
      FROM user_addresses
      WHERE address_id = ?
        AND user_id = ?
      LIMIT 1
    `
  : `
      SELECT *
      FROM user_addresses
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

const params = req.session.selectedAddressId
  ? [req.session.selectedAddressId, userId]
  : [userId];

req.db.query(addressSql, params, (addrErr, addrRows) => {
  if (addrErr || addrRows.length === 0) {
    return res.send("Address not found");
  }

  const address = addrRows[0];


    /* =====================================================
       3️⃣ CREATE ORDER
    ===================================================== */
    const orderId = "ORD" + Date.now();

    const orderSql = `
  INSERT INTO orders
  (
    order_id,
    user_id,
    checkout_id,
    address_id,
    total_amount,
    total_items,
    order_status,
    payment_method,
    payment_status
  )
  VALUES (?, ?, ?, ?, ?, ?, 'PLACED', 'COD', 'PENDING')
`;



   req.db.query(
  orderSql,
  [
    orderId,
    userId,
    checkoutId,
    address.address_id, // 🔥 THIS LINE
    checkout.total_amount,
    checkout.total_items
  ],

      err => {
        if (err) {
          console.error("❌ ORDER INSERT ERROR:", err);
          return res.send("Order failed");
        }

          /* =====================================================
             4️⃣ INSERT ORDER ITEMS
          ===================================================== */
          const orderItemsSql = `
            INSERT INTO order_items
            (
              order_id,
              user_id,
              product_id,
              product_name,
              product_image,
              price,
              quantity
            )
            VALUES ?
          `;

          const orderItemValues = items.map(item => [
            orderId,
            userId,
            item.product_id,
            item.product_name,
            item.product_image,
            item.price,
            item.quantity
          ]);

          req.db.query(orderItemsSql, [orderItemValues], err => {
            if (err) {
              console.error("❌ ORDER ITEMS INSERT ERROR:", err);
              return res.send("Order failed");
            }

            /* =====================================================
   5️⃣ MARK CHECKOUT SESSION COMPLETED
===================================================== */
const updateCheckoutSql = `
  UPDATE checkout_sessions
  SET status = 'COMPLETED',
      payment_method = 'COD',
      payment_status = 'PENDING'
  WHERE checkout_id = ?
`;

req.db.query(updateCheckoutSql, [checkoutId], err => {
  if (err) {
    console.error("❌ CHECKOUT UPDATE ERROR:", err);
    return res.send("Order failed");
  }

  /* =====================================================
     6️⃣ CLEAR CART (ONLY IF CART CHECKOUT)
  ===================================================== */

  if (checkout.mode === "CART") {
    req.db.query(
      "DELETE FROM cart WHERE session_id = ?",
      [sessionId],
      err => {
        if (err) {
          console.error("❌ CART CLEAR ERROR:", err);
        } else {
          console.log("🧹 CART CLEARED (CART CHECKOUT)");
        }

        console.log("✅ ORDER PLACED SUCCESSFULLY:", orderId);
        return res.redirect("/payment-success?method=COD");
      }
    );
  } else {
    // BUY NOW → DO NOT TOUCH CART
    console.log("🛒 BUY NOW ORDER → CART PRESERVED");
    console.log("✅ ORDER PLACED SUCCESSFULLY:", orderId);

    return res.redirect("/payment-success?method=COD");
  }
});
          });
          });
        }
      );
    });
  });
});

router.post("/save-address", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false });
  }

  const userId = req.session.user.user_id;

  const {
    address_id,
    full_name,
    mobile,
    address_line,
    landmark,
    city,
    state,
    pincode,
    address_type
  } = req.body;

  console.log("📦 SAVE ADDRESS:", req.body);

  // ======================
  // UPDATE ADDRESS
  // ======================
  if (address_id) {
    req.db.query(
      `
      UPDATE user_addresses
      SET
        full_name = ?,
        mobile = ?,
        address_line = ?,
        landmark = ?,
        city = ?,
        state = ?,
        pincode = ?,
        address_type = ?
      WHERE address_id = ?
        AND user_id = ?
      `,
      [
        full_name,
        mobile,
        address_line,
        landmark,
        city,
        state,
        pincode,
        address_type,
        address_id,
        userId
      ],
      (err, result) => {
        if (err) {
          console.error("❌ ADDRESS UPDATE ERROR:", err);
          return res.json({ success: false });
        }

        console.log("✅ ADDRESS UPDATED");
        return res.json({ success: true, action: "updated" });
      }
    );
    return; // 🔴 VERY IMPORTANT
  }

  // ======================
  // INSERT ADDRESS
  // ======================
  req.db.query(
    `
    INSERT INTO user_addresses
    (
      user_id,
      full_name,
      mobile,
      address_line,
      landmark,
      city,
      state,
      pincode,
      address_type
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      full_name,
      mobile,
      address_line,
      landmark,
      city,
      state,
      pincode,
      address_type
    ],
    (err, result) => {
      if (err) {
        console.error("❌ ADDRESS INSERT ERROR:", err);
        return res.json({ success: false });
      }

      console.log("✅ ADDRESS INSERTED");
      return res.json({ success: true, action: "inserted" });
    }
  );
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




router.get("/dealer", (req, res) => {
  res.render("become_dealer/become_dealer");
});

router.get("/dealer__login", (req, res) => {
  res.render("become_dealer/dealer_login");
});

router.get("/dealer_start_selling", (req, res) => {
  res.render("become_dealer/start_selling");
});

router.get("/payment_cycle", (req, res) => {
  res.render("become_dealer/payment_cycle");
});

router.post("/dealer/register", (req, res) => {
  const db = req.db;

  const {
    full_name,
    mobile,
    email,
    city,
    dealer_type
  } = req.body;

  // Basic validation (NO password)
  if (!full_name || !mobile || !email || !city || !dealer_type) {
    return res.status(400).send("All fields are required");
  }

  // Check if mobile already exists
  db.query(
    "SELECT id FROM dealers WHERE mobile = ?",
    [mobile],
    (err, rows) => {
      if (err) {
        console.error("Duplicate check error:", err);
        return res.status(500).send("Something went wrong");
      }

      if (rows.length > 0) {
        return res.status(409).send("Mobile already registered");
      }

      // Insert new dealer
      db.query(
        `
        INSERT INTO dealers
        (full_name, mobile, email, city, dealer_type, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
        `,
        [full_name, mobile, email, city, dealer_type],
        err => {
          if (err) {
            console.error("Insert error:", err);
            return res.status(500).send("Registration failed");
          }

          res.status(201).send("Dealer registered successfully");
        }
      );
    }
  );
});



//contact//
router.get("/contact", (req, res) => {
  res.render("user/contact");

});


module.exports = router;