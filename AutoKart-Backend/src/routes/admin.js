const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const generateInvoicePDF = require("../utils/invoice");
const generateDealerPDF = require("../utils/dealerPdf");

const router = express.Router();

/* =========================
   MULTER (ADMIN ONLY)
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(
  null,
  path.join(__dirname, "../../../AutoKart-Frontend/public/uploads")),

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
    cb(null, path.join(__dirname, "../../../AutoKart-Frontend/public/uploads/sliders")),
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
  "../../../AutoKart-Frontend/public/uploads/sliders",
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

      const successMessage = req.session.successMessage;
req.session.successMessage = null;

res.render("admin/products", {
  sections,
  products,
  successMessage
});


req.session.successMessage = null; // clear after use

      });
    });
  });


/* =========================
   SAVE PRODUCT
========================= */

router.post(
  "/products",
  upload.fields([
    { name: "product_image", maxCount: 1 },
    { name: "gallery_images[]", maxCount: 5 }
  ]),

  
  (req, res) => {

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
  if (!req.files || !req.files.product_image)
  return res.send("Image upload failed");


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
    req.files.product_image[0].filename,

    displaySlug
  ];

db.query(query, values, (err, result) => {
  if (err) {
    console.error("❌ INSERT ERROR:", err.sqlMessage || err);
    return res.send("Save failed");
  }

  const productId = result.insertId;


 // 👉 SAVE GALLERY IMAGES
if (req.files["gallery_images[]"]) {
  req.files["gallery_images[]"].forEach(file => {
    db.query(
      "INSERT INTO product_images (product_id, image) VALUES (?, ?)",
      [productId, file.filename]
    );
  });
}

req.session.successMessage = "Product added successfully";
res.redirect("/admin/products");

    
});
  }
);

