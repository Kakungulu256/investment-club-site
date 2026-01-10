const Database = require('better-sqlite3');

class DatabaseConnection {
  constructor(dbPath = 'investment_club.db') {
    this.db = new Database(dbPath);
    // pragmas for safer concurrent writes
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
  }

  getDb() {
    return this.db;
  }

  close() {
    try {
      this.db.close();
    } catch (e) {
      // ignore close errors
    }
  }
}

module.exports = new DatabaseConnection();