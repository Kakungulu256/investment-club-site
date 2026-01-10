const express = require('express');
const SavingsService = require('../services/savings-service');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Get member's savings balance and transactions
router.get('/my-savings', AuthMiddleware.authenticate, (req, res) => {
  try {
    const savings = SavingsService.getUserSavings(req.user.id);
    res.json(savings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get member's financial statement
router.get('/my-statement', AuthMiddleware.authenticate, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];
    
    const statement = SavingsService.getUserStatement(req.user.id, startDate, endDate);
    res.json(statement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
// Post savings for a member
router.post('/post', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const { user_id, amount, description, transaction_date } = req.body;
    
    if (!user_id || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const transaction = await SavingsService.postSavings({
      user_id: parseInt(user_id),
      amount: parseFloat(amount),
      description,
      transaction_date
    }, req.user.id);
    
    res.status(201).json({
      message: 'Savings posted successfully',
      transaction
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Post withdrawal for a member
router.post('/withdraw', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const { user_id, amount, description, transaction_date } = req.body;
    
    if (!user_id || !amount) {
      return res.status(400).json({ error: 'User ID and amount are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const transaction = await SavingsService.withdrawSavings({
      user_id: parseInt(user_id),
      amount: parseFloat(amount),
      description,
      transaction_date
    }, req.user.id);
    
    res.status(201).json({
      message: 'Withdrawal posted successfully',
      transaction
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all member balances
router.get('/balances', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const balances = SavingsService.getAllMemberBalances();
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total savings pool
router.get('/pool-total', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const total = SavingsService.getTotalSavingsPool();
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions
router.get('/transactions', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const { limit, start_date, end_date } = req.query;
    
    let transactions;
    if (start_date && end_date) {
      transactions = SavingsService.getTransactionsByDateRange(start_date, end_date);
    } else {
      transactions = SavingsService.getAllTransactions(limit ? parseInt(limit) : null);
    }
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly deposits
router.get('/monthly-deposits', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }
    
    const deposits = SavingsService.getMonthlyDeposits(parseInt(year), parseInt(month));
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate loan interest distribution
router.post('/distribute-loan-interest', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const { total_interest, retained_earnings } = req.body;
    
    if (!total_interest || total_interest <= 0) {
      return res.status(400).json({ error: 'Total interest must be positive' });
    }
    
    const retainedAmount = retained_earnings || 0;
    
    const distribution = await SavingsService.distributeLoanInterest({
      total_interest: parseFloat(total_interest),
      retained_earnings: parseFloat(retainedAmount)
    }, req.user.id);
    
    res.json(distribution);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate trust earnings distribution
router.post('/distribute-trust-earnings', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const { total_earnings, retained_earnings } = req.body;
    
    if (!total_earnings || total_earnings <= 0) {
      return res.status(400).json({ error: 'Total earnings must be positive' });
    }
    
    const retainedAmount = retained_earnings || 0;
    
    const distribution = await SavingsService.distributeTrustEarnings({
      total_earnings: parseFloat(total_earnings),
      retained_earnings: parseFloat(retainedAmount)
    }, req.user.id);
    
    res.json(distribution);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Execute interest distribution
router.post('/execute-distribution', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const { distribution_type, total_amount, member_distributions } = req.body;
    
    if (!distribution_type || !total_amount || !member_distributions) {
      return res.status(400).json({ error: 'Distribution type, total amount, and member distributions are required' });
    }
    
    const results = await SavingsService.distributeInterest({
      distribution_type,
      total_amount: parseFloat(total_amount),
      member_distributions
    }, req.user.id);
    
    res.json({
      message: 'Interest distributed successfully',
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get member's financial statement (admin can view any member)
router.get('/statement/:userId', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const statement = SavingsService.getMemberFinancialStatement(userId);
    res.json(statement);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;