/* =========================
   UPDATE PRODUCT
========================= */
router.post(
  "/products/edit/:id",
  upload.fields([
    { name: "product_image", maxCount: 1 },
    { name: "gallery_images[]", maxCount: 5 }
  ]),
  (req, res) => {
    const db = req.db;
    const productId = req.params.id;

    const {
      section_id,
      sub_section_id,
      product_name,
      price,
      quantity,
      product_description,
      delete_images
    } = req.body;

    const safeSubSectionId =
      sub_section_id && sub_section_id !== ""
        ? parseInt(sub_section_id)
        : null;

    let query, values;

    if (req.files && req.files.product_image) {
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
        req.files.product_image[0].filename,
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
        console.error("❌ UPDATE ERROR:", err);
        return res.send("Update failed");
      }

      // DELETE SELECTED GALLERY IMAGES
      if (delete_images) {
        const ids = Array.isArray(delete_images)
          ? delete_images
          : [delete_images];

        db.query(
          "DELETE FROM product_images WHERE id IN (?)",
          [ids]
        );
      }

      // 👉 REPLACE GALLERY IMAGES (NOT APPEND)
if (req.files && req.files["gallery_images[]"]) {

  // 1️⃣ DELETE OLD GALLERY IMAGES
  db.query(
    "DELETE FROM product_images WHERE product_id = ?",
    [productId],
    err => {
      if (err) {
        console.error("❌ GALLERY DELETE ERROR:", err);
      }

      // 2️⃣ INSERT NEW GALLERY IMAGES
      req.files["gallery_images[]"].forEach(file => {
        db.query(
          "INSERT INTO product_images (product_id, image) VALUES (?, ?)",
          [productId, file.filename]
        );
      });
    }
  );
}
req.session.successMessage = "Product Edited successfully";
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
  "../../../AutoKart-Frontend/public/uploads",
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


/* =========================
   ADMIN ORDERS
========================= */
router.get("/orders", (req, res) => {
  const db = req.db;
  const search = req.query.search || "";

  const ordersQuery = `
    SELECT
      o.order_id,
      o.order_status,
      o.payment_method,
      o.payment_status,

      u.user_first_name,
      u.user_last_name,
      u.user_mobile,

      COUNT(oi.id) AS total_items

    FROM orders o
    JOIN user_create_account u 
      ON o.user_id = u.user_id
    LEFT JOIN order_items oi 
      ON o.order_id = oi.order_id

    WHERE
      o.order_id LIKE ?
      OR u.user_mobile LIKE ?
      OR LOWER(CONCAT(u.user_first_name, ' ', u.user_last_name)) LIKE ?

    GROUP BY o.order_id
    ORDER BY o.id DESC
  `;

  const likeSearch = `%${search.toLowerCase().trim()}%`;

  db.query(
    ordersQuery,
    [likeSearch, likeSearch, likeSearch],
    (err, orders) => {
      if (err) {
        console.error("❌ ORDERS SEARCH ERROR:", err);
        return res.send("Error loading orders");
      }

      res.render("admin/dashboard", {
        page: "orders",
        orders,
        search
      });
    }
  );
});


router.get("/orders/:orderId/invoice", (req, res) => {
  const db = req.db;
  const orderId = req.params.orderId;

  // 1️⃣ Fetch order (NO user_id check – admin can see all)
  const orderSql = `
    SELECT
      o.order_id,
      o.created_at,
      o.payment_method,
      o.payment_status,
      a.full_name,
      a.mobile,
      a.address_type,
      a.address_line,
      a.city,
      a.state,
      a.pincode
    FROM orders o
    JOIN user_addresses a ON o.address_id = a.address_id
    WHERE o.order_id = ?
    LIMIT 1
  `;

  db.query(orderSql, [orderId], (err, orderRows) => {
    if (err || orderRows.length === 0) {
      return res.status(404).send("Order not found");
    }

    const order = orderRows[0];

    // 2️⃣ Fetch items
    const itemsSql = `
      SELECT product_name, price, quantity
      FROM order_items
      WHERE order_id = ?
    `;

    db.query(itemsSql, [orderId], (err, items) => {
      if (err || items.length === 0) {
        return res.status(404).send("No items found");
      }

      // 3️⃣ Calculate total
      let totalAmount = 0;
      items.forEach(i => {
        totalAmount += i.price * i.quantity;
      });

      // 4️⃣ Generate PDF (reuse same function)
      generateInvoicePDF(res, order, items, totalAmount);
    });
  });
});
/* =========================
   ADMIN VIEW ORDER
========================= */

router.get("/orders/:order_id", (req, res) => {
  const db = req.db;
  const orderId = req.params.order_id;

  const orderQuery = `
    SELECT 
      o.order_id,
      o.order_status,
      o.payment_method,
      o.payment_status,
      o.created_at,

      u.user_first_name,
      u.user_last_name,
      u.user_mobile,
      u.user_email

    FROM orders o
    JOIN user_create_account u 
      ON o.user_id = u.user_id
    WHERE o.order_id = ?
  `;

  const itemsQuery = `
    SELECT 
      product_name,
      product_image,
      price,
      quantity
    FROM order_items
    WHERE order_id = ?
  `;

  db.query(orderQuery, [orderId], (err, orderResult) => {
    if (err || orderResult.length === 0) {
      return res.send("Order not found");
    }

    db.query(itemsQuery, [orderId], (err, items) => {
      if (err) return res.send("Error loading order items");

      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += item.price * item.quantity;
      });

      res.render("admin/dashboard", {
        page: "order-view",
        order: {
          ...orderResult[0],   // ✅ FIX
          calculated_total: totalAmount
        },
        items
      });
    });
  });
});

