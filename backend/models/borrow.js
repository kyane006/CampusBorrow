const mongoose = require('mongoose');

// how the message will look like
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
});

const borrowSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Completed', 'Canceled'], 
    default: 'Pending' 
  },

  // to keep the messages
  messages: [messageSchema]
  
}, { timestamps: true });

module.exports = mongoose.model('Borrow', borrowSchema);