require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Models
const Listing = require('./models/listing'); 
const User = require('./models/user');
const Borrow = require('./models/borrow');
const Review = require('./models/review');

const app = express();
const port = process.env.PORT || 3001; 

// Middleware
app.use(cors());
app.use(express.json());
// Prevent NoSQL injection and XSS

// Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch(err => console.error('MongoDB connection error:', err.message));

app.get('/', (req, res) => {
    res.send('Welcome to the CampusBorrow API!');
});

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const verified = jwt.verify(actualToken, process.env.JWT_SECRET);
        req.user = verified; 
        next(); 
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Search items
app.get('/api/items/search', async (req, res) => {
    try {
        const { keyword, category, maxPrice, isAvailable } = req.query;
        let query = {};

        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { category: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (maxPrice) {
            query.price = { $lte: Number(maxPrice) };
        }

        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }

        const items = await Listing.find(query);
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server error during search', error: error.message });
    }
});

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        const items = await Listing.find({});
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get item by ID
app.get('/api/items/:id', async (req, res) => {
    try {
        const item = await Listing.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create item
app.post('/api/items', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const photoPath = req.file ? `http://localhost:3001/uploads/${req.file.filename}` : '/noimage.jpg';

        const newItem = await Listing.create({
            ...req.body,
            photo: photoPath,
            lenderId: req.user.userId 
        });
        
        res.status(201).json(newItem); 
    } catch (error) {
        res.status(400).json({ message: 'Failed to create item', error: error.message });
    }
});

// Update item
app.put('/api/items/:id', verifyToken, async (req, res) => {
    try {
        const item = await Listing.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.lenderId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied. You can only edit your own items.' });
        }

        const updatedItem = await Listing.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after' }
        );

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating item', error: error.message });
    }
});

// Delete item
app.delete('/api/items/:id', verifyToken, async (req, res) => {
    try {
        const deletedItem = await Listing.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully', deletedItem });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting item', error: error.message });
    }
});




// Register user
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({ 
            message: 'User created successfully', 
            userId: newUser._id 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// Login user
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } 
        );

        res.status(200).json({ 
            message: 'Login successful', 
            userId: user._id,
            token: token
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Update profile
app.put('/api/users/profile', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const { name, bio, campusLocation } = req.body;
        
        const updateData = { name, bio, campusLocation };
        
        if (req.file) {
            updateData.photo = `http://localhost:3001/uploads/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            updateData,
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating profile', error: error.message });
    }
});

// Get profile
app.get('/api/users/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile', error: error.message });
    }
});


// Create borrow request
app.post('/api/borrows', verifyToken, async (req, res) => {
    try {
        const { listingId, pickupDate, returnDate } = req.body;
        
        if (!pickupDate || !returnDate) {
            return res.status(400).json({ message: 'Pickup and return dates are required.' });
        }

        // Get listing to find lender ID
        const listing = await Listing.findById(listingId);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        // Prevent users from borrowing their own item
        if (String(listing.lenderId) === String(req.user.userId)) {
            return res.status(400).json({ message: 'You cannot borrow your own item' });
        }

        const newBorrow = new Borrow({
            listingId,
            borrowerId: req.user.userId,
            lenderId: listing.lenderId, // From database
            pickupDate,
            returnDate,
            status: 'Pending',
            messages: []
        });
        
        await newBorrow.save();
        res.status(201).json({ message: 'Borrow request sent', borrow: newBorrow });
    } catch (error) {
        console.error("Error creating borrow request:", error);
        res.status(500).json({ message: 'Error creating borrow request', error: error.message });
    }
});

// Get my borrows
app.get('/api/borrows/me', verifyToken, async (req, res) => {
    try {
        const myBorrows = await Borrow.find({ borrowerId: req.user.userId }).populate('listingId');
        res.json(myBorrows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching borrowed items', error: error.message });
    }
});

// Update borrow status
app.put('/api/borrows/:id', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedBorrow = await Borrow.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: 'after' }
        );
        
        if (!updatedBorrow) return res.status(404).json({ message: 'Borrow record not found' });
        
        if (status === 'Approved') {
            await Listing.findByIdAndUpdate(updatedBorrow.listingId, { isAvailable: false });
        } else if (status === 'Completed' || status === 'Canceled') {
            await Listing.findByIdAndUpdate(updatedBorrow.listingId, { isAvailable: true });
        }

        res.json(updatedBorrow);
    } catch (error) {
        res.status(500).json({ message: 'Error updating borrow status', error: error.message });
    }
});

// Send message on borrow request
app.post('/api/borrows/:id/messages', verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Message text is required' });

        const borrow = await Borrow.findById(req.params.id);
        if (!borrow) return res.status(404).json({ message: 'Borrow request not found' });

        // Add message to borrow
        borrow.messages.push({
            senderId: req.user.userId,
            text,
            sentAt: new Date()
        });

        await borrow.save();
        
        const updatedBorrow = await Borrow.findById(req.params.id)
            .populate('listingId')
            .populate('borrowerId', 'name photo')
            .populate('messages.senderId', 'name');

        res.json(updatedBorrow);
    } catch (error) {
        res.status(500).json({ message: 'Server error sending message', error: error.message });
    }
});


// Create review
app.post('/api/reviews', verifyToken, async (req, res) => {
    try {
        const { borrowId, revieweeId, rating, comment } = req.body;
        
        if (!comment) {
            return res.status(400).json({ message: 'Comment is required for reviews' });
        }
        
        const borrowRecord = await Borrow.findById(borrowId);
        if (!borrowRecord || borrowRecord.status !== 'Completed') {
            return res.status(400).json({ message: 'Can only review completed borrows' });
        }

        const newReview = new Review({
            borrowId,
            reviewerId: req.user.userId,
            revieweeId,
            rating,
            comment
        });
        
        await newReview.save();
        res.status(201).json({ message: 'Review saved', review: newReview });
    } catch (error) {
        res.status(500).json({ message: 'Error saving review', error: error.message });
    }
});

// Get my reviews
app.get('/api/reviews/me', verifyToken, async (req, res) => {
    try {
        const myReviews = await Review.find({ revieweeId: req.user.userId }).populate('reviewerId', 'name photo');
        res.json(myReviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});