const db = require('../database/connection');

class AuditLogger {
  
  static log(userId, action, tableName, recordId = null, oldValues = null, newValues = null) {
    const stmt = db.getDb().prepare(`
      INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      userId,
      action,
      tableName,
      recordId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null
    );
  }

  static logSavingsTransaction(userId, action, transactionData) {
    this.log(userId, action, 'savings_transactions', transactionData.id, null, transactionData);
  }

  static logLoanAction(userId, action, loanData, oldData = null) {
    this.log(userId, action, 'loans', loanData.id, oldData, loanData);
  }

  static logRepayment(userId, action, repaymentData) {
    this.log(userId, action, 'repayment_transactions', repaymentData.id, null, repaymentData);
  }

  static logConfigChange(userId, key, oldValue, newValue) {
    this.log(userId, 'UPDATE_CONFIG', 'system_config', null, { key, value: oldValue }, { key, value: newValue });
  }

  static logExpense(userId, action, expenseData) {
    this.log(userId, action, 'expenses', expenseData.id, null, expenseData);
  }

  static getAuditTrail(tableName = null, recordId = null, limit = 100) {
    let query = `
      SELECT al.*, u.username, u.full_name
      FROM audit_log al
      JOIN users u ON al.user_id = u.id
    `;
    const params = [];
    
    if (tableName) {
      query += ' WHERE al.table_name = ?';
      params.push(tableName);
      
      if (recordId) {
        query += ' AND al.record_id = ?';
        params.push(recordId);
      }
    }
    
    query += ' ORDER BY al.timestamp DESC LIMIT ?';
    params.push(limit);
    
    const stmt = db.getDb().prepare(query);
    return stmt.all(...params);
  }
}

module.exports = AuditLogger;