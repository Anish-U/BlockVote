// Importing npm modules
const express = require("express");

// Router
const router = express.Router();

/*
	HANDLING ROUTES
*/

// GET /
router.get("/", (req, res) => {
  res.redirect("/home");
});

// GET /home
router.get("/home", (req, res) => {
  res.render("home", { title: "Home" });
});

module.exports = router;
