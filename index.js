 require("dotenv").config();
var express = require("express");
var bodyparser = require("body-parser");
var session=require("express-session");
var fileUpload = require("express-fileupload");


const path = require("path");
// ROUTES
var userroute = require("./routes/user");
var adminroute = require("./routes/admin");

var app = express();

app.use(express.json());  


app.set("view engine", "ejs");             // ✅ Set EJS
app.set("views", __dirname + "/views");    // ✅ Set the folder where EJS files are

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));
// file upload middleware
app.use(fileUpload());

app.use(express.static(path.join(__dirname, 'public')));



app.use(session({
    secret: "process.env.SESSION_SECRET",
    resave:false,
    saveUninitialized:false
}))

app.use("/", userroute);
app.use("/admin", adminroute);


// app.use("/admin", adminAuth, adminRoute);
// my profile page start 


// hhjhj


app.listen(1000, () => console.log("Server running on port 1000"));
