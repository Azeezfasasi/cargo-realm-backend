const Facility = require('../models/Facility');

exports.getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find().sort({ isActive: -1, name: 1 });
    res.json(facilities);
  } catch (err) {
    console.error('Error fetching facilities:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({ isActive: true }).sort({ name: 1 });
    res.json(facilities);
  } catch (err) {
    console.error('Error fetching active facilities:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json(facility);
  } catch (err) {
    console.error('Error fetching facility:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createFacility = async (req, res) => {
  try {
    const { name, code, country, state, city, address, contactPerson, contactPhone, contactEmail, capacity, notes } = req.body;

    // Validate required fields
    if (!name || !country) {
      return res.status(400).json({ message: 'Name and country are required' });
    }

    const facility = new Facility({
      name,
      code,
      country,
      state,
      city,
      address,
      contactPerson,
      contactPhone,
      contactEmail,
      capacity,
      notes
    });

    await facility.save();
    res.status(201).json(facility);
  } catch (err) {
    console.error('Error creating facility:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Facility name or code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json(facility);
  } catch (err) {
    console.error('Error updating facility:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Facility name or code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findByIdAndDelete(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json({ message: 'Facility deleted successfully' });
  } catch (err) {
    console.error('Error deleting facility:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.toggleFacilityStatus = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    facility.isActive = !facility.isActive;
    await facility.save();
    res.json(facility);
  } catch (err) {
    console.error('Error toggling facility status:', err);
    res.status(500).json({ message: err.message });
  }
};
