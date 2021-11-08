// Importing mongoose
const mongoose = require("mongoose");

// Mongoose Schema for voter
const VoterSchema = new mongoose.Schema({
  aadhaar: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "others"],
    required: true,
  },
  phone: {
    type: String,
  },
  ethAcc: {
    type: String,
    unique: true,
  },
});

const Voter = mongoose.model("Voter", VoterSchema);

module.exports = Voter;
