const express = require("express");
const router = express.Router();

// Import middleware first
const adminAuth = require("../middleware/adminAuth");
const exe = require("./connction");

// --- PUBLIC ROUTES ---
router.get("/", function (req, res) {
  res.render("admin/Home.ejs"); // login page
});

// login API or form POST
router.post("/login_admin_account", async (req, res) => {
  const { email, password } = req.body;
  const data = await exe("SELECT * FROM admin WHERE email=? AND password=?", [email, password]);

  if (data.length > 0) {
    req.session.admin = data[0];
    res.redirect("/admin/slider");
  } else {
    res.send("Invalid email or password");
  }
});

// --- PROTECTED ROUTES ---


// gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggghhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh


// router.use(adminAuth);

router.get("/slider", async (req, res) => {
  const sliders = await exe("SELECT * FROM slider");
  res.render("admin/Slider.ejs", { sliders });
});















router.post("/save_slider",async function(req,res){

  
   if(req.files != null)
   {
        var file_name = new Date().getTime()+req.files.Slider_img.name;
        req.files.Slider_img.mv("public/upload/"+file_name)
   }
   else{
    var file_name="";
   }


   var d=req.body;

    var sql = `INSERT INTO slider (Slider_title, Slider_heading, Slider_img)
    VALUES ('${d.Slider_title}', '${d.Slider_heading}', '${file_name}')`;
  var data =await exe(sql)
//  res.send(data);
res.redirect("/admin/slider");

  
});

// error yet nahi all clear ahe 

// edit slider 



router.get("/edit_slider/:id", async function (req, res) {

    var id = req.params.id;
    var slider_info = await exe(`SELECT * FROM slider WHERE slider_id = '${id}'`);
    var obj = { "slider_info": slider_info[0] };
    res.render("admin/edit_slider.ejs", obj);

});


// // update slider 
// UPDATE SLIDER
router.post("/update_slider", async function (req, res) {

    var d = req.body;
    var file_name = d.old_img; // hidden input मधून

    // ✅ new image आली तर
    if (req.files && req.files.Slider_img) {
        file_name = Date.now() + "_" + req.files.Slider_img.name;
        await req.files.Slider_img.mv("public/upload/" + file_name);
    }

    // ✅ correct SQL
    var sql = `
        UPDATE slider 
        SET Slider_title = '${d.Slider_title}',
            Slider_heading = '${d.Slider_heading}',
            Slider_img = '${file_name}'
        WHERE slider_id = '${d.slider_id}'
    `;

    var data = await exe(sql);
    res.redirect("/admin/slider");
});




// delete slider start 

router.get("/delete_slider/:id", async function (req, res) {
    var id = req.params.id;
    var data = await exe(`DELETE FROM slider WHERE slider_id = '${id}'`)
    res.redirect("/admin/slider");

 

});



// Tractor Start 
router.get("/Tractor", async function (req, res) {
  var data = await exe(`SELECT * FROM tractor_decoration`);
  var obj = { "tractor_dec": data };

  res.render("admin/Tractor_dec.ejs", obj)
});











// Tractor Decoration Save (POST)
router.post("/save_tractor_dec", async (req, res) => {

  let tractor_img = "";

  // ✅ Image upload
  if (req.files && req.files.Tractor_Dec_Img) {
    const file = req.files.Tractor_Dec_Img;
    tractor_img = Date.now() + "_" + file.name;
    await file.mv("public/upload/" + tractor_img);
  }

  const d = req.body;

  // ✅ SQL query (Tractor Decoration)
  const sql = `
    INSERT INTO tractor_decoration
    (tractor_dec_title, tractor_dec_price, tractor_dec_img)
    VALUES
    ('${d.Tractor_Dec_Title}',
     '${d.Tractor_Dec_Price}',
     '${tractor_img}')
  `;

  await exe(sql);

  // ✅ redirect after save
  res.redirect("/admin/Tractor");
});























// data save  Tractor

// edit Tractor 


router.get("/edit_tractor_dec/:id", async function (req, res) {

    var id = req.params.id;
    var Tractor_info = await exe(`SELECT * FROM tractor_decoration WHERE id = '${id}'`);
    var obj = { "Tractor_info": Tractor_info[0] };
    res.render("admin/Tractor_dec_edit.ejs", obj);

});



