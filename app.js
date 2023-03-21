//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

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

        bcrypt.compare(password, foundUser.password, function(erro, result) {
            if(result === true){
                res.render("secrets")
            } else {
                res.send("wrong password")
            }
        });


        // if(foundUser.password === password){
        //     res.render("secrets")
        // } else{
        //     res.send("wrong password")
        // }
    })
    .catch((err)=>{res.send("Some error with login")})
})

app.get("/register", function(req, res){
    res.render("register")
});
app.post("/register", function(req, res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save()
        .then((item)=>{
            res.render("login")
        })
        .catch((err)=>{
            console.log(err)
        })
    });
   
});





app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");}
    );