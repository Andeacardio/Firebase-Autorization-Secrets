//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const mdb ="mongodb://127.0.0.1:27017/userDB";
const db = 'mongodb+srv://'+process.env.DB_LOG+':'+process.env.DB_PASS+'@cluster0.ikl3us9.mongodb.net/usersDB?retryWrites=true&w=majority';
mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((res) => console.log('Connected to DB'))
  .catch((error) => console.log(error));

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String,
    photo: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// serialize user
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
// deserialize user
passport.deserializeUser(function(id, done) {
  User.findById(id).then(user => {
    done(null, user);
  }).catch((err) => {
    return done(err)
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets'
  },
  async function (accessToken, refreshToken, profile, done) {
    try {
      // console.log(profile.photos[0].value);
      // console.log(profile);
      // Find or create user in your database
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        // Create new user in database
        const username = Array.isArray(profile.emails) && profile.emails.length > 0 ? profile.emails[0].value.split('@')[0] : '';
        const newUser = new User({
          username: profile.displayName,
          googleId: profile.id,
          photo: profile.photos[0].value
        });
        user = await newUser.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: 'http://localhost:3000/auth/facebook/secrets'
}, async function(accessToken, refreshToken, profile, done) {
  try {
    console.log(profile);
    // Find or create user in your database
    let user = await User.findOne({
      facebookId: profile.id
    });
    if (!user) {
      // Create new user in database
      const newUser = new User({
        username: profile.displayName,
        facebookId: profile.id
      });
      user = await newUser.save();
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));


app.get("/", function(req, res){
    res.render("home")
});
app.get("/login", function(req, res){
    res.render("login")
});
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);
app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/secrets', passport.authenticate('facebook', {
  failureRedirect: '/login'
}), function(req, res) {
  // Successful authentication, redirect to secrets page.
  res.redirect('/secrets');
});
app.get("/secrets", function(req, res){
  // let secret ;
  let name = req.user.username;
  let photo = req.user.photo;
  User.find({secret:{
    $ne: null
  }
}).then((foundUsers) => {
  res.render("secrets", {
    usersWithSecrets: foundUsers,
    name : name, 
    photo: photo
  })
}).catch((err) => {
  console.log(err)
});
});
app.get("/register", function(req, res){
  res.render("register")
});
app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
} else {
    res.redirect("/login")
}
})

app.post("/submit", function(req,res){
const submitedSecret = req.body.secret;

User.findById(req.user.id)
.then((foundUser)=>{
  if(foundUser){
    foundUser.secret = submitedSecret;
    foundUser.save()
    .then(()=>{
      res.redirect("/secrets");
    });
  }
})
.catch((err)=>{console.log(err)})

})
app.post("/login", function(req, res){
  const user = new User({
      username: req.body.username,
      password: req.body.password
  });
  req.login(user, function(err){
      if(err){
          console.log(err)
      } else{
          passport.authenticate("local")(req,res, function(){
              res.redirect("/secrets");
          });
      }
  })
});
app.post("/register", function(req, res){
User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
        console.log(err);
        res.redirect("/register")
    } else{
        passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
        });
    }
})
});


app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");}
);