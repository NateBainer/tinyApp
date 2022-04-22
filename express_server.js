const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const {getUserByEmail, generateRandomString, urlsForUser, addUser, addURL} = require('./helpers');

const { urlDatabase, users } = require('./database');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: 'session',
    keys: ['e1d50c4f-538a-4682-89f4-c002f10a59c8', '2d310699-67d3-4b26-a3a4-1dbf2b67be5c'],
  })
);


const findUser = email => {
  return Object.values(users).find(user => user.email === email);
};

// const checkPassword = (user, password) => {
//   if (user.password === password) {
//     return true;
//   } else {
//     return false;
//   }
// };

// ---------------- ROUTES ----------------//





app.get("/", (req, res) => {
  let templateVars = {
    user: users[req.session.userID],
    urls: urlsForUser(req.session.userID)
  };
  if (templateVars.user) {
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    let templateVars = {
      status: 401,
      message: 'You need to be logged in to perform that action',
      user: users[req.session.user_id]
    };
    res.status(401);
    res.render("urls_error", templateVars);
  } else {
    const longURL = req.body.longURL;
    const userID = req.session.user_id;
    const shortURL = addURL(longURL, userID, urlDatabase);
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get("/urls2.json", (req, res) => {
  res.json(users);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies["userID"]],
    urls: urlsForUser(req.cookies["userID"])
  };
  if (templateVars.user) {
    res.render("urls_index", templateVars);
  } else {
    res.status(400).send("You need to login or register to access this page");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.userID] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    user: users[req.session.userID],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  if (req.session.userID === urlDatabase[templateVars.shortURL].userID) {
    res.render("urls_show", templateVars);
  } else if (!templateVars.longURL) {
    res.status(400).send("This TinyURL does not exist");
  } else {
    res.status(400).send("This TinyURL does not belong to you");
  }
});

app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  if (req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(400).send("You can't DELETE dat lilBabyURL, nuh UH!!!");
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  
  res.render("urls_index", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  if (req.session.userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(400).send("You can't EDIT dat lilBabyURL, nuh UH!!!!");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("Email cannot be found");
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Wrong password");
  } else {
    req.session.userID = user.id;
    res.redirect("/urls");
  }
});

app.get("/register", (req,res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send('Email and/or password is missing');
  } else if (getUserByEmail(email, users)) {
    res.status(400).send('This email has already been registered');
  } else {
    const userID = addUser(email, password);
    req.session.userID = userID;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// curl -i http://localhost:8080/hello

// const urlDatabase = {
//   "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
//   "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
// };

// module.exports = {urlDatabase};

// const users = {
//   "userRandomID": {
//     id: "userRandomID",
//     email: "user@example.com",
//     password: "purple-monkey-dinosaur"
//   },
//   "user2RandomID": {
//     id: "user2RandomID",
//     email: "user2@example.com",
//     password: "dishwasher-funk"
//   }
// };

// module.exports = {users};