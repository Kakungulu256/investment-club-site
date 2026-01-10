const Database = require('better-sqlite3');

const db = new Database('investment_club.db');
db.pragma('foreign_keys = ON');

class RepaymentScheduleRepository {
  
  static createSchedule(loanId, scheduleItems) {
    const insertStmt = db.prepare(`
      INSERT INTO repayment_schedules (loan_id, month_number, due_date, scheduled_amount, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((items) => {
      for (const item of items) {
        insertStmt.run(loanId, item.month_number, item.due_date, item.scheduled_amount, item.status);
      }
    });

    transaction(scheduleItems);
  }

  static findByLoanId(loanId) {
    const stmt = db.prepare(`
      SELECT * FROM repayment_schedules 
      WHERE loan_id = ? 
      ORDER BY month_number ASC
    `);
    return stmt.all(loanId);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM repayment_schedules WHERE id = ?');
    return stmt.get(id);
  }

  static markPaid(scheduleId, actualAmount, paymentDate, postedBy) {
    const stmt = db.prepare(`
      UPDATE repayment_schedules 
      SET actual_amount = ?, status = 'paid', payment_date = ?, posted_by = ?
      WHERE id = ?
    `);
    
    return stmt.run(actualAmount, paymentDate, postedBy, scheduleId);
  }

  static updateScheduledAmount(scheduleId, newAmount) {
    const stmt = db.prepare(`
      UPDATE repayment_schedules 
      SET scheduled_amount = ?
      WHERE id = ?
    `);
    
    return stmt.run(newAmount, scheduleId);
  }

  static getOverduePayments() {
    const stmt = db.prepare(`
      SELECT rs.*, l.user_id, u.full_name, l.principal
      FROM repayment_schedules rs
      JOIN loans l ON rs.loan_id = l.id
      JOIN users u ON l.user_id = u.id
      WHERE rs.status = 'pending' AND rs.due_date < DATE('now')
      ORDER BY rs.due_date ASC
    `);
    return stmt.all();
  }

  static markOverdue() {
    const stmt = db.prepare(`
      UPDATE repayment_schedules 
      SET status = 'overdue'
      WHERE status = 'pending' AND due_date < DATE('now')
    `);
    
    return stmt.run();
  }

  static getTotalPendingPayments(loanId) {
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(scheduled_amount), 0) as total
      FROM repayment_schedules 
      WHERE loan_id = ? AND status = 'pending'
    `);
    return stmt.get(loanId).total;
  }

  static getNextPayment(loanId) {
    const stmt = db.prepare(`
      SELECT * FROM repayment_schedules 
      WHERE loan_id = ? AND status = 'pending'
      ORDER BY month_number ASC
      LIMIT 1
    `);
    return stmt.get(loanId);
  }

  static updateMultipleSchedules(updates) {
    const stmt = db.prepare(`
      UPDATE repayment_schedules 
      SET scheduled_amount = ?
      WHERE id = ?
    `);

    const transaction = db.transaction((updateList) => {
      for (const update of updateList) {
        stmt.run(update.scheduled_amount, update.id);
      }
    });

    transaction(updates);
  }
}

module.exports = RepaymentScheduleRepository;