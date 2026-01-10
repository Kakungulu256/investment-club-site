const Database = require('better-sqlite3');

const db = new Database('investment_club.db');
db.pragma('foreign_keys = ON');

class LoanRepository {
  
  static create(loanData) {
    const { user_id, principal, interest_rate, processing_fee, repayment_period, total_amount, application_date } = loanData;
    
    const stmt = db.prepare(`
      INSERT INTO loans (user_id, principal, interest_rate, processing_fee, repayment_period, 
                        total_amount, remaining_balance, status, application_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);
    
    const result = stmt.run(user_id, principal, interest_rate, processing_fee, repayment_period, 
                           total_amount, total_amount, application_date);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM loans WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  }

  static findPendingLoans() {
    const stmt = db.prepare(`
      SELECT l.*, u.full_name, u.username 
      FROM loans l 
      JOIN users u ON l.user_id = u.id 
      WHERE l.status = 'pending' 
      ORDER BY l.created_at ASC
    `);
    return stmt.all();
  }

  static approve(loanId, approvedBy, disbursementDate) {
    const stmt = db.prepare(`
      UPDATE loans 
      SET status = 'approved', approved_by = ?, approval_date = CURRENT_DATE, 
          disbursement_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(approvedBy, disbursementDate, loanId);
  }

  static reject(loanId, approvedBy) {
    const stmt = db.prepare(`
      UPDATE loans 
      SET status = 'rejected', approved_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(approvedBy, loanId);
  }

  static updateBalance(loanId, newBalance) {
    const stmt = db.prepare(`
      UPDATE loans 
      SET remaining_balance = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(newBalance, loanId);
  }

  static markCompleted(loanId) {
    const stmt = db.prepare(`
      UPDATE loans 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(loanId);
  }

  static getActiveLoans() {
    const stmt = db.prepare(`
      SELECT l.*, u.full_name 
      FROM loans l 
      JOIN users u ON l.user_id = u.id 
      WHERE l.status IN ('approved', 'active') 
      ORDER BY l.disbursement_date DESC
    `);
    return stmt.all();
  }

  static getTotalActiveLoans() {
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(remaining_balance), 0) as total
      FROM loans 
      WHERE status IN ('approved', 'active')
    `);
    return stmt.get().total;
  }
}

module.exports = LoanRepository;