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











module.exports = router;



  