// update 


// UPDATE SLIDER
// UPDATE TRACTOR DECORATION
router.post("/edit_tractor_dec", async function (req, res) {

    const d = req.body;
    let file = d.old_img; // old image

    // ✅ NEW IMAGE UPLOAD
    if (req.files && req.files.tractor_dec_img) {
        file = Date.now() + "_" + req.files.tractor_dec_img.name;
        await req.files.tractor_dec_img.mv("public/upload/" + file);
    }

    const sql = `
        UPDATE tractor_decoration 
        SET tractor_dec_title = '${d.tractor_dec_title}',
            tractor_dec_price = '${d.tractor_dec_price}',
            tractor_dec_img   = '${file}'
        WHERE id = '${d.Tractor_id}'
    `;

    await exe(sql);
    res.redirect("/admin/Tractor");
});




// edit tractor end 

// delete Tractor dec 

router.get("/delete_tractor_dec/:id", async function (req, res) {
    var id = req.params.id;
    var data = await exe(`DELETE FROM tractor_decoration WHERE id = '${id}'`)
    res.redirect("/admin/Tractor");

 

});



// Vehicle start admin page 

router.get("/Vehicle", async function (req, res) {

  var data = await exe(`SELECT * FROM vehicle_dec`);
  var obj = { "vehicle_dec": data };

  res.render("admin/Vehicle_dec.ejs", obj);
});



router.post("/save_Vehicle_dec", async (req, res) => {

  let vehicle_img = "";

  // ✅ image upload
  if (req.files && req.files.Vehicle_Dec_Img) {

    const file = req.files.Vehicle_Dec_Img;
    vehicle_img = Date.now() + "_" + file.name;

    await file.mv("public/upload/" + vehicle_img);
  }

  const d = req.body;

  // ✅ SQL query (Vehicle Decoration)
const sql = `
INSERT INTO vehicle_dec 
(vehicle_dec_title, vehicle_dec_heading, vehicle_dec_desc, vehicle_dec_img)
VALUES 
('${d.Vehicle_Dec_Title}', '${d.Vehicle_Dec_Heading}', '${d.Vehicle_Dec_Desc}', '${vehicle_img}')
`;

  await exe(sql);

  // ✅ redirect after save
  res.redirect("/admin/Vehicle");
});
//  ok error yet nahi 


// table madhe data print 


// delete Vehicle decoration

router.get("/delete_vehicle_dec/:id", async function (req, res) {

    var id = req.params.id;

    await exe(`DELETE FROM vehicle_dec WHERE vehicle_dec_id = '${id}'`);

    res.redirect("/admin/Vehicle");
});


// edit sathi  desc la pr ahe 





// Vehicle Decoration Edit (GET)
router.get("/edit_vehicle_dec/:id", async function (req, res) {
    var id = req.params.id;

    var vehicle_info = await exe(
        `SELECT * FROM vehicle_dec WHERE vehicle_dec_id = '${id}'`
    );

    var obj = { "vehicle_info": vehicle_info[0] };

    res.render("admin/Vehicle_dec_edit.ejs", obj);
});





// // update 
// // UPDATE VEHICLE DECORATION
// router.post("/edit_vehicle_dec", async (req, res) => {
//     try {
//         const d = req.body;
//         let file_name = d.old_img; // hidden input field for old image

//         // ✅ Check if a new image is uploaded
//         if (req.files && req.files.Vehicle_Dec_Img) {
//             file_name = Date.now() + "_" + req.files.Vehicle_Dec_Img.name;
//             await req.files.Vehicle_Dec_Img.mv("public/upload/" + file_name);
//         }

//         // ✅ Correct SQL query
//         const sql = `
//             UPDATE vehicle_dec
//             SET vehicle_dec_title = '${d.Vehicle_Dec_Title}',
//                 vehicle_dec_heading = '${d.Vehicle_Dec_Heading}',
//                 vehicle_dec_desc = '${d.Vehicle_Dec_Desc}',
//                 vehicle_dec_img = '${file_name}'
//             WHERE vehicle_dec_id = '${d.vehicle_dec_id}'
//         `;

