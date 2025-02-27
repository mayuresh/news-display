const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  displayDuration: {
    type: Number,
    default: 10000 // in milliseconds
  },
  cacheSize: {
    type: Number,
    default: 10
  },
  screenDimensions: {
    width: {
      type: Number,
      default: 1920
    },
    height: {
      type: Number,
      default: 1080
    }
  },
  fontSize: {
    title: {
      type: Number,
      default: 48
    },
    content: {
      type: Number,
      default: 24
    }
  }
});

module.exports = mongoose.model('Config', configSchema); 