/* =========================
   UPDATE ORDER STATUS
========================= */
router.post("/orders/:order_id/status", async (req, res) => {
  const db = req.db;
  const orderId = req.params.order_id;
  const { order_status } = req.body;

  try {
    /* =========================
       1️⃣ FETCH CURRENT ORDER
    ========================= */
    const [orderRows] = await db
      .promise()
      .query(
        "SELECT order_status, stock_deducted FROM orders WHERE order_id = ?",
        [orderId]
      );

    if (orderRows.length === 0) {
      return res.status(404).send("Order not found");
    }

    const previousStatus = orderRows[0].order_status;
    const stockDeducted = orderRows[0].stock_deducted;

    /* =========================
       2️⃣ BLOCK INVALID CHANGES
    ========================= */
    if (previousStatus === "DELIVERED" || previousStatus === "CANCELLED") {
      return res.send("Order status cannot be changed");
    }

    /* =========================
       3️⃣ UPDATE ORDER STATUS
    ========================= */
    await db
      .promise()
      .query(
        "UPDATE orders SET order_status = ? WHERE order_id = ?",
        [order_status, orderId]
      );

    /* =========================
       4️⃣ DEDUCT STOCK (ONLY ONCE)
       👉 ONLY WHEN MOVING TO SHIPPED
    ========================= */
    if (
      previousStatus !== "SHIPPED" &&
      order_status === "SHIPPED" &&
      stockDeducted === 0
    ) {
      const [items] = await db
        .promise()
        .query(
          "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
          [orderId]
        );

      for (const item of items) {
        const [result] = await db.promise().query(
          `
          UPDATE products
          SET quantity = quantity - ?
          WHERE id = ?
            AND quantity >= ?
          `,
          [item.quantity, item.product_id, item.quantity]
        );

        if (result.affectedRows === 0) {
          return res.send("Insufficient stock for one or more products");
        }
      }

      // ✅ Mark stock as deducted
      await db
        .promise()
        .query(
          "UPDATE orders SET stock_deducted = 1 WHERE order_id = ?",
          [orderId]
        );
    }

    /* =========================
       5️⃣ AUTO PAY COD ON DELIVERY
    ========================= */
    if (order_status === "DELIVERED") {
      await db
        .promise()
        .query(
          "UPDATE orders SET payment_status = 'PAID' WHERE order_id = ?",
          [orderId]
        );
    }

    /* =========================
       6️⃣ REDIRECT BACK
    ========================= */
    return res.redirect(`/admin/orders/${orderId}`);
  } catch (err) {
    console.error("❌ ORDER STATUS UPDATE ERROR:", err);
    return res.send("Status update failed");
  }
});


/* =========================
   SAVE BECOME DEALER FORM
========================= */
router.post("/save_become_dealer_from", function (req, res) {
  const db = req.db;
  const { full_name, mobile, email, city, dealer_type } = req.body;

  if (!full_name || !mobile || !email || !city || !dealer_type) {
    return res.render("become_dealer/become_dealer_from", {
      errorMessage: "All fields are required",
      successMessage: null
    });
  }

  db.query(
    "SELECT id FROM dealers WHERE mobile = ?",
    [mobile],
    function (err, rows) {
      if (err) {
        return res.render("become_dealer/become_dealer_from", {
          errorMessage: "Something went wrong",
          successMessage: null
        });
      }

      if (rows.length > 0) {
        return res.render("become_dealer/become_dealer_from", {
          errorMessage: "Mobile number already registered",
          successMessage: null
        });
      }

      const sql = `
        INSERT INTO dealers
        (full_name, mobile, email, city, dealer_type, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `;

      db.query(sql, [full_name, mobile, email, city, dealer_type], err => {
        if (err) {
          return res.render("become_dealer/become_dealer_from", {
            errorMessage: "Registration failed",
            successMessage: null
          });
        }

        return res.render("become_dealer/become_dealer_from", {
          successMessage:
            "✅ Registration successful. Please check your status using mobile number.",
          errorMessage: null
        });
      });
    }
  );
});

/* =========================
   ADMIN → BECOME DEALER PAGE
========================= */
router.get("/become_dealer", (req, res) => {
  res.render("become_dealer/become_dealer_from", {
    successMessage: null,
    errorMessage: null
  });
});

