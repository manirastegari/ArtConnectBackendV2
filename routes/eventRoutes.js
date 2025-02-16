const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const router = express.Router();
const Event = require('../models/Event');

// Set up multer for file uploads
const upload = multer({
  limits: {
    fileSize: 150 * 1024 * 1024, // 150MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'));
    }
    cb(undefined, true);
  },
});

// Add a new event
router.post('/', upload.array('images', 3), async (req, res) => {
  try {
    const { title, category, price, description, date, time, artistID } = req.body;
    const imageBase64Strings = await Promise.all(
      req.files.map(async (file) => {
        let buffer = await sharp(file.buffer)
          .resize(1200, 800)
          .toFormat('webp')
          .toBuffer();

        // Reduce quality until the image is under 150 KB
        let quality = 90;
        while (buffer.length > 150 * 1024 && quality > 10) {
          buffer = await sharp(file.buffer)
            .resize(1200, 800)
            .toFormat('webp', { quality })
            .toBuffer();
          quality -= 10;
        }

        // Convert buffer to base64
        return buffer.toString('base64');
      })
    );

    const newEvent = new Event({
      title,
      category,
      images: imageBase64Strings, // Store the base64 strings
      price,
      description,
      date,
      time,
      artistID,
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { query, category } = req.query;
    const filter = { isAvailable: true };

    if (query) {
      filter.$or = [
        { title: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') }
      ];
    }

    if (category) {
      filter.category = category;
    }

    const events = await Event.find(filter).sort({ _id: -1 }).limit(10); // Sort by most recent
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event details by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching event with ID: ${req.params.id}`);
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event availability
router.patch('/:id', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const event = await Event.findByIdAndUpdate(req.params.id, { isAvailable }, { new: true });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;