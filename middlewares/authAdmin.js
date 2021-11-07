// Importing jsonwebtoken module
const jwt = require("jsonwebtoken");

// Importing Admin model
const Admin = require("../models/admin");

const ensureAuthentication = async (req, res, next) => {
  const adminAuthToken = req.cookies.adminAuthToken;

  if (adminAuthToken == null || adminAuthToken == "") {
    req.flash("error_msg", "Please log in to access the page");
    res.status(400).redirect("/admin/login");
    return;
  }
  jwt.verify(adminAuthToken, process.env.JWT_KEY, async (err, data) => {
    if (err) {
      req.flash("error_msg", "Please log in to access the page");
      res.status(400).redirect("/admin/login");
      return;
    } else {
      const { _id } = data;
      const admin = await Admin.findOne({ _id: _id });
      if (!admin) {
        req.flash("error_msg", "Please log in to access the page");
        res.status(400).redirect("/admin/login");
        return;
      }
      req.body.admin = admin;
      next();
    }
  });
};

const forwardAuthentication = async (req, res, next) => {
  const adminAuthToken = req.cookies.adminAuthToken;

  if (adminAuthToken == null || adminAuthToken == "") {
    next();
    return;
  }
  jwt.verify(adminAuthToken, process.env.JWT_KEY, async (err, data) => {
    if (err) {
      next();
      return;
    } else {
      const { _id } = data;
      const admin = await Admin.findOne({ _id: _id });
      if (!admin) {
        next();
        return;
      }
      req.body.admin = admin;
      res.redirect("/admin/dashboard");
      return;
    }
  });
};

module.exports = { ensureAuthentication, forwardAuthentication };
