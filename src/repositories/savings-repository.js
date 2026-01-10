const dbConn = require('../database/connection');
const db = dbConn.getDb();

class SavingsRepository {
  
  static createTransaction(transactionData) {
    const { user_id, amount, transaction_type, description, posted_by, transaction_date } = transactionData;
    
    const stmt = db.prepare(`
      INSERT INTO savings_transactions (user_id, amount, transaction_type, description, posted_by, transaction_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(user_id, amount, transaction_type, description, posted_by, transaction_date);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM savings_transactions WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM savings_transactions 
      WHERE user_id = ? 
      ORDER BY transaction_date DESC, created_at DESC
    `);
    return stmt.all(userId);
  }

  static getUserBalance(userId) {
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as balance
      FROM savings_transactions 
      WHERE user_id = ?
    `);
    return stmt.get(userId).balance;
  }

  static getAllBalances() {
    const stmt = db.prepare(`
      SELECT u.id, u.full_name, u.username, COALESCE(SUM(st.amount), 0) as balance
      FROM users u
      LEFT JOIN savings_transactions st ON u.id = st.user_id
      WHERE u.role = 'member'
      GROUP BY u.id, u.full_name, u.username
      ORDER BY u.full_name
    `);
    return stmt.all();
  }

  static getTotalSavings() {
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM savings_transactions 
      WHERE transaction_type IN ('deposit', 'interest')
    `);
    return stmt.get().total;
  }

  static getMemberSavingsForPeriod(userId, startDate, endDate) {
    const stmt = db.prepare(`
      SELECT * FROM savings_transactions 
      WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
      ORDER BY transaction_date DESC
    `);
    return stmt.all(userId, startDate, endDate);
  }

  static getAllSavingsForPeriod(startDate, endDate) {
    const stmt = db.prepare(`
      SELECT st.*, u.full_name, u.username
      FROM savings_transactions st
      JOIN users u ON st.user_id = u.id
      WHERE st.transaction_date BETWEEN ? AND ?
      ORDER BY st.transaction_date DESC, u.full_name
    `);
    return stmt.all(startDate, endDate);
  }

  static getMonthlyDeposits(year, month) {
    const stmt = db.prepare(`
      SELECT u.id, u.full_name, COALESCE(SUM(st.amount), 0) as monthly_deposit
      FROM users u
      LEFT JOIN savings_transactions st ON u.id = st.user_id 
        AND st.transaction_type = 'deposit'
        AND strftime('%Y', st.transaction_date) = ?
        AND strftime('%m', st.transaction_date) = ?
      WHERE u.role = 'member'
      GROUP BY u.id, u.full_name
      ORDER BY u.full_name
    `);
    return stmt.all(year.toString(), month.toString().padStart(2, '0'));
  }

  static distributeInterest(distributions) {
    const stmt = db.prepare(`
      INSERT INTO savings_transactions (user_id, amount, transaction_type, description, posted_by, transaction_date)
      VALUES (?, ?, 'interest', ?, ?, ?)
    `);

    const transaction = db.transaction((distList) => {
      for (const dist of distList) {
        stmt.run(dist.user_id, dist.amount, dist.description, dist.posted_by, dist.transaction_date);
      }
    });

    transaction(distributions);
  }

  static getMemberStatement(userId, startDate, endDate) {
    const stmt = db.prepare(`
      SELECT 
        transaction_date,
        transaction_type,
        amount,
        description,
        (SELECT SUM(amount) FROM savings_transactions st2 
         WHERE st2.user_id = ? AND st2.created_at <= st.created_at) as running_balance
      FROM savings_transactions st
      WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
      ORDER BY transaction_date ASC, created_at ASC
    `);
    return stmt.all(userId, userId, startDate, endDate);
  }
}

module.exports = SavingsRepository;