# News Display Project

A web application to display news from various Indian news sources using RSS feeds.

## Current Status
- Backend setup complete with MongoDB Atlas
- RSS feed fetching implemented and tested
- Feeds configured: Times of India, NDTV, India Today, etc.
- Database initialization script working

## Next Steps
- Set up Git repository
- Deploy to Render
- Create frontend display

## Configuration
- MongoDB Atlas connection configured in .env
- Feed refresh interval: 10 seconds
- Caching latest 10 news items

## Scripts
- `npm run init-db`: Initialize feeds in database
- `npm run test-feeds`: Test RSS feed fetching 