const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const mongoose = require("mongoose");
const User = require("./models/user.js");



const sessionOptions = {
  secret: "mysuperseceretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true
  }
}

const MONGO_URL = "mongodb://127.0.0.1:27017/database";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err.errors);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req,res) => {
    res.render("index.ejs");
});

app.get("/admin", async (req,res) => {
  let allUser = await User.find({});
  req.flash("success")
  res.render("adminlogin", {allUser});

});




//login and signup


app.get("/user", (req,res) => {
  res.render("userlogin.ejs");
  
});

app.get("/signup", (req,res) => {
  res.render("signup");
});

app.post("/signup", async (req,res) => {
 let {username, email, password} = req.body;
 const newUser = new User({email, username});
 const registerUser = await User.register(newUser, password);
 res.render("userpostlogin")
});

app.post("/login",passport.authenticate('local', { failureRedirect: "/user"}), async(req,res) => {
  let { username, password} = req.body;
  console.log(req.user);
  res.render("userpostlogin");
});

app.post("/logout", (req,res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
})

//changes made by admin into user model

app.get("/addUser", (req,res) => {
  res.render("addUser.ejs")
});

app.post("/addUser", async(req,res) => {
  let {username, email, password} = req.body;
 const newUser = new User({email, username});
 const registerUser = await User.register(newUser, password);
 res.redirect("/admin");
})

app.get("/user/:id/edit", async (req,res) => {
  let { id } = req.params;
  const user = await User.findById(id);
  res.render("editUser.ejs", {user});
});

app.put("/user/:id", async (req, res) => {
  let { id } = req.params;
  let { username, email, password, current_password } = req.body;

  const user = await User.findById(id);
  
  if (!user) {
      return res.status(404).send("User not found");
  }
  if (password) {
      user.password = password; // Handle password hashing here
  } else {
      user.password = current_password; // Keep the current password if none is provided
  }

  user.username = username;
  user.email = email;

  await user.save();
  res.redirect("/admin");
});

app.delete("/user/:id", async (req,res) => {
  let { id } = req.params;
  let deleteUser = await User.findByIdAndDelete(id);
  res.redirect("/admin");
})




app.listen(8080, () => {
    console.log("Connection successful");
});