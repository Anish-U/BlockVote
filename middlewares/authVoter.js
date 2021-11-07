// Importing jsonwebtoken module
const jwt = require("jsonwebtoken");

// Importing Voter model
const Voter = require("../models/voter");

const ensureAuthentication = async (req, res, next) => {
  const voterAuthToken = req.cookies.voterAuthToken;

  if (voterAuthToken == null || voterAuthToken == "") {
    req.flash("error_msg", "Please log in to access the page");
    res.status(400).redirect("/voter/login");
    return;
  }
  jwt.verify(voterAuthToken, process.env.JWT_KEY, async (err, data) => {
    if (err) {
      req.flash("error_msg", "Please log in to access the page");
      res.status(400).redirect("/voter/login");
      return;
    } else {
      const { _id } = data;
      const voter = await Voter.findOne({ _id: _id });
      if (!voter) {
        req.flash("error_msg", "Please log in to access the page");
        res.status(400).redirect("/voter/login");
        return;
      }
      req.body.voter = voter;
      next();
    }
  });
};

const forwardAuthentication = async (req, res, next) => {
  const voterAuthToken = req.cookies.voterAuthToken;

  if (voterAuthToken == null || voterAuthToken == "") {
    next();
    return;
  }
  jwt.verify(voterAuthToken, process.env.JWT_KEY, async (err, data) => {
    if (err) {
      next();
      return;
    } else {
      const { _id } = data;
      const voter = await Voter.findOne({ _id: _id });
      if (!voter) {
        next();
        return;
      }
      req.body.voter = voter;
      res.redirect("/voter/dashboard");
      return;
    }
  });
};

module.exports = { ensureAuthentication, forwardAuthentication };
