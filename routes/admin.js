var express = require("express");
var router = express.Router();
var exe =require("./connction")


// ADMIN HOME PAGE start
router.get("/", function (req, res) {
  res.render("admin/Home.ejs");
  
});


router.post("/login_admin_account", async (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM admin WHERE email=? AND password=?";
  const data = await exe(sql, [email, password]);

  if (data.length > 0) {
    req.session.admin = data[0];   // ✅ session set
    res.redirect("/admin");
  } else {
    res.send("Invalid email or password");
  }
});





// // 🔐 Middleware
// function checkAdminLogin(req, res, next) {
//   if (req.session.admin) {
//     next();
//   } else {
//     res.redirect("/admin");
//   }
// }

// // 🟢 Login page
// router.get("/", (req, res) => {
//   res.render("admin/Home", { msg: "" });
// });

// // 🟢 Login POST
// router.post("/login_admin_account", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const sql = "SELECT * FROM admin WHERE email=? AND password=?";
//     const result = await exe(sql, [email, password]);   // ✅ CORRECT

//     if (result.length > 0) {
//       req.session.admin = result[0];
//       res.redirect("/admin/slider");
//     } else {
//       res.render("admin/Home", { msg: "Invalid Email or Password" });
//     }

//   } catch (err) {
//     console.log(err);
//     res.send("Database Error");
//   }
// });

// // 🟢 Slider Panel
// router.get("/slider", checkAdminLogin, (req, res) => {
//   res.render("admin/slider");
// });

// // 🟢 Logout
// router.get("/logout", (req, res) => {
//   req.session.destroy();
//   res.redirect("/admin");
// });





// Admin end 




// Admin Slider page 
router.get("/slider",async function (req, res)
 {
var data=await exe(`SELECT * FROM slider`);
  var obj={"sliders":data};



  res.render("admin/slider.ejs",obj);
  
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














module.exports = router;



  
