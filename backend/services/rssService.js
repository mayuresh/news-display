const Parser = require('rss-parser');
const Feed = require('../models/Feed');

// Add these parser configurations at the top of the file
const PARSER_CONFIGS = {
  standard: {
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['content:encoded', 'contentEncoded'],
        ['description', 'description']
      ]
    }
  },
  feedburner: {
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['content:encoded', 'contentEncoded'],
        ['description', 'description'],
        ['feedburner:origLink', 'originalLink']
      ]
    }
  },
  wordpress: {
    customFields: {
      item: [
        ['content:encoded', 'contentEncoded'],
        ['dc:creator', 'creator'],
        ['wp:featuredmedia', 'featuredMedia']
      ]
    }
  },
  custom: {
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['content:encoded', 'contentEncoded'],
        ['description', 'description'],
        ['bs:image', 'bsImage'] // Business Standard specific
      ]
    }
  }
};

class RSSService {
  constructor() {
    this.parsers = {};
    // Initialize parsers for each type with custom headers
    Object.entries(PARSER_CONFIGS).forEach(([type, config]) => {
      this.parsers[type] = new Parser({
        ...config,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 5000,
        customFields: {
          ...config.customFields,
          item: [
            ...(config.customFields?.item || []),
            ['pubDate', 'pubDate'],
            ['published', 'published'],
            ['date', 'date']
          ]
        }
      });
    });
  }

  async fetchFeeds() {
    try {
      const activeFeeds = await Feed.find({ isActive: true });
      let allNews = [];

      for (const feed of activeFeeds) {
        try {
          console.log(`Fetching feed: ${feed.name}`);
          const parser = this.parsers[feed.parser] || this.parsers.standard;
          const feedData = await parser.parseURL(feed.url);
          
          if (!feedData || !feedData.items) {
            console.warn(`No items found in feed: ${feed.name}`);
            continue;
          }

          const newsItems = feedData.items.map(item => ({
            title: this.sanitizeText(item.title),
            content: this.extractContent(item, feed.parser),
            imageUrl: this.extractImageUrl(item, feed.parser),
            pubDate: this.parseDate(item.pubDate || item.published || item.date),
            source: feed.name,
            link: this.getLink(item, feed.parser),
            author: item.author || item.creator || feed.name
          })).filter(item => item.title && item.content); // Filter out items without title or content

          console.log(`Successfully fetched ${newsItems.length} items from ${feed.name}`);
          allNews = [...allNews, ...newsItems];
          
          feed.lastFetched = new Date();
          await feed.save();
        } catch (error) {
          console.error(`Error fetching feed ${feed.name}:`, error.message);
          // Don't mark as inactive immediately, give it a few tries
          if (feed.lastFetched && 
              (new Date() - feed.lastFetched) > 24 * 60 * 60 * 1000) {
            feed.isActive = false;
            await feed.save();
            console.log(`Marked feed ${feed.name} as inactive due to repeated failures`);
          }
        }
      }

      return allNews
        .filter(item => this.isValidNewsItem(item))
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 10);
    } catch (error) {
      console.error('Error in fetchFeeds:', error);
      throw error;
    }
  }

  extractContent(item, parserType) {
    // Try different content fields in order of preference
    const content = item.contentEncoded || 
                   item.content || 
                   item.description || 
                   item['content:encoded'] ||
                   item.summary || 
                   '';
    
    return this.sanitizeText(this.stripHtml(content));
  }

  extractImageUrl(item, parserType) {
    switch (parserType) {
      case 'wordpress':
        if (item.featuredMedia) return item.featuredMedia;
        break;
      case 'feedburner':
        if (item.mediaContent && Array.isArray(item.mediaContent)) {
          const highestRes = item.mediaContent.sort((a, b) => 
            (b.$.width || 0) - (a.$.width || 0)
          )[0];
          if (highestRes) return highestRes.$.url;
        }
        break;
      case 'custom':
        if (item.bsImage) return item.bsImage;
        break;
    }

    // Try different image fields in order of preference
    if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
      return item.mediaContent.$.url;
    }

    if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
      return item.mediaThumbnail.$.url;
    }

    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }

    // Try to extract image from content
    const imgMatch = this.extractImageFromHtml(item.content || item.description || '');
    if (imgMatch) {
      return imgMatch;
    }

    return null;
  }

  extractImageFromHtml(html) {
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = html.match(imgRegex);
    return match ? match[1] : null;
  }

  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  sanitizeText(text) {
    if (!text) return '';
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  parseDate(dateStr) {
    try {
      // Handle different date formats
      if (!dateStr) return new Date().toISOString();
      
      // Try different date formats
      const formats = [
        // RFC 2822
        date => new Date(date),
        // ISO 8601
        date => new Date(date),
        // Indian format
        date => {
          const [d, m, y] = date.split(/[/ -]/);
          return new Date(`${y}-${m}-${d}`);
        },
        // Unix timestamp
        date => new Date(parseInt(date) * 1000)
      ];

      for (const format of formats) {
        try {
          const parsed = format(dateStr);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        } catch (e) {
          continue;
        }
      }

      console.warn(`Could not parse date: ${dateStr}, using current date`);
      return new Date().toISOString();
    } catch (e) {
      console.warn('Invalid date format:', dateStr);
      return new Date().toISOString();
    }
  }

  isValidNewsItem(item) {
    // Ensure required fields are present and valid
    return (
      item.title && 
      item.title.length > 0 &&
      item.content && 
      item.content.length > 0 &&
      item.link &&
      item.link.startsWith('http')
    );
  }

  getLink(item, parserType) {
    switch (parserType) {
      case 'feedburner':
        return item.originalLink || item.link;
      default:
        return item.link;
    }
  }

  async testFeed(feedUrl, parserType = 'standard') {
    try {
      const parser = this.parsers[parserType] || this.parsers.standard;
      const feedData = await parser.parseURL(feedUrl);
      console.log('Feed structure:', JSON.stringify(feedData.items[0], null, 2));
      return feedData;
    } catch (error) {
      console.error('Feed test failed:', error);
      return null;
    }
  }
}

module.exports = new RSSService(); 