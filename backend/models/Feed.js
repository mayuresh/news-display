const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastFetched: Date
});

module.exports = mongoose.model('Feed', feedSchema); 