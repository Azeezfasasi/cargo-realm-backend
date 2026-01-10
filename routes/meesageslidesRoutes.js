const express = require('express')
const router = express.Router()
const {
  getMessageSlides,
  getActiveMessageSlides,
  getMessageSlideById,
  createMessageSlide,
  updateMessageSlide,
  deleteMessageSlide,
  bulkUpdateStatus
} = require('../controllers/messageslidesController')

// Public routes

// Get all message slides GET /api/messageslides
router.get('/', getMessageSlides)

// Get active message slides only GET /api/messageslides/active
router.get('/active', getActiveMessageSlides)

// Get single message slide by ID GET /api/messageslides/:id
router.get('/:id', getMessageSlideById)

// Admin routes (you may want to add authentication middleware here)
router.post('/', createMessageSlide)
router.put('/:id', updateMessageSlide)
router.delete('/:id', deleteMessageSlide)
router.put('/bulk/toggle-status', bulkUpdateStatus)

module.exports = router
