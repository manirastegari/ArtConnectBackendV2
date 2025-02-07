const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const artRoutes = require('./routes/artRoutes');
const eventRoutes = require('./routes/eventRoutes');


// Mongo DB username and password
// saeidkhalili2024
// DZfjS3F8YrLKbJ8p

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/arts', artRoutes);
app.use('/api/events', eventRoutes);

// MongoDB connection string
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define routes
app.get('/', (req, res) => {
  res.send('Hello, ArtConnect!');
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));