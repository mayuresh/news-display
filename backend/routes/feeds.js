const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');

// Get all feeds
router.get('/', async (req, res) => {
  try {
    const feeds = await Feed.find();
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new feed
router.post('/', async (req, res) => {
  const feed = new Feed({
    name: req.body.name,
    url: req.body.url,
    isActive: req.body.isActive ?? true
  });

  try {
    const newFeed = await feed.save();
    res.status(201).json(newFeed);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update feed
router.patch('/:id', async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    if (req.body.name) feed.name = req.body.name;
    if (req.body.url) feed.url = req.body.url;
    if (req.body.isActive !== undefined) feed.isActive = req.body.isActive;

    const updatedFeed = await feed.save();
    res.json(updatedFeed);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete feed
router.delete('/:id', async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    await feed.remove();
    res.json({ message: 'Feed deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 