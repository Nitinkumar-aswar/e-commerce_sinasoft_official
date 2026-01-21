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

router.get("/user_login", function(req,res){



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

router.post("/user_login", async (req, res) => {

  let user = await exe(`
    SELECT * FROM user_create_account
    WHERE user_email='${req.body.user_email}'
    AND user_password='${req.body.user_password}'
  `);

  if (user.length > 0) {
    req.session.user_id = user[0].user_id;

    console.log("SESSION USER ID:", req.session.user_id); // 🔴 CHECK

    res.redirect("/my_profile");
  } else {
    res.send("Invalid Login");
  }
});


router.get("/my_profile",async function(req,res){




  // add kelela 

    // DB मधून सर्व Electronics fetch करा
        var data = await exe(`SELECT * FROM user_create_account`);

        // EJS template ला object पाठवा
        var obj = { "user_create_account": data };
// navin ahe 

  res.render("user/my-profile.ejs",obj)
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


router.get("/all_tractor_dec",function(req,res){
  res.send("user/Warranty_service_support.ejs")
})



router.get("/LED_Fancy_Decoration_Lights",function(req,res){
  res.send("user/LED_Fancy_Decoration_Lights.ejs")
})
// ================= CATEGORY PAGES =================

// Vehicle Decoration
router.get("/vehical_dec_acc", async (req, res) => {
   var vehicle_decoration = await exe(`SELECT * FROM vehicle_decoration`);
    var obj = { "vehicle_decoration": vehicle_decoration}
  res.render("user/vehical_dec_acc.ejs",obj);
});
// LED Lights
router.get("/led_light", async (req, res) => {
     var led_lights = await exe(`SELECT * FROM led_lights`);
    var obj = { "led_lights": led_lights}
  res.render("user/led_lights.ejs",obj);
});


// Stickers
router.get("/stickers", async (req, res) => {
     var stickers_decals = await exe(`SELECT * FROM stickers_decals`);
    var obj = { "stickers_decals": stickers_decals}
  res.render("user/dec_stickers",obj);
});
// Decoration Tape
router.get("/dec_tape", async (req, res) => {
     var decoration_tape = await exe(`SELECT * FROM decoration_tape`);
    var obj = { "decoration_tape": decoration_tape}
  res.render("user/dec_tape",obj);
});
// Chrome / Steel
router.get("/steel", async (req, res) => {

    var chrome_steel = await exe(`SELECT * FROM chrome_steel`);
    var obj = { "chrome_steel": chrome_steel}
  res.render("user/chrome_steel",obj);
});
// Interior
router.get("/interior", async (req, res) => {
   var interior_decoration = await exe(`SELECT * FROM interior_decoration`);
    var obj = { "interior_decoration": interior_decoration}
  res.render("user/interior",obj);
});

// Exterior
router.get("/exterior", async (req, res) => {
       var exterior_decoration = await exe(`SELECT * FROM exterior_decoration`);
    var obj = { "exterior_decoration": exterior_decoration}
  res.render("user/exterior",obj);
});

// Horn
router.get("/horn", async (req, res) => {
        var horn_siren = await exe(`SELECT * FROM horn_siren`);
    var obj = { "horn_siren": horn_siren}
  res.render("user/horn",obj);
});
// Electrical
router.get("/electrical", async (req, res) => {
  var electrical = await exe(`SELECT * FROM electrical`);
    var obj = { "electrical": electrical}
  res.render("user/electrical",obj);
});

// Safety
router.get("/safety", async (req, res) => {
 
  res.render("user/safety");
});
// eletronic end 


























module.exports = router;
