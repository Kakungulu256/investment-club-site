const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/user-repository');

const JWT_SECRET = process.env.JWT_SECRET || 'crownzcom-investment-club-secret-key';

class AuthMiddleware {
  
  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  static authenticate(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = UserRepository.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid token. User not found.' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token.' });
    }
  }
  
  static requireRole(role) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      
      if (req.user.role !== role) {
        return res.status(403).json({ error: `Access denied. ${role} role required.` });
      }
      
      next();
    };
  }
  
  static requireAdmin(req, res, next) {
    return AuthMiddleware.requireRole('admin')(req, res, next);
  }
  
  static requireSubscription(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (!req.user.subscription_paid) {
      return res.status(403).json({ 
        error: 'Subscription fee must be paid to access this feature.' 
      });
    }
    
    next();
  }
  
  static requireOwnResourceOrAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    const resourceUserId = parseInt(req.params.userId || req.body.user_id);
    
    if (req.user.role === 'admin' || req.user.id === resourceUserId) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Can only access your own resources.' });
    }
  }
}

module.exports = AuthMiddleware;