// Importing npm modules
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Router
const router = express.Router();

// Importing validation function
const validateForm = require("../utils/validateVoterLogin");

// Importing middlewares
const {
  ensureAuthentication,
  forwardAuthentication,
} = require("../middlewares/authVoter");

// Importing voter model
const Voter = require("../models/voter");

/*
	HANDLING ROUTES
*/

// GET /voter/
router.get("/", ensureAuthentication, (req, res) => {
  res.redirect("/voter/dashboard");
});

// GET /voter/login
router.get("/login", forwardAuthentication, (req, res) => {
  res.render("voter/login", { title: "Login" });
});

// POST /voter/login
router.post("/login", async (req, res) => {
  const { aadhaar, password } = req.body;
  const errors = validateForm(aadhaar, password);
  if (errors.length > 0) {
    res.render("voter/login", { title: "Login", errors, aadhaar, password });
  } else {
    const voter = await Voter.findOne({ aadhaar: aadhaar });

    if (!voter) {
      res.status(400).render("voter/login", {
        title: "Login",
        error: "Invalid aadhaar / password",
        aadhaar,
        password,
      });
      return;
    }
    const passCheck = await bcrypt.compare(password, voter.password);
    if (!passCheck) {
      res.status(400).render("voter/login", {
        title: "Login",
        error: "Invalid aadhaar / password",
        aadhaar,
        password,
      });
      return;
    }

    const token = jwt.sign(
      { _id: voter._id, aadhaar: voter.aadhaar },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );
    res.clearCookie("adminAuthToken");
    res.cookie("voterAuthToken", token, { maxAge: 24 * 60 * 60 * 1000 });
    res.redirect("/voter/dashboard");
  }
});

// GET /voter/dashboard
router.get("/dashboard", ensureAuthentication, (req, res) => {
  res.render("voter/dashboard", { title: "Dashboard", voter: req.body.voter });
});

// GET /voter/vote
router.get("/vote", ensureAuthentication, (req, res) => {
  res.render("voter/vote", { title: "Vote", voter: req.body.voter });
});

// GET /voter/results
router.get("/results", ensureAuthentication, (req, res) => {
  res.render("voter/results", { title: "Results", voter: req.body.voter });
});

// GET /voter/logout
router.get("/logout", (req, res) => {
  res.clearCookie("voterAuthToken");
  res.clearCookie("adminAuthToken");
  req.flash("success_msg", "You have been successfully logged out");
  res.redirect("/voter/login");
});

// Error routes
router.use((req, res, next) => {
  res.status(404).render("voter/404");
});

module.exports = router;
