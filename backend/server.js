require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import your Listing model
const Listing = require('./models/listing'); 
const User = require('./models/user');
const app = express();
const port = process.env.PORT || 3001; 
app.use(cors());
app.use(express.json());


// all the database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch(err => console.error('MongoDB connection error:', err.message));


app.get('/', (req, res) => {
    res.send('Welcome to the CampusBorrow API!');
});

app.get('/api/items', async (req, res) => {
    try {
        const items = await Listing.find(); 
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server error pulling items', error: error.message });
    }
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

// all the items
app.get('/api/items/:id', async (req, res) => {
    try {
        const item = await Listing.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error tracking item', error: error.message });
    }
});

// add the items
app.post('/api/items', verifyToken, async (req, res) => {
    try {
        const newItem = await Listing.create({
            ...req.body,
            lenderId: req.user.userId 
        });
        
        res.status(201).json(newItem); 
    } catch (error) {
        res.status(400).json({ message: 'Failed to create item', error: error.message });
    }
});

// Update an existing item 
app.put('/api/items/:id', verifyToken, async (req, res) => {
    try {
        const item = await Listing.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Security check
        if (item.lenderId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied. You can only edit your own items.' });
        }

        const updatedItem = await Listing.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating item', error: error.message });
    }
});

// the delete function
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

// Register a new user
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check if the email is already in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // 2. Encrypt the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create and save the new user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // 4. Send success response (but don't send the password back!)
        res.status(201).json({ 
            message: 'User created successfully', 
            userId: newUser._id 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// Login an existing user
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

        // --- NEW JWT CODE ---
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } 
        );

        res.status(200).json({ 
            message: 'Login successful', 
            userId: user._id,
            token: token // Sending the token back
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});