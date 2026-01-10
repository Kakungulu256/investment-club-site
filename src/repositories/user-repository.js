const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('investment_club.db');
db.pragma('foreign_keys = ON');

class UserRepository {
  
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  static create(userData) {
    const { username, email, password, role, full_name, phone } = userData;
    const password_hash = bcrypt.hashSync(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, full_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(username, email, password_hash, role, full_name, phone);
    return this.findById(result.lastInsertRowid);
  }

  static updateSubscription(userId, year) {
    const stmt = db.prepare(`
      UPDATE users SET subscription_paid = TRUE, subscription_year = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(year, userId);
  }

  static getAllMembers() {
    const stmt = db.prepare(`
      SELECT id, username, email, full_name, phone, subscription_paid, subscription_year, created_at
      FROM users WHERE role = 'member'
      ORDER BY full_name
    `);
    return stmt.all();
  }

  static getSubscribedMembers(year = null) {
    let query = `
      SELECT id, username, email, full_name, phone, subscription_paid, subscription_year, created_at
      FROM users WHERE role = 'member' AND subscription_paid = TRUE
    `;
    const params = [];
    
    if (year) {
      query += ' AND subscription_year = ?';
      params.push(year);
    }
    
    query += ' ORDER BY full_name';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  }

  static updatePassword(userId, newPassword) {
    const password_hash = bcrypt.hashSync(newPassword, 10);
    const stmt = db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    
    return stmt.run(password_hash, userId);
  }

  static updateProfile(userId, profileData) {
    const { full_name, phone, email } = profileData;
    const stmt = db.prepare(`
      UPDATE users SET full_name = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(full_name, phone, email, userId);
  }
}

module.exports = UserRepository;