//         await exe(sql);

//         res.redirect("/admin/vehicle_dec"); // redirect to vehicle decoration list page

//     } catch (err) {
//         console.error(err);
//         res.send("Error updating vehicle decoration");
//     }
// });


// UPDATE VEHICLE DECORATION
router.post("/edit_vehicle_dec", async (req, res) => {
    try {
        const d = req.body;
        let vehicle_img = d.old_img; // hidden input field for old image

        // ✅ Check if a new image is uploaded
        if (req.files && req.files.Vehicle_Dec_Img) {
            vehicle_img = Date.now() + "_" + req.files.Vehicle_Dec_Img.name;
            await req.files.Vehicle_Dec_Img.mv("public/upload/" + vehicle_img);
        }

        // ✅ Correct SQL query
        const sql = `
            UPDATE vehicle_dec
            SET vehicle_dec_title = '${d.Vehicle_Dec_Title}',
                vehicle_dec_heading = '${d.Vehicle_Dec_Heading}',
                vehicle_dec_desc = '${d.Vehicle_Dec_Desc}',
                vehicle_dec_img = '${vehicle_img}'
            WHERE vehicle_dec_id = '${d.vehicle_dec_id}'
        `;

        await exe(sql);

        res.redirect("/admin/Vehicle"); // redirect to vehicle decoration list page

    } catch (err) {
        console.error(err);
        res.send("Error updating vehicle decoration");
    }
});










// tushar





// Categories list
router.get("/categories", async (req, res) => {

  var data = await exe(`SELECT * FROM categories`);

  var obj = { "categories": data };

  res.render("admin/categories.ejs", obj);
});






router.post("/save_categories", async (req, res) => {

  let category_img = "";

  if (req.files && req.files.Vehicle_decoration_accessories_img) {
    const file = req.files.Vehicle_decoration_accessories_img;
    category_img = Date.now() + "_" + file.name;
    await file.mv("public/upload/" + category_img);
  }

  const d = req.body;

  const sql = `
    INSERT INTO categories
    (category_title, category_heading, category_desc, category_price, category_img)
    VALUES
    ('${d.Vehicle_decoration_accessories_title}',
     '${d.Vehicle_decoration_accessories_heading}',
     '${d.Vehicle_decoration_accessories_desc}',
     '${d.Vehicle_decoration_accessories_price}',
     '${category_img}')
  `;

  await exe(sql);
  res.redirect("/admin/categories");
});


// table madhe tada print 

// Delete Categories
router.get("/delete_categories/:id", async function (req, res) {

    var id = req.params.id;

    await exe(`DELETE FROM categories WHERE category_id = '${id}'`);

    res.redirect("/admin/categories");
});









// Categories Edit (GET)
router.get("/edit_categories/:id", async function (req, res) {

    var id = req.params.id;

    // select category info by id
    var category_info = await exe(
        `SELECT * FROM categories WHERE category_id = '${id}'`
    );

    // send first record to EJS
    var obj = { "category_info": category_info[0] };

    res.render("admin/categories_edit.ejs", obj);
});






// UPDATE CATEGORIES
router.post("/update_categories", async (req, res) => {
  try {

    const d = req.body;
    let category_img = d.old_img; // hidden input (old image)

    // ✅ new image uploaded?
    if (req.files && req.files.Category_Img) {
      category_img = Date.now() + "_" + req.files.Category_Img.name;
      await req.files.Category_Img.mv("public/upload/" + category_img);
    }

    // ✅ SQL UPDATE query
    const sql = `
      UPDATE categories
      SET category_title   = '${d.Category_Title}',
          category_heading = '${d.Category_Heading}',
          category_desc    = '${d.Category_Desc}',
          category_price   = '${d.Category_Price}',
          category_img     = '${category_img}'
      WHERE category_id = '${d.category_id}'
    `;

    await exe(sql);

    res.redirect("/admin/categories");

  } catch (err) {
    console.error(err);
    res.send("Error updating category");
  }
});



// tushar end 







