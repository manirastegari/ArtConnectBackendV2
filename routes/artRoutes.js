const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const router = express.Router();
const Art = require('../models/Art');

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

// Add a new art piece
router.post('/', upload.array('images', 3), async (req, res) => {
  try {
    const { title, category, price, description, artistID } = req.body;
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

    const newArt = new Art({
      title,
      category,
      images: imageBase64Strings,
      price,
      description,
      artistID,
    });

    await newArt.save();
    res.status(201).json({ message: 'Art added successfully' });
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
        { description: new RegExp(query, 'i') },
        { category: new RegExp(query, 'i') }
      ];
    }

    // let arts;
    if (category && category !== "") {
      filter.category = category;
    }

    const arts = await Art.find(filter).sort({ _id: -1 }).limit(10);
    res.json(arts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// router.get('/', async (req, res) => {
//   try {
//     const { query, category } = req.query;
//     const filter = { isAvailable: true };

//     if (query) {
//       filter.$or = [
//         { title: new RegExp(query, 'i') },
//         { description: new RegExp(query, 'i') },
//         { category: new RegExp(query, 'i') } 
//       ];
//     }

//     // if (category) {
//     if (category && category !== "") {
//       filter.category = category;
//     }

//     console.log("Filter usedArt:", filter);

//     const arts = await Art.find(filter).sort({ _id: -1 }).limit(10);
//     res.json(arts);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Get art details by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching art with ID: ${req.params.id}`);
    const art = await Art.findById(req.params.id);
    if (!art) {
      return res.status(404).json({ error: 'Art not found' });
    }
    res.json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update art availability
router.patch('/:id', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const art = await Art.findByIdAndUpdate(req.params.id, { isAvailable }, { new: true });
    if (!art) {
      return res.status(404).json({ error: 'Art not found' });
    }
    res.json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;