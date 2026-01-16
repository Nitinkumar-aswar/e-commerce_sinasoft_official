var express = require("express");
var router = express.Router();
var exe= require("./connction")   // ✅ CORRECT



router.get("/",async (req, res) => {
   var sliders = await exe(`SELECT * FROM slider LIMIT 3`);
   // Tractor decoration data
  var tractorDecorations = await exe(`SELECT * FROM tractor_decoration`);
    // 3️⃣ Vehicle decorations
  const vehicleDecorations = await exe(`SELECT * FROM vehicle_dec LIMIT 1`);
    var obj = {"sliders":sliders, "tractorDecorations": tractorDecorations, vehicleDecorations}
  res.render("user/Home",obj);   // ✅ Correct
});



router.get("/login", (req, res) => {
  res.render("user/Login");    // ✅ Correct
});

router.get("/register", (req, res) => {
  res.render("user/Register"); // ✅ Correct
});




router.post("/save_flipkart_account",async function(req,res)
{

  var d=req.body;

var sql = `INSERT INTO user_create_account (user_first_name, user_last_name, user_user_name, user_mobile, user_email, user_password)
VALUES('${d.user_first_name}', '${d.user_last_name}', '${d.user_user_name}', '${d.user_mobile}', '${d.user_email}', '${d.user_password}')`;

var data= await exe(sql);
  // res.send(data);
  res.redirect("/register");
});




// // Login start  error 

router.get("/user_login",function(req,res){
  res.render("user/user_login.ejs")
});


router.post("/login_Flipkart_account",async function(req,res){
  var d=req.body;
  var sql = `SELECT * FROM user_create_account WHERE user_user_name = '${d.user_user_name}'AND user_password='${d.user_password}'`;
  var data =await exe(sql)

if (data.length > 0) {
  res.redirect("/");

} else {
  res.send("Invalid email or password. Please try again.");
}


});


router.get("/my_profile",function(req,res){
  res.render("user/my-profile.ejs")
});


router.get("/Categories", async function (req, res) {

  // Categories data (Vehicle Decoration Accessories)
  const categories = await exe(
    `SELECT * FROM categories WHERE category_status = 1`
  );

  // object send to EJS
  var obj = {
    categories: categories
  };

  res.render("user/vechical_decoration_accessories.ejs", obj);
});





// /Electronics
router.get("/Electronics",async function(req,res){
   var electronics = await exe(`SELECT * FROM electronics`);
   var obj={"electronics":electronics}
  res.render("user/Electronics.ejs",obj)
});




// eletronic end 










// /Contact_us
router.get("/Contact_us", async function (req, res) {

  // DB मधून Contact Us data fetch
  var contact_us = await exe(`SELECT * FROM contact_us`);

  // object तयार करा
  var obj = { "contact_us": contact_us };

  // EJS render करा
  res.render("user/Contact_us.ejs", obj);
});

router.get("/WhatsApp_upport",function(req,res){
  res.render("user/WhatsApp_upport.ejs")
})



router.get("/Call_support",function(req,res){
  res.render("user/Call_support.ejs")
})


router.get("/Location_map",function(req,res){
  res.render("user/Location_map.ejs")
})

router.get("/Warranty_service_support",function(req,res){
  res.render("user/Warranty_service_support.ejs")
})







router.get("/Tractor_decoration_gallery",async function(req,res){
   var tractorDecorations = await exe(`SELECT * FROM tractor_decoration`);
    var obj = { "tractorDecorations": tractorDecorations}
  res.render("user/Tractor_decoration_gallery.ejs",obj)
})




module.exports = router;
