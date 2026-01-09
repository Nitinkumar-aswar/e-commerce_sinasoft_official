var express = require("express");
var bodyparser = require("body-parser");
var session=require("express-session");
const path = require("path");
// ROUTES
var userroute = require("./routes/user");
var adminroute = require("./routes/admin");

var app = express();

app.set("view engine", "ejs");             // ✅ Set EJS
app.set("views", __dirname + "/views");    // ✅ Set the folder where EJS files are

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
    secret:"gghh",
    resave:false,
    saveUninitialized:true
}))

app.use("/", userroute);
app.use("/admin", adminroute);

// my profile page start 





app.listen(1000, () => console.log("Server running on port 1000"));
