const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const router = express.Router();
const User = require('../models/User');
const Art = require('../models/Art');
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

// Update user image
router.post('/update-image/:id', upload.single('image'), async (req, res) => {
  try {
    const buffer = await sharp(req.file.buffer)
      .resize(250, 250) // Smaller size for profile pictures
      .toFormat('webp')
      .toBuffer();

    // Reduce quality until the image is under 50 KB
    let quality = 90;
    while (buffer.length > 50 * 1024 && quality > 10) {
      buffer = await sharp(req.file.buffer)
        .resize(250, 250)
        .toFormat('webp', { quality })
        .toBuffer();
      quality -= 10;
    }

    // Convert buffer to base64
    const base64Image = buffer.toString('base64');
    const user = await User.findByIdAndUpdate(req.params.id, { image: base64Image }, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Image updated successfully', image: base64Image });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Implement token generation or session management here
    res.status(200).json({ message: 'Login successful', userId: user._id, userType: user.type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { fullname, email, password, type } = req.body;
    const newUser = new User({ fullname, email, password, type });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  // Implement token/session invalidation logic here
  console.log('User logged out successfully');
  res.status(200).json({ message: 'Logout successful' });
});

// Get user details with posted arts and events
router.get('/details/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('fullname email type image favorites followed purchasedArts bookedEvents')
      .populate('favorites')
      .populate('followed')
      .populate('purchasedArts')
      .populate('bookedEvents');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch posted arts and events
    const postedArts = await Art.find({ artistID: req.params.id });
    const postedEvents = await Event.find({ artistID: req.params.id });

    res.json({
      user: user.toObject(), // Wrap user data in a 'user' key
      postedArts,
      postedEvents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite art or event
router.post('/toggle-favorite/:userId/:itemId/:itemType', async (req, res) => {
  try {
    const { userId, itemId, itemType } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (itemType.toLowerCase() === 'art') {
      const isFavorite = user.favoriteArts.includes(itemId);
      if (isFavorite) {
        user.favoriteArts.pull(itemId);
      } else {
        user.favoriteArts.push(itemId);
      }
    } else if (itemType.toLowerCase() === 'event') {
      const isFavorite = user.favoriteEvents.includes(itemId);
      if (isFavorite) {
        user.favoriteEvents.pull(itemId);
      } else {
        user.favoriteEvents.push(itemId);
      }
    }

    await user.save();
    res.status(200).json({ message: 'Favorites updated successfully', favoriteArts: user.favoriteArts, favoriteEvents: user.favoriteEvents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite art a
// router.post('/toggle-favorite/:userId/:artId', async (req, res) => {
//   try {
//     const { userId, artId } = req.params;
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const isFavorite = user.favorites.includes(artId);
//     if (isFavorite) {
//       user.favorites.pull(artId);
//     } else {
//       user.favorites.push(artId);
//     }

//     await user.save();
//     res.status(200).json({ message: 'Favorites updated successfully', favorites: user.favorites });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Fetch user's favorite arts and events
router.get('/favorites/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const favoriteArts = await Art.find({ _id: { $in: user.favorites } });

    const favoriteEvents = await Event.find({ _id: { $in: user.favorites } });

    res.json({ arts: favoriteArts, events: favoriteEvents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new route to toggle follow
router.post('/toggle-follow/:userId/:artistId', async (req, res) => {
  try {
    const { userId, artistId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = user.followed.includes(artistId);
    if (isFollowing) {
      user.followed.pull(artistId);
    } else {
      user.followed.push(artistId);
    }

    await user.save();
    res.status(200).json({ message: 'Follow status updated successfully', followed: user.followed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Azb
router.post('/complete-order', async (req, res) => {
  const { userId, itemId, itemType } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (itemType.toLowerCase() === 'art') {
      const art = await Art.findById(itemId);
      if (!art) {
        return res.status(404).json({ error: 'Art not found' });
      }
      user.purchasedArts.push(art._id);
    } else if (itemType.toLowerCase() === 'event') {
      const event = await Event.findById(itemId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      user.bookedEvents.push(event._id);
    }

    await user.save();
    res.status(200).json({ message: 'Order completed and user data updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;