require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('./models/Listing');

const dummyItem = {
  lenderId: new mongoose.Types.ObjectId(), // Fake ID for testing
  title: 'Test Calculator',
  photo: 'https://example.com/calc.jpg',
  category: 'Electronics',
  price: 15,
  description: 'This is a test item to verify the database.',
  isAvailable: true
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB. Inserting test data...');
    await Listing.create(dummyItem);
    console.log('🚀 Test item added successfully!');
    process.exit();
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  });