/* =========================
   ADMIN → DEALER REQUESTS LIST
   ✅ WITH SUMMARY COUNTS
========================= */
router.get("/dealer_requests", (req, res) => {
  const db = req.db;

  const dealersQuery = `
    SELECT * FROM dealers
    ORDER BY created_at DESC
  `;

  const summaryQuery = `
    SELECT
      COUNT(*) AS total,
      SUM(status = 'pending') AS pending,
      SUM(status = 'approved') AS approved,
      SUM(status = 'rejected') AS rejected
    FROM dealers
  `;

  db.query(dealersQuery, (err, dealers) => {
    if (err) return res.send("Error loading dealer requests");

    db.query(summaryQuery, (err, result) => {
      if (err) return res.send("Error loading summary");

      res.render("admin/dealers", {
        dealers,
        summary: result[0]   // 👈 summary dashboard data
      });
    });
  });
});

/* =========================
   ADMIN → DEALER APPROVE
========================= */
router.post("/dealer/approve", (req, res) => {
  const db = req.db;
  const { dealer_id } = req.body;

  db.query(
    "UPDATE dealers SET status = 'approved' WHERE id = ?",
    [dealer_id],
    () => res.redirect("/admin/dealer_requests")
  );
});

/* =========================
   ADMIN → DEALER REJECT
========================= */
router.post("/dealer/reject", (req, res) => {
  const db = req.db;
  const { dealer_id, rejection_reason } = req.body;

  if (!dealer_id || !rejection_reason) {
    return res.send("Reject reason is required");
  }

  db.query(
    `UPDATE dealers
     SET status = 'rejected',
         rejection_reason = ?
     WHERE id = ?`,
    [rejection_reason, dealer_id],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("Database error");
      }
      res.redirect("/admin/dealer_requests");
    }
  );
});

router.get("/dealer/:id/pdf", (req, res) => {
  const db = req.db;
  const dealerId = req.params.id;

  db.query(
    "SELECT * FROM dealers WHERE id = ?",
    [dealerId],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(404).send("Dealer not found");
      }

      generateDealerPDF(res, rows[0]);
    }
  );
});

/* =========================
   DEALER → CHECK STATUS (POST)
========================= */
router.post("/dealer/check_status", (req, res) => {
  const db = req.db;
  const { mobile } = req.body;

  if (!mobile) {
    return res.redirect(
      "/admin/dealer/status_result?error=Please enter mobile number"
    );
  }

  db.query(
    "SELECT full_name, status FROM dealers WHERE mobile = ?",
    [mobile],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.redirect(
          "/admin/dealer/status_result?error=No dealer request found"
        );
      }

      return res.redirect(
        `/admin/dealer/status_result?mobile=${mobile}`
      );
    }
  );
});

/* =========================
   DEALER → STATUS RESULT (GET)
========================= */
router.get("/dealer/status_result", (req, res) => {
  const db = req.db;
  const { mobile, error } = req.query;

  if (error) {
    return res.render("become_dealer/dealer_status", {
      message: error,
      type: "error",
      name: "",
      reason: ""
    });
  }

  if (!mobile) {
    return res.render("become_dealer/dealer_status", {
      message: "Invalid request",
      type: "error",
      name: "",
      reason: ""
    });
  }

  // ✅ rejection_reason pan gheto
  db.query(
    "SELECT full_name, status, rejection_reason FROM dealers WHERE mobile = ?",
    [mobile],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.render("become_dealer/dealer_status", {
          message: "Dealer not found",
          type: "error",
          name: "",
          reason: ""
        });
      }

      const dealer = rows[0];
      let message = "";
      let type = "";

      if (dealer.status === "approved") {
        message =
          "Your request has been APPROVED. Our team will contact you shortly.";
        type = "success";
      } 
      else if (dealer.status === "rejected") {
        message = "Your request has been REJECTED.";
        type = "error";
      } 
      else {
        message = "Your request is currently PENDING.";
        type = "warning";
      }

      res.render("become_dealer/dealer_status", {
  message,
  type,
  name: dealer.full_name || "",
  reason: dealer.rejection_reason || ""
});

    }
  );
});

module.exports = router;
