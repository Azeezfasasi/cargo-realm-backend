const Services = require('../models/Services');

// Get all active services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Services.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all services (including inactive ones) - for admin
exports.getAllServicesForAdmin = async (req, res) => {
  try {
    const services = await Services.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Services.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid service ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Create new service
exports.createService = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const service = new Services({
      title,
      description,
      isActive: true
    });

    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const { title, description, isActive } = req.body;

    const service = await Services.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Update fields if provided
    if (title !== undefined) service.title = title;
    if (description !== undefined) service.description = description;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();
    res.json(service);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid service ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const service = await Services.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid service ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Toggle service active status
exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Services.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    service.isActive = !service.isActive;
    await service.save();
    res.json(service);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid service ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};
