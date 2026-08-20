const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email }
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user.password) {
    return res.status(400).json({ message: 'This account uses Google Login. Please sign in with Google.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email }
  });
});

// POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  const { credential, accessToken } = req.body;

  let email, name, googleId;

  try {
    if (credential) {
      // Verify ID token directly via Google API
      const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      const payload = response.data;
      email = payload.email;
      name = payload.name || payload.email.split('@')[0];
      googleId = payload.sub;
    } else if (accessToken) {
      // Verify Access token directly via Google UserInfo API
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      email = response.data.email;
      name = response.data.name || email.split('@')[0];
      googleId = response.data.sub;
    } else {
      return res.status(400).json({ message: 'Google credential or access token is required' });
    }
  } catch (err) {
    console.error('Google token verification error:', err.response?.data || err.message);
    return res.status(401).json({ message: 'Invalid or expired Google token' });
  }

  if (!email) {
    return res.status(400).json({ message: 'Failed to retrieve email from Google profile' });
  }

  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  } else {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      googleId
    });
  }

  res.json({
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email }
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = { register, login, googleLogin, getMe };
