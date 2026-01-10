const ShipmentStatus = require('../models/ShipmentStatus');

exports.getAllStatuses = async (req, res) => {
  try {
    const statuses = await ShipmentStatus.find().sort({ displayOrder: 1, name: 1 });
    res.json(statuses);
  } catch (err) {
    console.error('Error fetching shipment statuses:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveStatuses = async (req, res) => {
  try {
    const statuses = await ShipmentStatus.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    res.json(statuses);
  } catch (err) {
    console.error('Error fetching active statuses:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getStatusById = async (req, res) => {
  try {
    const status = await ShipmentStatus.findById(req.params.id);
    if (!status) return res.status(404).json({ message: 'Status not found' });
    res.json(status);
  } catch (err) {
    console.error('Error fetching status:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createStatus = async (req, res) => {
  try {
    const { name, code, description, color, category, displayOrder } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const status = new ShipmentStatus({
      name,
      code,
      description,
      color,
      category,
      displayOrder
    });

    await status.save();
    res.status(201).json(status);
  } catch (err) {
    console.error('Error creating status:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Status name or code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const status = await ShipmentStatus.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!status) return res.status(404).json({ message: 'Status not found' });
    res.json(status);
  } catch (err) {
    console.error('Error updating status:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Status name or code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const status = await ShipmentStatus.findByIdAndDelete(req.params.id);
    if (!status) return res.status(404).json({ message: 'Status not found' });
    res.json({ message: 'Status deleted successfully' });
  } catch (err) {
    console.error('Error deleting status:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.toggleStatusActive = async (req, res) => {
  try {
    const status = await ShipmentStatus.findById(req.params.id);
    if (!status) return res.status(404).json({ message: 'Status not found' });

    status.isActive = !status.isActive;
    await status.save();
    res.json(status);
  } catch (err) {
    console.error('Error toggling status:', err);
    res.status(500).json({ message: err.message });
  }
};
