const MessageSlide = require('../models/MessageSlides')

// @desc    Get all message slides
// @route   GET /api/messageslides
// @access  Public
exports.getMessageSlides = async (req, res) => {
  try {
    const messageSlides = await MessageSlide.find()
      .sort({ isActive: -1, displayOrder: 1, createdAt: -1 })
    
    res.status(200).json({
      success: true,
      count: messageSlides.length,
      data: messageSlides
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching message slides',
      error: error.message
    })
  }
}

// @desc    Get active message slides only
// @route   GET /api/messageslides/active
// @access  Public
exports.getActiveMessageSlides = async (req, res) => {
  try {
    const messageSlides = await MessageSlide.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
    
    res.status(200).json({
      success: true,
      count: messageSlides.length,
      data: messageSlides
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active message slides',
      error: error.message
    })
  }
}

// @desc    Get single message slide by ID
// @route   GET /api/messageslides/:id
// @access  Public
exports.getMessageSlideById = async (req, res) => {
  try {
    const messageSlide = await MessageSlide.findById(req.params.id)
    
    if (!messageSlide) {
      return res.status(404).json({
        success: false,
        message: 'Message slide not found'
      })
    }
    
    res.status(200).json({
      success: true,
      data: messageSlide
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching message slide',
      error: error.message
    })
  }
}

// @desc    Create new message slide
// @route   POST /api/messageslides
// @access  Private/Admin
exports.createMessageSlide = async (req, res) => {
  try {
    const { title, message, isActive, displayOrder, icon, backgroundColor } = req.body

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and message content'
      })
    }

    const messageSlide = await MessageSlide.create({
      title: title.trim(),
      message: message.trim(),
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0,
      icon: icon || null,
      backgroundColor: backgroundColor || '#1976D2'
    })

    res.status(201).json({
      success: true,
      message: 'Message slide created successfully',
      data: messageSlide
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating message slide',
      error: error.message
    })
  }
}

// @desc    Update message slide
// @route   PUT /api/messageslides/:id
// @access  Private/Admin
exports.updateMessageSlide = async (req, res) => {
  try {
    let messageSlide = await MessageSlide.findById(req.params.id)

    if (!messageSlide) {
      return res.status(404).json({
        success: false,
        message: 'Message slide not found'
      })
    }

    const { title, message, isActive, displayOrder, icon, backgroundColor } = req.body

    // Update fields
    if (title !== undefined) messageSlide.title = title.trim()
    if (message !== undefined) messageSlide.message = message.trim()
    if (isActive !== undefined) messageSlide.isActive = isActive
    if (displayOrder !== undefined) messageSlide.displayOrder = displayOrder
    if (icon !== undefined) messageSlide.icon = icon
    if (backgroundColor !== undefined) messageSlide.backgroundColor = backgroundColor

    messageSlide = await messageSlide.save()

    res.status(200).json({
      success: true,
      message: 'Message slide updated successfully',
      data: messageSlide
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating message slide',
      error: error.message
    })
  }
}

// @desc    Delete message slide
// @route   DELETE /api/messageslides/:id
// @access  Private/Admin
exports.deleteMessageSlide = async (req, res) => {
  try {
    const messageSlide = await MessageSlide.findByIdAndDelete(req.params.id)

    if (!messageSlide) {
      return res.status(404).json({
        success: false,
        message: 'Message slide not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Message slide deleted successfully',
      data: {}
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message slide',
      error: error.message
    })
  }
}

// @desc    Bulk update message slides status
// @route   PUT /api/messageslides/bulk/toggle-status
// @access  Private/Admin
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of message IDs'
      })
    }

    const result = await MessageSlide.updateMany(
      { _id: { $in: ids } },
      { isActive }
    )

    res.status(200).json({
      success: true,
      message: 'Message slides updated successfully',
      data: result
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating message slides',
      error: error.message
    })
  }
}
