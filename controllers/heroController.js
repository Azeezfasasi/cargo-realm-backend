const Hero = require('../models/Hero');

// Get all active hero slides
exports.getAllHeroSlides = async (req, res) => {
  try {
    const slides = await Hero.find({ isActive: true }).sort({ order: 1 });
    res.json(slides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all hero slides (including inactive ones) - for admin
exports.getAllHeroSlidesForAdmin = async (req, res) => {
  try {
    const slides = await Hero.find().sort({ order: 1 });
    res.json(slides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single hero slide by ID
exports.getHeroSlideById = async (req, res) => {
  try {
    const slide = await Hero.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: 'Hero slide not found' });
    res.json(slide);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid slide ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Create new hero slide
exports.createHeroSlide = async (req, res) => {
  try {
    const { headline, description, image, alt, cta, buttonText, order } = req.body;

    if (!headline || !description || !image || !alt || !cta || !buttonText) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const slide = new Hero({
      headline,
      description,
      image,
      alt,
      cta,
      buttonText,
      order: order || 0,
      isActive: true
    });

    await slide.save();
    res.status(201).json(slide);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update hero slide
exports.updateHeroSlide = async (req, res) => {
  try {
    const { headline, description, image, alt, cta, buttonText, order, isActive } = req.body;

    const slide = await Hero.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: 'Hero slide not found' });

    // Update fields if provided
    if (headline !== undefined) slide.headline = headline;
    if (description !== undefined) slide.description = description;
    if (image !== undefined) slide.image = image;
    if (alt !== undefined) slide.alt = alt;
    if (cta !== undefined) slide.cta = cta;
    if (buttonText !== undefined) slide.buttonText = buttonText;
    if (order !== undefined) slide.order = order;
    if (isActive !== undefined) slide.isActive = isActive;

    await slide.save();
    res.json(slide);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid slide ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Delete hero slide
exports.deleteHeroSlide = async (req, res) => {
  try {
    const slide = await Hero.findByIdAndDelete(req.params.id);
    if (!slide) return res.status(404).json({ message: 'Hero slide not found' });
    res.json({ message: 'Hero slide deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid slide ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Toggle hero slide active status
exports.toggleHeroSlideStatus = async (req, res) => {
  try {
    const slide = await Hero.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: 'Hero slide not found' });

    slide.isActive = !slide.isActive;
    await slide.save();
    res.json(slide);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid slide ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Reorder slides
exports.reorderSlides = async (req, res) => {
  try {
    const { slides } = req.body;

    if (!Array.isArray(slides)) {
      return res.status(400).json({ message: 'Slides must be an array' });
    }

    // Update order for each slide
    for (const slide of slides) {
      await Hero.findByIdAndUpdate(slide.id, { order: slide.order });
    }

    const updatedSlides = await Hero.find().sort({ order: 1 });
    res.json(updatedSlides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
