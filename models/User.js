const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee', 'client', 'agent'], default: 'client' },
  gender: { type: String },
  phoneNumber: { type: String },
  homeAddress: { type: String },
  country: { type: String },
  state: { type: String },
  isDisabled: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  profileImageUrl: {
    type: String,
    default: null 
  }
}, { timestamps: true });

// Hash password before saving, only when it changed. Callers set the plain-text
// password and save; hashing it themselves first would hash it twice.
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
