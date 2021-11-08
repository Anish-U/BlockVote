// Importing mongoose
const mongoose = require("mongoose");

// Mongoose Schema for candidate
const candidateSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    unique: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  partyName: {
    type: String,
    required: true,
  },
  partySlogan: {
    type: String,
    required: true,
  },
  // partyImage: {
  // type: String,
  // required: true,
  // },
});

const Candidate = mongoose.model("Candidate", candidateSchema);

module.exports = Candidate;
