//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
const db = 'mongodb+srv://'+process.env.DB_LOG+':'+process.env.DB_PASS+'@cluster0.ikl3us9.mongodb.net/usersDB?retryWrites=true&w=majority';

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((res) => console.log('Connected to DB'))
  .catch((error) => console.log(error));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home")
});

app.get("/login", function(req, res){
    res.render("login")
});
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username})
    .then((foundUser)=>{
        if(foundUser.password === password){
            res.render("secrets")
        } else{
            res.send("wrong password")
        }
    })
    .catch((err)=>{res.send("Some error with login")})
})

app.get("/register", function(req, res){
    res.render("register")
});
app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save()
    .then((item)=>{
        res.render("login")
    })
    .catch((err)=>{
        console.log(err)
    })
});





app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");}
    );