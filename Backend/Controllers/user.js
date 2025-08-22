const User = require('../Models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetPassword } = require('../utils/mailer');
require("dotenv").config();


// ✅ Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};


// ✅ Get user by auto-incremented user_id
exports.getUserById = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findOne({ user_id: id }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};


// ✅ Forgot password (send reset link)
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "1h" });

    await sendResetPassword(email, token);

    res.status(200).json({ message: "Reset link sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending reset link", error: error.message });
  }
};


// ✅ Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(400).json({ message: 'Invalid Token' });

    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};


// ✅ Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your account before login." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "60m" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      id: user.user_id
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ✅ Authentication (get logged-in user profile)
exports.authentication = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ user_id: req.user.id }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


// ✅ Verify email
exports.verifyemail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(400).json({ message: 'Invalid Token' });

    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};


// ✅ Update user
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const user_id = req.body.userId;

    const existingUser = await User.findOne({ user_id });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If a new file is uploaded, use it; otherwise, keep existing
    const profilePic = req.file ? `/uploads/${req.file.filename}` : existingUser.profilePic;

    const updateData = {
      firstName,
      lastName,
      email,
      phone,
      profilePic
    };

    const user = await User.findOneAndUpdate({ user_id }, updateData, { new: true }).select("-password");
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};


// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user_id = req.query.id;
    await User.findOneAndDelete({ user_id });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};
