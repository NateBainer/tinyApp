const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

let generateRandomString = (n) => {
  let randomString = '';
  let characters = '0123456789abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < n; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const addUser = (email, password) => {
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  return id;
};

const checkRegistration = (email, password) => {
  if (email && password) {
    return true;
  }
  return false;
};

const findUser = email => {
  return Object.values(users).find(user => user.email === email);
};

const checkPassword= (user, password) => {
  if (user.password === password) {
    return true;
  } else {
    return false;
  }
};

// ---------------- ROUTES ----------------//




app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] 
  };

app.post("/urls/:shortURL/delete", (req,res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  
  res.render("urls_index", templateVars);
});

app.post("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const user = findUser(email);
  if (!user) {
    res.status(403).send("Email cannot be found");
  } else if (!checkPassword(user, password))  {
    res.status(403).send("Wrong password");
  } else {
    res.cookie('user_id', user.id);
    res.redirect("/urls");
  }
});

app.get("/register", (req,res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!checkRegistration(email, password)) {
    res.status(400).send('Email and/or password is missing');
  } else if (findUser(email)) {
    res.status(400).send('This email has already been registered');
  } else {
    const user_id = addUser(email, password);
    res.cookie('user_id', user_id);
    res.redirect("/urls");
  }
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// curl -i http://localhost:8080/hello
