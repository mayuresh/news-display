const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const feedRoutes = require('./routes/feeds');
const configRoutes = require('./routes/config');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/feeds', feedRoutes);
app.use('/api/config', configRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 