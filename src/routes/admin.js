const express = require('express');
const ConfigRepository = require('../repositories/config-repository');
const AuthMiddleware = require('../middleware/auth');
const AuditLogger = require('../utils/audit-logger');

const router = express.Router();

// Get system configuration
router.get('/config', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const config = ConfigRepository.getAll();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get financial configuration
router.get('/config/financial', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const config = ConfigRepository.getFinancialConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update system configuration
router.put('/config', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const { configs } = req.body;
    
    if (!configs || !Array.isArray(configs)) {
      return res.status(400).json({ error: 'Configs array is required' });
    }
    
    // Validate each config
    const validKeys = ['annual_subscription_fee', 'loan_interest_rate', 'early_repayment_rate', 'loan_processing_fee'];
    const invalidConfigs = configs.filter(config => !validKeys.includes(config.key));
    
    if (invalidConfigs.length > 0) {
      return res.status(400).json({ 
        error: `Invalid configuration keys: ${invalidConfigs.map(c => c.key).join(', ')}` 
      });
    }
    
    // Log old values for audit
    const oldValues = {};
    configs.forEach(config => {
      const oldConfig = ConfigRepository.get(config.key);
      oldValues[config.key] = oldConfig ? oldConfig.value : null;
    });
    
    // Update configurations
    ConfigRepository.updateMultiple(configs, req.user.id);
    
    // Log configuration changes
    configs.forEach(config => {
      AuditLogger.logConfigChange(req.user.id, config.key, oldValues[config.key], config.value);
    });
    
    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update individual configuration
router.put('/config/:key', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    const validKeys = ['annual_subscription_fee', 'loan_interest_rate', 'early_repayment_rate', 'loan_processing_fee'];
    if (!validKeys.includes(key)) {
      return res.status(400).json({ error: 'Invalid configuration key' });
    }
    
    // Get old value for audit
    const oldConfig = ConfigRepository.get(key);
    const oldValue = oldConfig ? oldConfig.value : null;
    
    // Update configuration
    ConfigRepository.set(key, value, req.user.id, description);
    
    // Log configuration change
    AuditLogger.logConfigChange(req.user.id, key, oldValue, value);
    
    res.json({ message: `${key} updated successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit trail
router.get('/audit', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const { table_name, record_id, limit } = req.query;
    
    const auditTrail = AuditLogger.getAuditTrail(
      table_name || null,
      record_id ? parseInt(record_id) : null,
      limit ? parseInt(limit) : 100
    );
    
    res.json(auditTrail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record expense
router.post('/expenses', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const { category, amount, description, expense_date } = req.body;
    
    if (!category || !amount || !description) {
      return res.status(400).json({ error: 'Category, amount, and description are required' });
    }
    
    const validCategories = ['admin', 'bank_fees', 'retained_earnings'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid expense category' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const db = require('../database/connection');
    const stmt = db.getDb().prepare(`
      INSERT INTO expenses (category, amount, description, expense_date, posted_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      category,
      parseFloat(amount),
      description,
      expense_date || new Date().toISOString().split('T')[0],
      req.user.id
    );
    
    // Log the expense
    AuditLogger.logExpense(req.user.id, 'EXPENSE_RECORDED', {
      id: result.lastInsertRowid,
      category,
      amount: parseFloat(amount),
      description
    });
    
    res.status(201).json({
      message: 'Expense recorded successfully',
      expenseId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expenses
router.get('/expenses', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const { category, start_date, end_date, limit } = req.query;
    
    let query = `
      SELECT e.*, u.full_name as posted_by_name
      FROM expenses e
      JOIN users u ON e.posted_by = u.id
    `;
    const params = [];
    const conditions = [];
    
    if (category) {
      conditions.push('e.category = ?');
      params.push(category);
    }
    
    if (start_date && end_date) {
      conditions.push('e.expense_date BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const db = require('../database/connection');
    const stmt = db.getDb().prepare(query);
    const expenses = stmt.all(...params);
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get financial summary
router.get('/financial-summary', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const SavingsService = require('../services/savings-service');
    const LoanService = require('../services/loan-service');
    
    // Get savings pool total
    const totalSavings = SavingsService.getTotalSavingsPool();
    
    // Get active loans summary
    const activeLoans = LoanService.getActiveLoans();
    const totalLoansPrincipal = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
    const totalLoansOutstanding = activeLoans.reduce((sum, loan) => sum + loan.remaining_balance, 0);
    
    // Get member balances
    const memberBalances = SavingsService.getAllMemberBalances();
    const memberCount = memberBalances.length;
    
    // Get recent expenses
    const db = require('../database/connection');
    const expenseStmt = db.getDb().prepare(`
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE expense_date >= date('now', '-30 days')
      GROUP BY category
    `);
    const recentExpenses = expenseStmt.all();
    
    res.json({
      totalSavings,
      totalLoansPrincipal,
      totalLoansOutstanding,
      memberCount,
      activeLoansCount: activeLoans.length,
      recentExpenses,
      netPosition: totalSavings - totalLoansOutstanding
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;