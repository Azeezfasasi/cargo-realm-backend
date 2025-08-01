const multer = require('multer');
const cloudinary = require('../utils/cloudinary');

// Configure Multer to store files in memory
const storage = multer.memoryStorage();

// Initialize Multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check extension
    const extname = filetypes.test(file.originalname.toLowerCase());
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    console.log(`File filter: originalname=${file.originalname}, mimetype=${file.mimetype}, extnameMatch=${extname}, mimetypeMatch=${mimetype}`); // DEBUG: File type check

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG, GIF) are allowed!'), false);
    }
  }
}).single('profileImage'); // 'profileImage' is the name of the field in the frontend form

// Middleware to upload to Cloudinary
const cloudinaryUpload = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      // Multer error (e.g., file size limit, invalid file type)
      console.error('Multer error in cloudinaryUpload:', err.message); // DEBUG: Multer error
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      // No file was uploaded, proceed to next middleware/controller
      console.log('No file uploaded for profile image.'); // DEBUG: No file
      return next();
    }

    try {
      console.log('Attempting Cloudinary upload for file:', req.file.originalname); // DEBUG: Starting upload
      const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
        folder: 'church_website/profile_images', // Optional: specify a folder in Cloudinary
        public_id: `profile_${req.user.id}_${Date.now()}` // Optional: unique public ID
      });

      console.log('Cloudinary upload successful. URL:', result.secure_url); // DEBUG: Upload success
      // Attach the Cloudinary URL to the request body or a custom property
      req.body.profileImageUrl = result.secure_url; // Use secure_url for HTTPS
      next(); // Proceed to the next middleware/controller
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError); // DEBUG: Cloudinary error
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary: ' + cloudinaryError.message });
    }
  });
};

module.exports = cloudinaryUpload;
