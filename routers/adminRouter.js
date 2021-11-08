// Importing npm modules
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Router
const router = express.Router();

// Importing validation function
const validateForm = require("../utils/validateAdminLogin");
const validateCandidate = require("../utils/validateCandidate");

// Importing middlewares
const {
  ensureAuthentication,
  forwardAuthentication,
} = require("../middlewares/authAdmin");

// Importing admin & candidate model
const Admin = require("../models/admin");
const Candidate = require("../models/candidate");

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

// POST /admin/login
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
router.get("/candidates", ensureAuthentication, async (req, res) => {
  const noOfCandidates = await election.methods.candidateCount().call();

  let candidateIds = [];
  let candidateNames = [];
  let partyNames = [];
  let partySlogans = [];

  for (let i = 1; i <= noOfCandidates; i++) {
    const candidate = await election.methods.getCandidate(i).call();

    if (candidate._candidateName == "NOTA") {
      continue;
    }

    candidateIds.push(i);
    candidateNames.push(candidate._candidateName);
    partyNames.push(candidate._partyName);

    const dbCandidate = await Candidate.findOne({
      candidateId: i,
    });

    if (!dbCandidate) {
      res.render("500.ejs", { admin: req.body.admin });
      return;
    }
    partySlogans.push(dbCandidate.partySlogan);
  }

  res.render("admin/candidates", {
    title: "Candidates",
    noOfCandidates,
    candidateIds,
    candidateNames,
    partyNames,
    partySlogans,
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

// POST /admin/addCandidate
router.post("/addCandidate", ensureAuthentication, async (req, res) => {
  // Destructing variables
  const { candidateName, partyName, partySlogan } = req.body;

  // Validating form inputs
  const errors = validateCandidate(candidateName, partyName, partySlogan);

  // If form inputs are not valid
  if (errors.length > 0) {
    res.render("admin/addCandidate", {
      title: "Add Candidate",
      errors,
      candidateName,
      partyName,
      partySlogan,
      admin: req.body.admin,
    });
    return;
  } else {
    let candidateId;

    // Check if candidate is already present
    const checkCandidate = await Candidate.findOne({
      candidateName,
      partyName,
    });

    // If candidate is not present or is unique
    if (!checkCandidate) {
      try {
        // Transaction for adding candidate
        await election.methods
          .addCandidate(candidateName, partyName)
          .send({ from: adminAddress, gas: 3000000 });

        // Finding candidateId using smart contract function call
        candidateId = await election.methods.candidateCount().call();
      } catch (err) {
        console.log(err);
        res.render("admin/addCandidate", {
          title: "Add Candidate",
          error: "Error occurred. Please try again later...",
          candidateName,
          partyName,
          partySlogan,
          admin: req.body.admin,
        });
        return;
      }

      // Creating candidate object
      const candidate = new Candidate({
        candidateId,
        candidateName,
        partyName,
        partySlogan,
      });
      try {
        // Saving to database
        candidate.save();
      } catch (error) {
        res.render("admin/addCandidate", {
          title: "Add Candidate",
          error: "Error occurred. Please try again later...",
          candidateName,
          partyName,
          partySlogan,
          admin: req.body.admin,
        });
        return;
      }

      req.flash("success_msg", "Candidate added successfully");
      res.redirect("/admin/addCandidate");
    } else {
      // If candidate is already present
      res.render("admin/addCandidate", {
        title: "Add Candidate",
        error: "Candidate already present",
        candidateName,
        partyName,
        partySlogan,
        admin: req.body.admin,
      });
      return;
    }
  }
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
