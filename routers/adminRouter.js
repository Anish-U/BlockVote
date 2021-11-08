// Importing npm modules
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Router
const router = express.Router();

// Importing validation function
const validateForm = require("../utils/validateAdminLogin");

// Importing middlewares
const {
  ensureAuthentication,
  forwardAuthentication,
} = require("../middlewares/authAdmin");

// Importing admin model
const Admin = require("../models/admin");

/*
	HANDLING ROUTES
*/

// GET /admin/
router.get("/", ensureAuthentication, (req, res) => {
  res.redirect("/admin/dashboard");
});

// GET /admin/login
router.get("/login", forwardAuthentication, (req, res) => {
  res.render("admin/login", { title: "Login" });
});

// POST /voter/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const errors = validateForm(username, password);
  if (errors.length > 0) {
    res.render("admin/login", { title: "Login", errors, username, password });
  } else {
    const admin = await Admin.findOne({ username: username });

    if (!admin) {
      res.status(400).render("admin/login", {
        title: "Login",
        error: "Invalid username / password",
        username,
        password,
      });
      return;
    }
    const passCheck = await bcrypt.compare(password, admin.password);
    if (!passCheck) {
      res.status(400).render("admin/login", {
        title: "Login",
        error: "Invalid username / password",
        username,
        password,
      });
      return;
    }

    const token = jwt.sign(
      { _id: admin._id, username: admin.username },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );
    res.clearCookie("voterAuthToken");
    res.cookie("adminAuthToken", token, { maxAge: 24 * 60 * 60 * 1000 });
    res.redirect("/admin/dashboard");
  }
});

// GET /admin/dashboard
router.get("/dashboard", ensureAuthentication, (req, res) => {
  res.render("admin/dashboard", { title: "Dashboard", admin: req.body.admin });
});

// GET /admin/candidates
router.get("/candidates", ensureAuthentication, (req, res) => {
  res.render("admin/candidates", {
    title: "Candidates",
    admin: req.body.admin,
  });
});

// GET /admin/addCandidate
router.get("/addCandidate", ensureAuthentication, (req, res) => {
  res.render("admin/addCandidate", {
    title: "Add Candidate",
    admin: req.body.admin,
  });
});

// GET /admin/results
router.get("/results", ensureAuthentication, (req, res) => {
  res.render("admin/results", { title: "Results", admin: req.body.admin });
});

// GET /admin/logout
router.get("/logout", (req, res) => {
  res.clearCookie("adminAuthToken");
  res.clearCookie("voterAuthToken");
  req.flash("success_msg", "You have been successfully logged out");
  res.redirect("/admin/login");
});

// Error routes
router.use((req, res, next) => {
  res.status(404).render("admin/404");
});

module.exports = router;
