// Importing npm modules
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bn = require("bn.js");

// Router
const router = express.Router();

// Importing validation function
const validateForm = require("../utils/validateVoterLogin");
const validatePhone = require("../utils/validatePhone");
const validateEthereum = require("../utils/validateEthereum");
const validateCandidateId = require("../utils/validateCandidateId");

// Importing middlewares
const {
  ensureAuthentication,
  forwardAuthentication,
} = require("../middlewares/authVoter");

// Importing voter model
const Voter = require("../models/voter");
const Candidate = require("../models/candidate");

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

// GET /voter/register-phone
router.get("/register-phone", ensureAuthentication, (req, res) => {
  res.render("voter/phone", { title: "Register Phone", voter: req.body.voter });
});

//POST /voter/register-phone
router.post("/register-phone", ensureAuthentication, async (req, res) => {
  const { phoneNumber } = req.body;
  const errors = validatePhone(phoneNumber);
  if (errors.length > 0) {
    res.render("voter/phone", {
      title: "Add Candidate",
      errors,
      phoneNumber,
      voter: req.body.voter,
    });
  } else {
    const aadhaar = req.body.voter.aadhaar;
    let newVoter;

    try {
      newVoter = await Voter.findOneAndUpdate(
        { aadhaar: aadhaar },
        { phone: phoneNumber },
        { new: true }
      );
    } catch (err) {
      console.log(err);
      res.render("voter/phone", {
        title: "Add Candidate",
        error: "Error occurred. Please try again later",
        phoneNumber,
        voter: req.body.voter,
      });
      return;
    }
    req.body.voter = newVoter;
    req.flash(
      "success_msg",
      "You have successfully registered your mobile number"
    );
    res.redirect("/voter/register-phone");
  }
});

// GET /voter/register-ethereum
router.get("/register-ethereum", ensureAuthentication, (req, res) => {
  res.render("voter/ethereum", {
    title: "Register Ethereum",
    voter: req.body.voter,
  });
});

//POST /voter/register-ethereum
router.post("/register-ethereum", ensureAuthentication, async (req, res) => {
  const { ethereumAccount } = req.body;
  const errors = validateEthereum(ethereumAccount);
  if (errors.length > 0) {
    res.render("voter/ethereum", {
      title: "Add Candidate",
      errors,
      ethereumAccount,
      voter: req.body.voter,
    });
  } else {
    const aadhaar = req.body.voter.aadhaar;
    const addresses = await web3.eth.getAccounts();

    if (
      !addresses.includes(ethereumAccount) ||
      ethereumAccount == adminAddress
    ) {
      res.render("voter/ethereum", {
        title: "Add Candidate",
        error: "Invalid Ethereum account",
        ethereumAccount,
        voter: req.body.voter,
      });
      return;
    }

    let newVoter;

    try {
      newVoter = await Voter.findOneAndUpdate(
        { aadhaar: aadhaar },
        { ethAcc: ethereumAccount },
        { new: true }
      );
    } catch (err) {
      console.log(err);
      if (err.code == 11000) {
        res.render("voter/ethereum", {
          title: "Add Candidate",
          error: "Invalid Ethereum account",
          ethereumAccount,
          voter: req.body.voter,
        });
        return;
      }
      res.render("voter/ethereum", {
        title: "Add Candidate",
        error: "Error occurred. Please try again later",
        ethereumAccount,
        voter: req.body.voter,
      });
      return;
    }
    req.body.voter = newVoter;
    req.flash(
      "success_msg",
      "You have successfully registered your ethereum account"
    );
    res.redirect("/voter/register-ethereum");
  }
});

// GET /voter/vote
router.get("/vote", ensureAuthentication, async (req, res) => {
  const noOfCandidates = await election.methods.candidateCount().call();

  let candidateIds = [];
  let candidateNames = [];
  let partyNames = [];
  let partySlogans = [];

  for (let i = 1; i <= noOfCandidates; i++) {
    const candidate = await election.methods.getCandidate(i.toString()).call();
    console.log(candidate);
    candidateIds.push(i);
    candidateNames.push(candidate._candidateName);
    partyNames.push(candidate._partyName);

    if (candidate._candidateName == "NOTA") {
      partySlogans.push("NOTA");
      continue;
    }

    const dbCandidate = await Candidate.findOne({
      candidateId: i,
    });

    if (!dbCandidate) {
      res.render("500.ejs", { voter: req.body.voter });
      return;
    }
    partySlogans.push(dbCandidate.partySlogan);
  }
  res.render("voter/vote", {
    title: "Vote",
    noOfCandidates,
    candidateIds,
    candidateNames,
    partyNames,
    partySlogans,
    voter: req.body.voter,
  });
});

// GET /voter/vote/id
router.get("/vote/:id", ensureAuthentication, async (req, res) => {
  let candidateId = req.params.id;
  const noOfCandidates = await election.methods.candidateCount().call();
  const addresses = await web3.eth.getAccounts();

  if (!validateCandidateId(candidateId, noOfCandidates)) {
    res.status(404).render("voter/404");
    return;
  }

  // candidateId = parseInt(candidateId);

  let voter = await Voter.findOne({ aadhaar: req.body.voter.aadhaar });

  if (!voter) {
    res.status(404).render("voter/404");
    return;
  }

  if (!voter.phone) {
    req.flash("error_msg", "Please register your phone number !");
    res.redirect("/voter/register-phone");
    return;
  }

  if (!voter.ethAcc || !addresses.includes(voter.ethAcc)) {
    req.flash("error_msg", "Please register your ethereum account !");
    res.redirect("/voter/register-ethereum");
    return;
  }

  const voterAddress = voter.ethAcc;

  try {
    await election.methods
      .vote(candidateId)
      .send({ from: voterAddress, gas: 3000000 });
  } catch (error) {
    console.log(error);
    res.send(error);
    return;
  }

  res.send("Voting done");
});

// GET /voter/results
router.get("/results", ensureAuthentication, async (req, res) => {
  const noOfCandidates = await election.methods.candidateCount().call();

  let candidateNames = [];
  let partyNames = [];
  let voteCounts = [];

  for (let i = 1; i <= noOfCandidates; i++) {
    const candidate = await election.methods.getCandidate(i.toString()).call();
    candidateNames.push(candidate._candidateName);
    partyNames.push(candidate._partyName);
    voteCounts.push(candidate._voteCount);
  }

  res.render("voter/results", {
    title: "Results",
    noOfCandidates,
    candidateNames,
    partyNames,
    voteCounts,
    voter: req.body.voter,
  });
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
