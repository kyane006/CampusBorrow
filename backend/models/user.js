const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  photo: { type: String }, 
  campusLocation: { type: String }, 
  bio: { type: String },
  aggregateLenderRating: { type: Number, default: 0 },
  aggregateBorrowerRating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);