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






// router.post("/save_autokart_account", async (req, res) => {
//   try {
//     const d = req.body;

//     // Validation
//     if (!d.user_first_name || !d.user_last_name || !d.user_user_name || !d.user_mobile || !d.user_email || !d.user_password) {
//       return res.send("Please fill all fields");
//     }

//     // Check if username already exists
//     const checkQuery = "SELECT * FROM user_create_account WHERE user_user_name = ?";
//     req.db.query(checkQuery, [d.user_user_name], async (err, results) => {
//       if (err) {
//         console.log(err);
//         return res.send("Database error");
//       }

//       if (results.length > 0) {
//         return res.send("Username already exists");
//       }

//       // Insert new user
//       const insertQuery = `
//         INSERT INTO user_create_account
//         (user_first_name, user_last_name, user_user_name, user_mobile, user_email, user_password)
//         VALUES (?, ?, ?, ?, ?, ?)
//       `;

//       req.db.query(
//         insertQuery,
//         [d.user_first_name, d.user_last_name, d.user_user_name, d.user_mobile, d.user_email, d.user_password],
//         (err2, result2) => {
//           if (err2) {
//             console.log(err2);
//             return res.send("Failed to save account");
//           }

//           res.redirect("/admin/register"); // success – redirect back to register page
//         }
//       );
//     });
//   } catch (error) {
//     console.log(error);
//     res.send("Something went wrong");
//   }
// });



/* =========================
   SAVE AUTOKART ACCOUNT
========================= */



// router.post("/login_autokart_account", (req, res) => {
//   const { user_user_name, user_password } = req.body;

//   if (!user_user_name || !user_password) {
//     return res.send("Please enter username and password");
//   }

//   // Query database
//   const query = `
//     SELECT * FROM user_create_account 
//     WHERE user_user_name = ? AND user_password = ?
//   `;

//   req.db.query(query, [user_user_name, user_password], (err, results) => {
//     if (err) {
//       console.log(err);
//       return res.send("Database error");
//     }

//     if (results.length > 0) {
//       // Save session
//       req.session.user = {
//         id: results[0].id,
//         username: results[0].user_user_name
//       };

//       // Redirect to dashboard or kart page
//       return res.redirect("/");
//     } else {
//       return res.send("Login Failed: Invalid credentials");
//     }
//   });
// });


// login session completed 
// user logout session start 
// LOGOUT ROUTE
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.send("Error logging out");
    }
    res.redirect("/customer_login"); // Login page वर redirect
  });
});
module.exports = router;
