require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import your Listing model
const Listing = require('./models/listing'); 
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
app.post('/api/items', async (req, res) => {
    try {
        const newItem = await Listing.create(req.body);
        
        res.status(201).json(newItem); 
    } catch (error) {
        res.status(400).json({ message: 'Failed to create item', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});

// the delete function
app.delete('/api/items/:id', async (req, res) => {
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