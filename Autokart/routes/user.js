var express = require("express");
var router = express.Router();
var exe= require("./connction")   // ✅ CORRECT



router.get("/", (req, res) => {
  
  res.render("user/Home");   // ✅ Correct
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
  res.send("Login successful. Welcome back!");

} else {
  res.send("Invalid email or password. Please try again.");
}


});


router.get("/my_profile",function(req,res){
  res.render("user/my-profile.ejs")
});



// // profile start 
// router.get("/my_profile", function (req, res) {

//   // ❌ login नसेल तर
//   if (!req.session.user) {
//     return res.redirect("/login");
//   }

//   // ✅ logged-in user
//   var user = req.session.user;

//   res.render("user/my-profile", { user });
// });





// router.post("/login", async function (req, res) {

//   var { email, password } = req.body;

//   var data = await exe(
//     `SELECT * FROM user_create_account 
//      WHERE user_email='${email}' AND user_password='${password}'`
//   );

//   if (data.length > 0) {

//     // ✅ session मध्ये logged-in user
//     req.session.user = data[0];

//     res.redirect("/my_profile");

//   } else {
//     res.send("Invalid Email or Password");
//   }
// });


module.exports = router;
