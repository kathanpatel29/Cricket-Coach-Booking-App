const mongoose = require('mongoose');

const userDeletionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserDeletionLog', userDeletionLogSchema);