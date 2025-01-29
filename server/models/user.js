const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  watchList: [{
    movieId: { type: Number, required: true },
    title: { type: String, required: true },
    poster_path: String,
    vote_average: Number,
    release_date: String,
    overview: String,
    dateAdded: { type: Date, default: Date.now }
  }]
});

// compile model from schema
module.exports = mongoose.model("user", UserSchema);
