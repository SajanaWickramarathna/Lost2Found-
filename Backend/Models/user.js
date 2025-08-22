const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Counter Schema to keep track of auto-increment user_id
const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
});

const Counter = mongoose.models.counter || mongoose.model("counter", counterSchema);

const userSchema = new Schema({
  user_id: { type: Number, unique: true }, // Auto-incremented
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  profilePic: { type: String }, // optional
  role: { type: String, enum: ['admin', 'user'], default: 'user' }, // for moderation
  phone: { type: String },
  isVerified: { type: Boolean, default: false }, // email/phone verification
  createdAt: { type: Date, default: Date.now }
});

// Auto-increment user_id before save
userSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "user_id" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    this.user_id = counter.value;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
