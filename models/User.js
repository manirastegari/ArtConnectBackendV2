const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: [{ type: mongoose.Schema.Types.ObjectId }],
  followed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['Artist', 'Customer'], required: true },
  image: { type: String, default: '' },
  purchasedArts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Art' }],
  bookedEvents: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    seats: { type: Number, required: true }
  }],
});

module.exports = mongoose.model('User', userSchema);