// Electronics session start 
router.get("/Electronics", async (req, res) => {

 
    // DB मधून सर्व Electronics fetch करा
        var data = await exe(`SELECT * FROM electronics`);

        // EJS template ला object पाठवा
        var obj = { "electronics": data };
  res.render("admin/Electronics.ejs",obj);
});





router.post("/save_electronics", async (req, res) => {

  let electronics_img = "";

  // file upload handle
  if (req.files && req.files.electronics_img) {
    const file = req.files.electronics_img;
    electronics_img = Date.now() + "_" + file.name;
    await file.mv("public/upload/" + electronics_img);
  }

  const d = req.body;

  const sql = `
    INSERT INTO electronics
    (title, brand, description, price, img)
    VALUES
    ('${d.electronics_title}',
     '${d.electronics_brand}',
     '${d.electronics_desc}',
     '${d.electronics_price}',
     '${electronics_img}')
  `;

  try {
    await exe(sql);
    res.redirect("/admin/Electronics");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


// run hot nahi 

router.get("/delete_electronics/:id", async function (req, res) {
  try {
    const id = req.params.id;

    // Correct SQL with template literal
    await exe(`DELETE FROM electronics WHERE id='${id}'`);

    // Redirect to electronics list
    res.redirect("/admin/Electronics");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



// edite sati 







// Electronics Edit (GET)
router.get("/edit_electronics/:id", async function (req, res) {
    try {
        const id = req.params.id;

        // select electronics info by id
        const electronics_info = await exe(
            `SELECT * FROM electronics WHERE id = '${id}'`
        );

        if (electronics_info.length === 0) {
            return res.status(404).send("Electronics record not found");
        }

        // send first record to EJS
        const obj = { electronics_info: electronics_info[0] };

        res.render("admin/electronics_edit.ejs", obj);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post("/edit_electronics", async (req, res) => {
  try {
    console.log("BODY 👉", req.body); // DEBUG

    const d = req.body;
    let electronics_img = d.old_img;

    if (req.files && req.files.electronics_img) {
      const img = req.files.electronics_img;
      electronics_img = Date.now() + "_" + img.name;
      await img.mv("public/upload/" + electronics_img);
    }

    const sql = `
      UPDATE electronics SET
      title = ?,
      brand = ?,
      description = ?,
      price = ?,
      img = ?
      WHERE id = ?
    `;

    const result = await exe(sql, [
      d.electronics_title,
      d.electronics_brand,
      d.electronics_desc,
      d.electronics_price,
      electronics_img,
      d.id
    ]);

    console.log("RESULT 👉", result);

    res.redirect("/admin/electronics");

  } catch (err) {
    console.log("❌ UPDATE ERROR 👉", err);
    res.send(err.sqlMessage || err.message);
  }
});


//Contact_us start session
router.get("/contact_us", async (req, res) => {
  var data = await exe(`SELECT * FROM contact_us`);
  var obj = { contact_us: data };
  res.render("admin/contact_us.ejs", obj);
});




router.post("/save_contact_us", async (req, res) => {

  const d = req.body;

  const sql = `
    INSERT INTO contact_us
    (address, phone, email, working_hours)
    VALUES
    ('${d.contact_address}',
     '${d.contact_phone}',
     '${d.contact_email}',
     '${d.contact_working_hours}')
  `;

  try {
    await exe(sql);
    res.redirect("/admin/contact_us");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }

});





// edit start 
// Contact Us Edit (GET)
router.get("/edit_contact_us/:id", async function (req, res) {
  try {
    const id = req.params.id;

    // select contact_us info by id
    const contact_info = await exe(
      `SELECT * FROM contact_us WHERE contact_id = '${id}'`
    );

    if (contact_info.length === 0) {
      return res.status(404).send("Contact record not found");
    }

    // send first record to EJS
    const obj = { contact_info: contact_info[0] };

    res.render("admin/contact_us_edit.ejs", obj);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});




// update sathi ahe 
router.post("/update_contact_us", async (req, res) => {
  const d = req.body;

  await exe(`
    UPDATE contact_us SET
      address='${d.contact_address}',
      phone='${d.contact_phone}',
      email='${d.contact_email}',
      working_hours='${d.contact_working_hours}'
    WHERE contact_id='${d.contact_id}'
  `);

  res.redirect("/admin/contact_us");
});













// Contact Us Delete
router.get("/delete_contact_us/:id", async function (req, res) {
  try {
    const id = req.params.id;

    // delete contact_us record by id
    await exe(`DELETE FROM contact_us WHERE contact_id='${id}'`);

    // redirect to contact us list
    res.redirect("/admin/contact_us");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});












// categress sub menu start session 



router.get("/categories/vehicle-decoration", async (req, res) => {

   var data = await exe(`SELECT * FROM vehicle_decoration`);
  var obj = { vehicle_decoration: data };

  res.render("admin/categories/vehicle-decoration.ejs",obj);
});


// save data 
// SAVE VEHICLE DECORATION
router.post("/save_vehicle_decoration", async function (req, res) {
  try {
    let file_vehicle = "";

    // Corrected file upload
    if (req.files && req.files.file_vehicle) {
      file_vehicle = new Date().getTime() + "_" + req.files.file_vehicle.name;
      await req.files.file_vehicle.mv("public/upload/" + file_vehicle);
    }

    let d = req.body;

    let sql = `
      INSERT INTO vehicle_decoration 
      (vehicle_title, vehicle_heading, file_vehicle)
      VALUES 
      ('${d.vehicle_title}', '${d.vehicle_heading}', '${file_vehicle}')
    `;

    let data = await exe(sql);

    // Redirect or render
    res.redirect("/admin/categories/vehicle-decoration"); // or use render()
    // res.send(data)
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving vehicle decoration.");
  }
});





// Vehicle Decoration Delete
router.get("/delete_vehicle_decoration/:id", async function (req, res) {
  try {
    const id = req.params.id;

    await exe(
      "DELETE FROM vehicle_decoration WHERE vehicle_id = ?",
      [id]
    );

    res.redirect("/admin/categories/vehicle-decoration");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});



// edit baki ahe update session baki ahe 















router.get("/categories/led-lights", async (req, res) => {
    try {
        const data = await exe("SELECT * FROM led_lights"); // replace with your table name
        res.render("admin/categories/led-lights", { led_lights: data });
    } catch (err) {
        console.error(err);
        res.send("Error loading LED Lights page");
    }
});











router.post("/save_led_lights", async function (req, res) {
  try {
    console.log("BODY =>", req.body);
    console.log("FILES =>", req.files);

    let led_image = "";

    if (req.files && req.files.led_image) {
      led_image = Date.now() + "_" + req.files.led_image.name;
      await req.files.led_image.mv("public/upload/" + led_image);
    }

    let d = req.body;

    let sql = `
      INSERT INTO led_lights
      (led_title, led_heading, price, led_image)
      VALUES
      ('${d.led_title}', '${d.led_heading}', '${d.price}', '${led_image}')
    `;

    await exe(sql);

    res.redirect("/admin/categories/led-lights");

  } catch (err) {
    console.log("🔥 REAL ERROR =>", err);
    res.send(err.message);
  }
});



// table madhe data print 


// delete session start 

// Delete LED Item
router.get("/delete_led/:id", async function (req, res) {
  try {
    const id = req.params.id;

    // Delete the LED record from the database
    await exe("DELETE FROM led_lights WHERE led_id = ?", [id]);

    // Redirect back to the LED list page
    res.redirect("/admin/categories/led-lights");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
//  edit session baki ahet 









router.get("/categories/stickers-decals", async (req, res) => {
  
       var data = await exe(`SELECT * FROM stickers_decals`);
  var obj = { stickers_decals: data };
        res.render("admin/categories/stickers-decals",obj);
    
});




// save data 
// Route to save Stickers & Decals
router.post("/save_stickers_decals", async function (req, res) {
  try {
    console.log("BODY =>", req.body);
    console.log("FILES =>", req.files);

    let stickers_image = "";

    // Handle file upload
    if (req.files && req.files.stickers_image) {
      stickers_image = Date.now() + "_" + req.files.stickers_image.name;
      await req.files.stickers_image.mv("public/upload/" + stickers_image);
    }

    let d = req.body;

    // Insert into database
    let sql = `
      INSERT INTO stickers_decals
      (title, heading, price, image, category)
      VALUES
      ('${d.stickers_title}', '${d.stickers_heading}', '${d.price || 0}', '${stickers_image}', '${d.category}')
    `;

    await exe(sql); // assuming exe() executes your SQL query

    // Redirect after save
    res.redirect("/admin/categories/stickers-decals");

  } catch (err) {
    console.log("🔥 REAL ERROR =>", err);
    res.send(err.message);
  }
});


// Delete Stickers & Decals
router.get("/delete_stickers_decals/:id", async function (req, res) {
  try {
    const id = req.params.id;

    // Delete the sticker/decal record from the database
    await exe("DELETE FROM stickers_decals WHERE id = ?", [id]);

    // Redirect back to the stickers & decals list page
    res.redirect("/admin/categories/stickers-decals");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


// edite ch baki ahe 



router.get("/categories/decoration-tape", async (req, res) => {
      var data = await exe(`SELECT * FROM decoration_tape`);
      var obj = { decoration_tape: data };
   
        res.render("admin/categories/decoration-tape.ejs",obj);
    
});







router.post("/save_decoration_tape", async function (req, res) {
  try {
    console.log("BODY =>", req.body);
    console.log("FILES =>", req.files);

    let tape_image = "";

    // Handle file upload
    if (req.files && req.files.tape_image) {
      tape_image = Date.now() + "_" + req.files.tape_image.name;
      await req.files.tape_image.mv("public/upload/" + tape_image);
    }

    let d = req.body;

    // Insert into database
    let sql = `
      INSERT INTO decoration_tape
      (tape_title, tape_heading, price, tape_image, category)
      VALUES
      ('${d.tape_title}', '${d.tape_heading}', '${d.price || 0}', '${tape_image}', '${d.category}')
    `;

    await exe(sql);

    // Redirect after save
    res.redirect("/admin/categories/decoration-tape");
    // res.send(data)

  } catch (err) {
    console.log("🔥 REAL ERROR =>", err);
    res.send(err.message);
  }
});




// delete session start 
router.get("/delete_decoration_tape/:id", async (req, res) => {
  try {
    let id = req.params.id;

    await exe("DELETE FROM decoration_tape WHERE tape_id = ?", [id]);

    res.redirect("/admin/categories/decoration-tape");
  } catch (err) {
    console.log(err);
    res.send("Delete error");
  }
});



// edit ch baki ahe 

// /categories/chrome-steel start session


router.get("/categories/chrome-steel", async (req, res) => {
     
     var data = await exe(`SELECT * FROM chrome_steel`);
      var obj = { chrome_steel: data };
        res.render("admin/categories/chrome-steel.ejs",obj);
    
});







router.post("/save_chrome_steel", async function (req, res) {
  try {
    console.log("BODY =>", req.body);
    console.log("FILES =>", req.files);

    let chrome_image = "";

    // Handle file upload
    if (req.files && req.files.chrome_image) {
      chrome_image = Date.now() + "_" + req.files.chrome_image.name;
      await req.files.chrome_image.mv("public/upload/" + chrome_image);
    }

    let d = req.body;

    // Insert into chrome_steel table
    let sql = `
      INSERT INTO chrome_steel
      (chrome_title, chrome_heading, price, chrome_image)
      VALUES
      ('${d.chrome_title}', '${d.chrome_heading}', '${d.price || 0}', '${chrome_image}')
    `;

    await exe(sql);

    // Redirect to chrome steel list page
    res.redirect("/admin/categories/chrome-steel");

  } catch (err) {
    console.log("🔥 REAL ERROR =>", err);
    res.send(err.message);
  }
});






// delete chrome steel
router.get("/delete_chrome_steel/:id", async (req, res) => {
  try {
    let id = req.params.id;

    await exe(
      "DELETE FROM chrome_steel WHERE chrome_id = ?",
      [id]
    );

    res.redirect("/admin/categories/chrome-steel");
  } catch (err) {
    console.log("DELETE ERROR =>", err);
    res.send("Chrome Steel delete error");
  }
});



// end delete 



module.exports = router;



  
