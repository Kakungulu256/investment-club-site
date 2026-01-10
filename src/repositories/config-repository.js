const Database = require('better-sqlite3');

const db = new Database('investment_club.db');
db.pragma('foreign_keys = ON');

class ConfigRepository {
  
  static get(key) {
    const stmt = db.prepare('SELECT value FROM system_config WHERE key = ?');
    const result = stmt.get(key);
    return result ? result.value : null;
  }

  static set(key, value, updatedBy) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO system_config (key, value, updated_by, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    return stmt.run(key, value, updatedBy);
  }

  static getAll() {
    const stmt = db.prepare('SELECT * FROM system_config ORDER BY key');
    return stmt.all();
  }

  static getSubscriptionFee() {
    const value = this.get('annual_subscription_fee');
    return value ? parseFloat(value) : 50000;
  }

  static getLoanInterestRate() {
    const value = this.get('loan_interest_rate');
    return value ? parseFloat(value) : 0.02;
  }

  static getEarlyRepaymentRate() {
    const value = this.get('early_repayment_rate');
    return value ? parseFloat(value) : 0.03;
  }

  static getLoanProcessingFee() {
    const value = this.get('loan_processing_fee');
    return value ? parseFloat(value) : 5000;
  }

  static updateMultiple(configs, updatedBy) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO system_config (key, value, updated_by, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction((configList) => {
      for (const config of configList) {
        stmt.run(config.key, config.value, updatedBy);
      }
    });

    transaction(configs);
  }

  static getConfigWithHistory(key) {
    const stmt = db.prepare(`
      SELECT sc.*, u.full_name as updated_by_name
      FROM system_config sc
      LEFT JOIN users u ON sc.updated_by = u.id
      WHERE sc.key = ?
    `);
    return stmt.get(key);
  }

  static getAllWithHistory() {
    const stmt = db.prepare(`
      SELECT sc.*, u.full_name as updated_by_name
      FROM system_config sc
      LEFT JOIN users u ON sc.updated_by = u.id
      ORDER BY sc.key
    `);
    return stmt.all();
  }
}

module.exports = ConfigRepository;