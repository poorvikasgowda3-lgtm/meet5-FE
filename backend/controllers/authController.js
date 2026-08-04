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
  const timestamp = new Date().toISOString();
  console.log(`\n==================================================`);
  console.log(`[EXPRESS BACKEND ${timestamp}] POST /api/auth/login received`);

  try {
    const { email, password } = req.body || {};
    console.log(`[EXPRESS BACKEND] Payload -> Email: "${email}", Password length: ${password ? password.length : 0}`);

    if (!email || !email.trim()) {
      console.warn(`[EXPRESS BACKEND] Missing email in request`);
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    if (!password) {
      console.warn(`[EXPRESS BACKEND] Missing password in request`);
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      console.log(`[EXPRESS BACKEND] Querying MongoDB for: ${normalizedEmail}`);
      try {
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
          console.log(`[EXPRESS BACKEND] Found user in MongoDB. Verifying password...`);
          const isMatch = await user.matchPassword(password);
          if (!isMatch) {
            console.warn(`[EXPRESS BACKEND] Password mismatch for: ${normalizedEmail}`);
            return res.status(401).json({ message: 'Invalid email or password' });
          }
          console.log(`[EXPRESS BACKEND] Login SUCCESS for MongoDB user: ${normalizedEmail}`);
          const token = generateToken(user._id);
          console.log(`[EXPRESS BACKEND] Generated JWT token. Returning 200 OK.`);
          console.log(`==================================================\n`);
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
            token,
          });
        }

        console.log(`[EXPRESS BACKEND] User not in MongoDB. Creating new MongoDB user...`);
        const defaultName = normalizedEmail.split('@')[0];
        user = await User.create({
          name: defaultName,
          email: normalizedEmail,
          password,
        });

        console.log(`[EXPRESS BACKEND] User created in MongoDB. Returning 201 Created.`);
        const token = generateToken(user._id);
        console.log(`==================================================\n`);
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
          token,
        });
      } catch (mongoErr) {
        console.warn(`[EXPRESS BACKEND] MongoDB query error (${mongoErr.message}). Switching to persistent DB engine...`);
      }
    }

    // 2. Persistent file-database engine
    console.log(`[EXPRESS BACKEND] Querying persistent file-database for: ${normalizedEmail}`);
    let dbUser = findUserByEmail(normalizedEmail);
    let isNewUser = false;

    if (dbUser) {
      console.log(`[EXPRESS BACKEND] User found in persistent database (ID: ${dbUser.id}). Verifying password...`);
      if (!verifyPassword(password, dbUser)) {
        console.warn(`[EXPRESS BACKEND] Password mismatch for persistent user: ${normalizedEmail}`);
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      console.log(`[EXPRESS BACKEND] Password verification SUCCESS for: ${normalizedEmail}`);
    } else {
      console.log(`[EXPRESS BACKEND] User not found. Creating new user in persistent database...`);
      dbUser = createUser(normalizedEmail, password);
      isNewUser = true;
      console.log(`[EXPRESS BACKEND] User created in DB (ID: ${dbUser.id}).`);
    }

    const token = generateJwtToken(dbUser);
    console.log(`[EXPRESS BACKEND] Token generated. Returning HTTP ${isNewUser ? 201 : 200} response.`);
    console.log(`==================================================\n`);

    return res.status(isNewUser ? 201 : 200).json({
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
    console.error(`[EXPRESS BACKEND ERROR] Login error:`, error);
    console.log(`==================================================\n`);
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
