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

router.get("/vechical_decoration_accessories",function(req,res){
  res.render("user/vechical_decoration_accessories.ejs")
});





module.exports = router;
