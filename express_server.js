/* eslint-disable camelcase */




const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcryptjs = require('bcryptjs');
const cookieSession = require('cookie-session');

// -----------------FOR SOME REASON, COULD NOT LINK HELPERS.JS AND DATABASE.JS WITHOUT ERROR----------------- //
const urlDatabase = {};
const users = {};


const getUserByEmail = (email, database) => {
  return Object.values(database).find(user => user.email === email);
};

const addURL = (longURL, userID, db) => {
  const dateCreation = new Date();
  const visitCount = 0;
  const visitHistory = [];
  const uVisitCount = 0;
  const visitorIDList = [];
  const shortURL = generateRandomString();
  db[shortURL] = { userID, longURL, dateCreation, visitCount, visitHistory, visitorIDList, uVisitCount };
  return shortURL;
};

const generateRandomString = () => {
  return Math.random().toString(36).substring(6);
};
  

const addUser = (email, password) => {
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password: hashedPassword
  };
  return id;
};

const urlsForUser = (id) => {
  let filtered = {};
  for (let urlID of Object.keys(urlDatabase)) {
    if (urlDatabase[urlID].userID === id) {
      filtered[urlID] = urlDatabase[urlID];
    }
  }
  return filtered;
};


app.use(bodyParser.urlencoded({extended: true}));
app.use(
  cookieSession({
    name: 'session',
    keys: [' '],
  })
);

app.set("view engine", "ejs");

// --------------------- ALL ROUTES --------------------------- //

// homepage
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// URLS
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    let templateVars = {
      status: 401,
      message: 'Hey, Fool! You need to login first!',
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

// URLS/NEW
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

// URLS/:SHORTURL
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    let templateVars = {
      status: 404,
      message: 'TinyURL has not yet been born!!!',
      user: users[req.session.user_id]
    };
    res.status(404);
    res.render("urls_error", templateVars);
  }
  let templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    urls: urlDatabase,
  };
  if (req.session.user_id === urlDatabase[templateVars.shortURL].user_id) {
    res.render("urls_show", templateVars);
  } else {
    let templateVars = {
      status: 401,
      message: "This ain't yo' TinyURL! nuh UH!!!",
      user: users[req.session.user_id]
    };
    res.status(401);
    res.render("urls_error", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const newDate = new Date();
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
    urlDatabase[shortURL].visitCount = 0;
    urlDatabase[shortURL].visitHistory = [];
    urlDatabase[shortURL].uVisitCount = 0;
    urlDatabase[shortURL].visitorIDList = [];
    urlDatabase[shortURL].dateCreation = newDate;
    res.redirect(`/urls/${shortURL}`);
  } else {
    let templateVars = {
      status: 401,
      message: "Hey! You can't make changes to that TinyURL!!!",
      user: users[req.session.user_id]
    };
    res.status(401);
    res.render("urls_error", templateVars);
  }
});

// URLS/:SHORTURL/DELETE
app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    let templateVars = {
      status: 401,
      message: "Hey! You can't delete that TinyURL!!!",
      user: users[req.session.user_id]
    };
    res.status(401);
    res.render("urls_error", templateVars);
  }
});

// U/:SHORTURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const dateVisit = new Date();
  if (!urlDatabase[shortURL]) {
    let templateVars = {
      status: 404,
      message: "Hey! This TinyURL ain't been born yet!",
      user: users[req.session.user_id]
    };
    res.status(404);
    res.render("urls_error", templateVars);
  } else if (!req.session.user_id) {
    req.session.user_id = generateRandomString();
    urlDatabase[shortURL].visitHistory.push([dateVisit,req.session.user_id]);
    urlDatabase[shortURL].visitCount++;
    urlDatabase[shortURL].visitorIDList.push(req.session.user_id);
    urlDatabase[shortURL].uVisitCount++;
  } else {
    const visitorId = urlDatabase[shortURL].visitorIDList;
    urlDatabase[shortURL].visitHistory.push([dateVisit,req.session.user_id]);
    urlDatabase[shortURL].visitCount++;
    if (!visitorId.includes(req.session.user_id)) {
      visitorId.push(req.session.user_id);
      urlDatabase[shortURL].uVisitCount++;
    }
  }
  if (longURL.startsWith("http://")) {
    res.redirect(longURL);
  } else {
    res.redirect(`http://${longURL}`);
  }
});

// LOGIN
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
    let templateVars = {
      status: 401,
      message: "Can't find email.... where is it?",
      user: users[req.session.user_id]
    };
    res.status(401);
    res.render("urls_error", templateVars);
  } else if (!bcryptjs.compareSync(password, user.password)) {
    let templateVars = {
      status: 401,
      message: "BRRR Password Incorrecto",
      user: users[req.session.user_id]
    };
    res.status(401);
    res.render("urls_error", templateVars);
  } else {
    req.session.user_id = user.id;
    res.redirect("/urls");
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// REGISTER
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

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    let templateVars = {
      status: 401,
      message: "so... your email and/or password is missing...",
      user: users[req.session.user_id]
    };
    res.status(401);
    res.render("urls_error", templateVars);
    ("so... your email and/or password is missing...");
  } else if (getUserByEmail(email, users)) {
    let templateVars = {
      status: 409,
      message: "Uh... that email is already registered sooo.....",
      user: users[req.session.user_id]
    };
    res.status(409);
    res.render("urls_error", templateVars);
  } else {
    const user_id = addUser(email, password, users);
    req.session.user_id = user_id;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




// -------------- DISREGARD ----------------- //


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

// const checkPassword = (user, password) => {
//   if (user.password === password) {
//     return true;
//   } else {
//     return false;
//   }
// };


// const findUser = email => {
//   return Object.values(users).find(user => user.email === email);
// };

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });
