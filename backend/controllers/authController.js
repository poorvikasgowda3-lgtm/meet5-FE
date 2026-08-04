import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { findUserByEmail, verifyPassword, createUser, generateJwtToken } from '../../src/lib/server-db.js';

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token (Auto register if new)
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ email: normalizedEmail });

      if (user) {
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
        return res.json({
          user: {
            _id: user._id,
            id: user._id,
            user_id: user._id,
            name: user.name,
            display_name: user.name,
            email: user.email,
            username: user.email.split('@')[0],
          },
          token: generateToken(user._id),
        });
      }

      // Auto register if user does not exist
      const defaultName = normalizedEmail.split('@')[0];
      user = await User.create({
        name: defaultName,
        email: normalizedEmail,
        password,
      });

      return res.status(201).json({
        user: {
          _id: user._id,
          id: user._id,
          user_id: user._id,
          name: user.name,
          display_name: user.name,
          email: user.email,
          username: user.email.split('@')[0],
        },
        token: generateToken(user._id),
      });
    }

    // 2. Fallback to file-based persistent DB engine
    let dbUser = findUserByEmail(normalizedEmail);
    if (dbUser) {
      if (!verifyPassword(password, dbUser)) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      dbUser = createUser(normalizedEmail, password);
    }

    const token = generateJwtToken(dbUser);
    return res.json({
      user: {
        _id: dbUser.id,
        id: dbUser.id,
        user_id: dbUser.user_id,
        name: dbUser.name,
        display_name: dbUser.display_name,
        email: dbUser.email,
        username: dbUser.username,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
