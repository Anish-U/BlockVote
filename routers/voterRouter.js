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
router.get("/dashboard", ensureAuthentication, async (req, res) => {
  const electionStage = await election.methods.electionStage().call();
  const phone = req.body.voter.phone;
  const ethAcc = req.body.voter.ethAcc;

  res.render("voter/dashboard", {
    title: "Dashboard",
    electionStage,
    phone,
    ethAcc,
    voter: req.body.voter,
  });
});

// GET /voter/register-phone
router.get("/register-phone", ensureAuthentication, async (req, res) => {
  const electionStage = await election.methods.electionStage().call();

  if (electionStage != 0) {
    req.flash("error_msg", "Not in Registration Phase");
    res.redirect("/voter/dashboard");
    return;
  }

  res.render("voter/phone", {
    title: "Register Phone",
    phone: req.body.voter.phone,
    voter: req.body.voter,
  });
});

//POST /voter/register-phone
router.post("/register-phone", ensureAuthentication, async (req, res) => {
  const electionStage = await election.methods.electionStage().call();

  if (electionStage != 0) {
    req.flash("error_msg", "Not in Registration Phase");
    res.redirect("/voter/dashboard");
    return;
  }

  const { phoneNumber } = req.body;
  const errors = validatePhone(phoneNumber);

  const phone = req.body.voter.phone;

  if (phone != null) {
    req.flash("error_msg", "Phone already registered");
    res.redirect("/voter/dashboard");
    return;
  }

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
router.get("/register-ethereum", ensureAuthentication, async (req, res) => {
  const electionStage = await election.methods.electionStage().call();

  if (electionStage != 0) {
    req.flash("error_msg", "Not in Registration Phase");
    res.redirect("/voter/dashboard");
    return;
  }

  res.render("voter/ethereum", {
    title: "Register Ethereum",
    ethAcc: req.body.voter.ethAcc,
    voter: req.body.voter,
  });
});

//POST /voter/register-ethereum
router.post("/register-ethereum", ensureAuthentication, async (req, res) => {
  const electionStage = await election.methods.electionStage().call();

  if (electionStage != 0) {
    req.flash("error_msg", "Not in Registration Phase");
    res.redirect("/voter/dashboard");
    return;
  }

  const { ethereumAccount } = req.body;
  const errors = validateEthereum(ethereumAccount);

  const ethAcc = req.body.voter.ethAcc;

  if (ethAcc != null) {
    req.flash("error_msg", "Ethereum Account already registered");
    res.redirect("/voter/dashboard");
    return;
  }

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
  const electionStage = await election.methods.electionStage().call();

  if (electionStage != 1) {
    req.flash("error_msg", "Not in Voting Phase");
    res.redirect("/voter/dashboard");
    return;
  }

  if (req.body.voter.ethAcc == null || req.body.voter.phone == null) {
    req.flash(
      "error_msg",
      "You dont have the right to vote. Since you missed registration phase"
    );
    res.redirect("/voter/dashboard");
    return;
  }

  const ethAcc = req.body.voter.ethAcc;
  const addresses = await web3.eth.getAccounts();

  if (!addresses.includes(ethAcc) || ethAcc == adminAddress) {
    req.flash("error_msg", "You dont have the right to vote.");
    res.redirect("/voter/dashboard");
    return;
  }

  const hasVoted = await election.methods.doneVoting(ethAcc).call();
  console.log(hasVoted);

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
    hasVoted,
    voter: req.body.voter,
  });
});

// GET /voter/vote/id
router.get("/vote/:id", ensureAuthentication, async (req, res) => {
  const electionStage = await election.methods.electionStage().call();

  if (electionStage != 1) {
    req.flash("error_msg", "Not in Voting Phase");
    res.redirect("/voter/dashboard");
    return;
  }

  if (req.body.voter.ethAcc == null || req.body.voter.phone == null) {
    req.flash(
      "error_msg",
      "You dont have the right to vote. Since you missed registration phase"
    );
    res.redirect("/voter/dashboard");
    return;
  }

  const ethAcc = req.body.voter.ethAcc;
  const addresses = await web3.eth.getAccounts();

  if (!addresses.includes(ethAcc) || ethAcc == adminAddress) {
    req.flash("error_msg", "You dont have the right to vote.");
    res.redirect("/voter/dashboard");
    return;
  }

  const hasVoted = await election.methods.doneVoting(ethAcc).call();
  console.log(hasVoted);

  if (hasVoted) {
    req.flash("error_msg", "Your vote has been saved already");
    res.redirect("/voter/dashboard");
    return;
  }

  let candidateId = req.params.id;
  const noOfCandidates = await election.methods.candidateCount().call();

  if (!validateCandidateId(candidateId, noOfCandidates)) {
    res.status(404).render("voter/404");
    return;
  }

  try {
    await election.methods
      .vote(candidateId, ethAcc)
      .send({ from: ethAcc, gas: 3000000 });
  } catch (error) {
    console.log(error);
    req.flash("error_msg", "Error occurred. Please try again later !!");
    res.redirect("/voter/dashboard");
    return;
  }

  req.flash("success_msg", "Your vote has been saved successfully");
  res.redirect("/voter/dashboard");
  return;
});

// GET /voter/results
router.get("/results", ensureAuthentication, async (req, res) => {
  const noOfCandidates = await election.methods.candidateCount().call();
  const electionStage = await election.methods.electionStage().call();

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
    electionStage,
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
