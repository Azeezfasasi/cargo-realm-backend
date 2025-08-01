const Blog = require('../models/Blog');
const User = require('../models/User');
const sendMail = require('../utils/mailer');

exports.createBlog = async (req, res) => {
  try {
    const { blogTitle, category, description } = req.body;
    const blog = new Blog({
      blogTitle,
      category,
      description,
      sentBy: req.user._id,
      status: 'published'
    });
    await blog.save();
    // TODO: Send email to subscribers when a blog is published
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' }).populate('sentBy', 'name email');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBlogsForAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().populate('sentBy', 'name email');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changeBlogStatus = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('sentBy', 'name email');
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json(blog);
  } catch (err) {
    // Handle CastError if ID is invalid format (e.g., not a valid MongoDB ObjectId)
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }
    res.status(500).json({ message: err.message });
  }
};
