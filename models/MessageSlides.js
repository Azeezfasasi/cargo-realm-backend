const mongoose = require('mongoose')

const messageSlideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a message title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Please provide a message content'],
      trim: true,
      maxlength: [500, 'Message cannot be more than 500 characters']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    icon: {
      type: String,
      default: null,
      trim: true
    },
    backgroundColor: {
      type: String,
      default: '#1976D2',
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'messageSlides'
  }
)

// Index for active messages and display order for efficient querying
messageSlideSchema.index({ isActive: 1, displayOrder: 1 })

module.exports = mongoose.model('MessageSlide', messageSlideSchema)
