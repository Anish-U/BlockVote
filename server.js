// Importing npm modules
const express = require("express");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const session = require("express-session");
const cookie = require("cookie-parser");

// Importing built-in modules
const path = require("path");

// Importing routers
// const homeRouter = require("./routers/homeRouter");
const voterRouter = require("./routers/voterRouter");
const adminRouter = require("./routers/adminRouter");

// Importing database Config
const { initDB } = require("./config/database");

// Fetching environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "This_is_my_secret_key";

// Express app instance
const app = express();

/* 
	MOUNTING MIDDLEWARE FUNCTIONS 
	TO EXPRESS APP INSTANCE
*/

// Middleware for recognizing incoming request object as JSON
app.use(express.json());

// Middleware to set static path at /public
app.use(express.static(path.join(__dirname, "/public/")));

// Express body parser middleware
app.use(express.urlencoded({ extended: true }));

// Flash middleware
app.use(flash());

// Cookie parser middleware
app.use(cookie());

// Express session middleware
app.use(
  session({
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

// Disabling X-powered-by for security reasons
app.disable("x-powered-by");

// Setting EJS as view engine
app.set("view engine", "ejs");

// Middleware to set global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// MongoDB Connection
initDB();

/*
	HANDLING ROUTES
*/

// Home routes
// app.use("/", homeRouter);

// Voter routes
app.use("/voter", voterRouter);

// Admin routes
app.use("/admin", adminRouter);

// Error routes
app.use((req, res, next) => {
  res.status(404).render("404");
});

// Serving and listening at PORT
app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});
