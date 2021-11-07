// Importing mongoose
const mongoose = require("mongoose");

// MongoDb URI
const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/BlockVote";

const initDB = () => {
  // Connect to MongoDB
  mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;

  // MongoDB Error Handling
  db.on("error", (error) => console.error(`MongoDB Error occurred : ${error}`));

  db.once("open", () => {
    console.log("MongoDB connection successful");
  });
};

module.exports = { initDB };
