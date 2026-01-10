const express = require('express');
const LoanService = require('../services/loan-service');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply for loan (members only)
router.post('/apply', AuthMiddleware.authenticate, AuthMiddleware.requireSubscription, async (req, res) => {
  try {
    const { principal, repayment_period, custom_amounts } = req.body;
    
    if (!principal || !repayment_period) {
      return res.status(400).json({ error: 'Principal and repayment period are required' });
    }
    
    if (principal <= 0 || repayment_period <= 0) {
      return res.status(400).json({ error: 'Principal and repayment period must be positive' });
    }
    
    const loan = await LoanService.applyForLoan(req.user.id, {
      principal: parseFloat(principal),
      repayment_period: parseInt(repayment_period),
      custom_amounts: custom_amounts || {}
    });
    
    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's loans
router.get('/my-loans', AuthMiddleware.authenticate, (req, res) => {
  try {
    const loans = LoanService.getUserLoans(req.user.id);
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get loan details
router.get('/:loanId', AuthMiddleware.authenticate, (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId);
    const userId = req.user.role === 'admin' ? null : req.user.id;
    
    const loanDetails = LoanService.getLoanWithSchedule(loanId, userId);
    res.json(loanDetails);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Request early repayment
router.post('/:loanId/early-repayment', AuthMiddleware.authenticate, async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId);
    const calculation = await LoanService.requestEarlyRepayment(loanId, req.user.id);
    
    res.json({
      message: 'Early repayment request calculated',
      calculation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin routes
// Get pending loans
router.get('/admin/pending', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const loans = LoanService.getPendingLoans();
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active loans
router.get('/admin/active', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const loans = LoanService.getActiveLoans();
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all loans
router.get('/admin/all', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, (req, res) => {
  try {
    const summary = LoanService.getLoanSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve loan
router.post('/:loanId/approve', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId);
    const { disbursement_date } = req.body;
    
    if (!disbursement_date) {
      return res.status(400).json({ error: 'Disbursement date is required' });
    }
    
    const loan = await LoanService.approveLoan(loanId, req.user.id, disbursement_date);
    
    res.json({
      message: 'Loan approved successfully',
      loan
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject loan
router.post('/:loanId/reject', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId);
    const { reason } = req.body;
    
    const loan = await LoanService.rejectLoan(loanId, req.user.id, reason);
    
    res.json({
      message: 'Loan rejected successfully',
      loan
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Record repayment
router.post('/:loanId/repayment', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId);
    const { amount, payment_date, schedule_id, transaction_type, notes } = req.body;
    
    if (!amount || !payment_date) {
      return res.status(400).json({ error: 'Amount and payment date are required' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const result = await LoanService.recordRepayment(loanId, {
      amount: parseFloat(amount),
      payment_date,
      schedule_id: schedule_id ? parseInt(schedule_id) : null,
      transaction_type: transaction_type || 'regular',
      notes
    }, req.user.id);
    
    res.json({
      message: 'Repayment recorded successfully',
      result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;