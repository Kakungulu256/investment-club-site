const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const initDatabase = () => {
  const db = new sqlite3.Database('investment_club.db');
  
  // Enable foreign keys
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
        full_name TEXT NOT NULL,
        phone TEXT,
        subscription_paid BOOLEAN DEFAULT FALSE,
        subscription_year INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // System configuration
    db.run(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `);

    // Savings transactions
    db.run(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'interest')),
        description TEXT,
        posted_by INTEGER NOT NULL,
        transaction_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (posted_by) REFERENCES users(id)
      )
    `);

    // Loans
    db.run(`
      CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        principal DECIMAL(15,2) NOT NULL,
        interest_rate DECIMAL(5,4) NOT NULL,
        processing_fee DECIMAL(15,2) NOT NULL,
        repayment_period INTEGER NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        remaining_balance DECIMAL(15,2) NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected')),
        application_date DATE NOT NULL,
        approval_date DATE,
        disbursement_date DATE,
        approved_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // Repayment schedules
    db.run(`
      CREATE TABLE IF NOT EXISTS repayment_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        month_number INTEGER NOT NULL,
        due_date DATE NOT NULL,
        scheduled_amount DECIMAL(15,2) NOT NULL,
        actual_amount DECIMAL(15,2) DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
        payment_date DATE,
        posted_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id),
        FOREIGN KEY (posted_by) REFERENCES users(id),
        UNIQUE(loan_id, month_number)
      )
    `);

    // Repayment transactions
    db.run(`
      CREATE TABLE IF NOT EXISTS repayment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL,
        schedule_id INTEGER,
        amount DECIMAL(15,2) NOT NULL,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('regular', 'early', 'partial')),
        interest_applied DECIMAL(15,2) DEFAULT 0,
        payment_date DATE NOT NULL,
        posted_by INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id),
        FOREIGN KEY (schedule_id) REFERENCES repayment_schedules(id),
        FOREIGN KEY (posted_by) REFERENCES users(id)
      )
    `);

    // Interest distributions
    db.run(`
      CREATE TABLE IF NOT EXISTS interest_distributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        distribution_type TEXT NOT NULL CHECK (distribution_type IN ('loan_interest', 'trust_earnings')),
        amount DECIMAL(15,2) NOT NULL,
        calculation_basis TEXT,
        distribution_date DATE NOT NULL,
        posted_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (posted_by) REFERENCES users(id)
      )
    `);

    // Expenses
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL CHECK (category IN ('admin', 'bank_fees', 'retained_earnings')),
        amount DECIMAL(15,2) NOT NULL,
        description TEXT NOT NULL,
        expense_date DATE NOT NULL,
        posted_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (posted_by) REFERENCES users(id)
      )
    `);

    // Audit log
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert default system configuration
    db.run(`INSERT OR IGNORE INTO system_config (key, value, description) VALUES (?, ?, ?)`, 
      ['annual_subscription_fee', '50000', 'Annual subscription fee in currency units']);
    db.run(`INSERT OR IGNORE INTO system_config (key, value, description) VALUES (?, ?, ?)`, 
      ['loan_interest_rate', '0.02', 'Standard loan interest rate (2%)']);
    db.run(`INSERT OR IGNORE INTO system_config (key, value, description) VALUES (?, ?, ?)`, 
      ['early_repayment_rate', '0.03', 'Early repayment interest rate (3%)']);
    db.run(`INSERT OR IGNORE INTO system_config (key, value, description) VALUES (?, ?, ?)`, 
      ['loan_processing_fee', '5000', 'Fixed loan processing fee']);

    // Create default admin user
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role, full_name, subscription_paid, subscription_year) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@crownzcom.com', adminPassword, 'admin', 'System Administrator', true, new Date().getFullYear()]);

    // Create default member user
    const memberPassword = bcrypt.hashSync('member123', 10);
    db.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role, full_name, subscription_paid, subscription_year) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['member', 'member@crownzcom.com', memberPassword, 'member', 'John Doe', true, new Date().getFullYear()], function(err) {
      if (err) {
        console.error('Error creating users:', err);
      } else {
        console.log('Database initialized successfully');
      }
      db.close();
    });
  });
};

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };