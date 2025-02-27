require('dotenv').config();
const mongoose = require('mongoose');
const RSSService = require('../services/rssService');
const Feed = require('../models/Feed');

async function testAllFeeds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const feeds = await Feed.find({ isActive: true });
    console.log(`Testing ${feeds.length} feeds...\n`);

    for (const feed of feeds) {
      console.log(`\n=== Testing ${feed.name} ===`);
      console.log(`URL: ${feed.url}`);
      console.log(`Parser type: ${feed.parser}`);

      try {
        const feedData = await RSSService.testFeed(feed.url, feed.parser);
        if (feedData && feedData.items && feedData.items.length > 0) {
          const firstItem = feedData.items[0];
          console.log('\nFirst item details:');
          console.log('Title:', firstItem.title);
          console.log('Has content:', !!firstItem.content || !!firstItem.contentEncoded);
          console.log('Has image:', !!RSSService.extractImageUrl(firstItem, feed.parser));
          console.log('Publication date:', firstItem.pubDate);
          console.log('Link:', firstItem.link);
          console.log('\nTotal items:', feedData.items.length);
        } else {
          console.log('❌ No items found in feed');
        }
      } catch (error) {
        console.error('❌ Error testing feed:', error.message);
      }
    }

    // Test the full feed fetching process
    console.log('\n=== Testing complete feed fetch ===');
    const allNews = await RSSService.fetchFeeds();
    console.log(`Successfully fetched ${allNews.length} news items`);
    console.log('\nSample news item:');
    if (allNews.length > 0) {
      const sample = allNews[0];
      console.log({
        title: sample.title,
        contentLength: sample.content.length,
        hasImage: !!sample.imageUrl,
        source: sample.source,
        pubDate: sample.pubDate
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Test failed:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

testAllFeeds(); 