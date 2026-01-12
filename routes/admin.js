var express = require("express");
// var exe = require("../connection");

var router = express.Router();

// ADMIN HOME PAGE
router.get("/", function (req, res) {
  res.render("admin/Home.ejs");
  
});

// Admin Slider page 
router.get("/slider", function (req, res) {
  res.render("admin/slider.ejs");
  
});






module.exports = router;
