// Importing npm modules
const express = require("express");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const session = require("express-session");
const cookie = require("cookie-parser");
const Web3 = require("web3");

// Importing built-in modules
const path = require("path");

// Importing routers
// const homeRouter = require("./routers/homeRouter");
const voterRouter = require("./routers/voterRouter");
const adminRouter = require("./routers/adminRouter");

// Importing database config
const { initDB } = require("./config/database");

// Importing smart contract
const Election = require("./build/contracts/Election.json");

// Fetching environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "This_is_my_secret_key";
const GANACHE_URI = process.env.GANACHE_URI || "http://localhost:7545";

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

// Web3 Connection
const web3 = new Web3(GANACHE_URI);
let election;
let adminAddress;

// Smart contract instance
const initContract = async () => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = Election.networks[networkId];

  // Smart contract instance
  election = new web3.eth.Contract(Election.abi, deployedNetwork.address);
  global.election = election;

  // Admin account address
  const addresses = await web3.eth.getAccounts();
  adminAddress = addresses[0];
  global.adminAddress = adminAddress;
};

global.web3 = web3;

initContract();

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
