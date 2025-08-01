const Gallery = require('../models/Gallery');
const cloudinary = require('../utils/cloudinary');

exports.addImage = async (req, res) => {
  try {
    const { image, caption } = req.body;
    const uploadRes = await cloudinary.uploader.upload(image, { folder: 'gallery' });
    const gallery = new Gallery({
      imageUrl: uploadRes.secure_url,
      caption,
      uploadedBy: req.user._id,
      publicId: uploadRes.public_id
    });
    await gallery.save();
    res.status(201).json(gallery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllImages = async (req, res) => {
  try {
    const images = await Gallery.find().populate('uploadedBy', 'name email');
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editImage = async (req, res) => {
  try {
    const { caption } = req.body;
    const gallery = await Gallery.findByIdAndUpdate(req.params.id, { caption }, { new: true });
    if (!gallery) return res.status(404).json({ message: 'Image not found' });
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) return res.status(404).json({ message: 'Image not found' });
    await cloudinary.uploader.destroy(gallery.publicId);
    await gallery.deleteOne();
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changeImageStatus = async (req, res) => {
  try {
    const gallery = await Gallery.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!gallery) return res.status(404).json({ message: 'Image not found' });
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
