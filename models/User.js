const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Art' }],
  type: { type: String, enum: ['Artist', 'Customer'], required: true },
  image: { type: String, default: '' }
});

module.exports = mongoose.model('User', userSchema);