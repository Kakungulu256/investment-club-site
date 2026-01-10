const express = require('express');
const UserRepository = require('../repositories/user-repository');
const ConfigRepository = require('../repositories/config-repository');
const AuthMiddleware = require('../middleware/auth');
const AuditLogger = require('../utils/audit-logger');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = UserRepository.findByUsername(username);
    if (!user || !UserRepository.verifyPassword(user, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = AuthMiddleware.generateToken(user);
    
    // Log successful login
    AuditLogger.log(user.id, 'LOGIN', 'users', user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        subscription_paid: user.subscription_paid
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new member (admin only)
router.post('/register', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const { username, email, password, full_name, phone } = req.body;
    
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Check if user already exists
    if (UserRepository.findByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    if (UserRepository.findByEmail(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const newUser = UserRepository.create({
      username,
      email,
      password,
      role: 'member',
      full_name,
      phone
    });
    
    // Log user creation
    AuditLogger.log(req.user.id, 'USER_CREATED', 'users', newUser.id, null, {
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pay subscription
router.post('/pay-subscription', AuthMiddleware.authenticate, (req, res) => {
  try {
    const { year } = req.body;
    const currentYear = new Date().getFullYear();
    const subscriptionYear = year || currentYear;
    
    // Check if already paid for this year
    if (req.user.subscription_paid && req.user.subscription_year === subscriptionYear) {
      return res.status(400).json({ error: 'Subscription already paid for this year' });
    }
    
    UserRepository.updateSubscription(req.user.id, subscriptionYear);
    
    // Log subscription payment
    AuditLogger.log(req.user.id, 'SUBSCRIPTION_PAID', 'users', req.user.id, null, {
      year: subscriptionYear,
      amount: ConfigRepository.getSubscriptionFee()
    });
    
    res.json({ message: 'Subscription paid successfully', year: subscriptionYear });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', AuthMiddleware.authenticate, (req, res) => {
  try {
    const user = UserRepository.findById(req.user.id);
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      subscription_paid: user.subscription_paid,
      subscription_year: user.subscription_year,
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', AuthMiddleware.authenticate, (req, res) => {
  try {
    const { full_name, phone, email } = req.body;
    
    if (!full_name || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }
    
    // Check if email is taken by another user
    const existingUser = UserRepository.findByEmail(email);
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    UserRepository.updateProfile(req.user.id, { full_name, phone, email });
    
    // Log profile update
    AuditLogger.log(req.user.id, 'PROFILE_UPDATED', 'users', req.user.id);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', AuthMiddleware.authenticate, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    
    const user = UserRepository.findById(req.user.id);
    if (!UserRepository.verifyPassword(user, current_password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    UserRepository.updatePassword(req.user.id, new_password);
    
    // Log password change
    AuditLogger.log(req.user.id, 'PASSWORD_CHANGED', 'users', req.user.id);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all members (admin only)
router.get('/members', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const members = UserRepository.getAllMembers();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;