const mongoose = require('mongoose');
const Feed = require('../models/Feed');

// Add this for environment variables
require('dotenv').config();

const defaultFeeds = [
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    isActive: true,
    parser: 'standard'
  },
  {
    name: 'NDTV',
    url: 'https://feeds.feedburner.com/ndtvnews-top-stories',
    isActive: true,
    parser: 'feedburner'
  },
  {
    name: 'India Today',
    url: 'https://www.indiatoday.in/rss/1206578',
    isActive: true,
    parser: 'standard'
  },
  {
    name: 'The Indian Express',
    url: 'https://indianexpress.com/feed/',
    isActive: true,
    parser: 'wordpress'
  },
  {
    name: 'New Indian Express - Nation',
    url: 'https://www.newindianexpress.com/Nation/rssfeed/?id=171',
    isActive: true,
    parser: 'standard'
  },
  {
    name: 'Business Standard',
    url: 'https://www.business-standard.com/rss/latest.rss',
    isActive: true,
    parser: 'custom'
  },
  {
    name: 'Mint',
    url: 'https://www.livemint.com/rss/news',
    isActive: true,
    parser: 'standard'
  }
];

async function initializeFeeds() {
  try {
    // Use MongoDB Atlas connection string
    const uri = process.env.MONGODB_URI || 'your_connection_string_here';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Clear existing feeds
    await Feed.deleteMany({});

    // Insert default feeds
    await Feed.insertMany(defaultFeeds);

    console.log('Feeds initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing feeds:', error);
    process.exit(1);
  }
}

initializeFeeds(); 