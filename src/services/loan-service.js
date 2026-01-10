const LoanRepository = require('../repositories/loan-repository');
const RepaymentScheduleRepository = require('../repositories/repayment-schedule-repository');
const ConfigRepository = require('../repositories/config-repository');
const UserRepository = require('../repositories/user-repository');
const FinancialCalculator = require('../utils/financial-calculator');
const AuditLogger = require('../utils/audit-logger');

class LoanService {
  
  static async applyForLoan(userId, loanData) {
    const { principal, repayment_period, custom_amounts = {} } = loanData;
    
    // Validate user subscription
    const user = UserRepository.findById(userId);
    if (!user.subscription_paid || user.subscription_year !== new Date().getFullYear()) {
      throw new Error('Annual subscription must be paid before applying for loans');
    }

    // Get system configuration
    const interestRate = ConfigRepository.getLoanInterestRate();
    const processingFee = ConfigRepository.getLoanProcessingFee();

    // Validate repayment schedule
    const validation = FinancialCalculator.validateRepaymentSchedule(
      principal, interestRate, processingFee, repayment_period, custom_amounts
    );
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Calculate total amount
    const totalAmount = FinancialCalculator.calculateTotalLoanAmount(
      principal, interestRate, processingFee
    );

    // Create loan application
    const loan = LoanRepository.create({
      user_id: userId,
      principal,
      interest_rate: interestRate,
      processing_fee: processingFee,
      repayment_period,
      total_amount: totalAmount,
      application_date: new Date().toISOString().split('T')[0]
    });

    // Store custom amounts for later use when approved
    if (Object.keys(custom_amounts).length > 0) {
      AuditLogger.log(userId, 'LOAN_CUSTOM_AMOUNTS', 'loans', loan.id, null, custom_amounts);
    }

    AuditLogger.log(userId, 'LOAN_APPLICATION', 'loans', loan.id, null, {
      principal, repayment_period, total_amount: totalAmount
    });

    return loan;
  }

  static async approveLoan(loanId, approvedBy, disbursementDate, customAmounts = {}) {
    const loan = LoanRepository.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== 'pending') {
      throw new Error('Only pending loans can be approved');
    }

    // Approve loan
    LoanRepository.approve(loanId, approvedBy, disbursementDate);

    // Generate repayment schedule
    const schedule = FinancialCalculator.generateRepaymentSchedule(
      loan.principal,
      loan.interest_rate,
      loan.processing_fee,
      loan.repayment_period,
      customAmounts,
      disbursementDate
    );

    // Create repayment schedule
    RepaymentScheduleRepository.createSchedule(loanId, schedule);

    AuditLogger.log(approvedBy, 'LOAN_APPROVED', 'loans', loanId, 
      { status: 'pending' }, 
      { status: 'approved', disbursement_date: disbursementDate }
    );

    return { loan: LoanRepository.findById(loanId), schedule };
  }

  static async rejectLoan(loanId, approvedBy, reason) {
    const loan = LoanRepository.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== 'pending') {
      throw new Error('Only pending loans can be rejected');
    }

    LoanRepository.reject(loanId, approvedBy);

    AuditLogger.log(approvedBy, 'LOAN_REJECTED', 'loans', loanId, 
      { status: 'pending' }, 
      { status: 'rejected', reason }
    );

    return LoanRepository.findById(loanId);
  }

  static async recordRepayment(loanId, repaymentData, postedBy) {
    const { amount, payment_date, schedule_id, transaction_type = 'regular', notes } = repaymentData;
    
    const loan = LoanRepository.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.status !== 'approved' && loan.status !== 'active') {
      throw new Error('Can only record payments for approved/active loans');
    }

    const schedule = RepaymentScheduleRepository.findByLoanId(loanId);
    const scheduleItem = RepaymentScheduleRepository.findById(schedule_id);
    
    if (!scheduleItem) {
      throw new Error('Repayment schedule item not found');
    }

    if (scheduleItem.status === 'paid') {
      throw new Error('This payment has already been recorded');
    }

    // Record payment
    RepaymentScheduleRepository.markPaid(schedule_id, amount, payment_date, postedBy);

    // Update loan balance
    const newBalance = Math.max(0, loan.remaining_balance - amount);
    LoanRepository.updateBalance(loanId, newBalance);

    // Mark loan as completed if fully paid
    if (newBalance === 0) {
      LoanRepository.markCompleted(loanId);
    }

    // Handle overpayment by adjusting future schedule
    if (amount > scheduleItem.scheduled_amount) {
      const updatedSchedule = FinancialCalculator.recalculateScheduleAfterPayment(
        schedule, amount, schedule_id
      );
      
      const updates = updatedSchedule
        .filter(s => s.id !== schedule_id && s.status === 'pending')
        .map(s => ({ id: s.id, scheduled_amount: s.scheduled_amount }));
      
      if (updates.length > 0) {
        RepaymentScheduleRepository.updateMultipleSchedules(updates);
      }
    }

    AuditLogger.log(postedBy, 'LOAN_REPAYMENT', 'repayment_schedules', schedule_id, null, {
      loan_id: loanId,
      amount,
      payment_date,
      transaction_type,
      notes
    });

    return {
      loan: LoanRepository.findById(loanId),
      schedule: RepaymentScheduleRepository.findByLoanId(loanId)
    };
  }

  static async requestEarlyRepayment(loanId, userId) {
    const loan = LoanRepository.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    if (loan.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    if (loan.status !== 'approved' && loan.status !== 'active') {
      throw new Error('Can only request early repayment for active loans');
    }

    const earlyRepaymentRate = ConfigRepository.getEarlyRepaymentRate();
    const earlyRepayment = FinancialCalculator.calculateEarlyRepayment(
      loan.remaining_balance, earlyRepaymentRate
    );

    AuditLogger.log(userId, 'EARLY_REPAYMENT_REQUEST', 'loans', loanId, null, {
      remaining_balance: loan.remaining_balance,
      early_interest: earlyRepayment.earlyInterest,
      total_payment: earlyRepayment.totalPayment
    });

    return {
      loan,
      earlyRepayment
    };
  }

  static getLoanWithSchedule(loanId, userId = null) {
    const loan = LoanRepository.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    // If userId provided, verify ownership (for members)
    if (userId && loan.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    const schedule = RepaymentScheduleRepository.findByLoanId(loanId);
    
    return {
      ...loan,
      schedule
    };
  }

  static getUserLoans(userId) {
    return LoanRepository.findByUserId(userId);
  }

  static getPendingLoans() {
    return LoanRepository.findPendingLoans();
  }

  static getActiveLoans() {
    return LoanRepository.getActiveLoans();
  }

  static getLoanSummary() {
    const totalActive = LoanRepository.getTotalActiveLoans();
    const activeLoans = LoanRepository.getActiveLoans();
    const pendingLoans = LoanRepository.findPendingLoans();

    return {
      total_active_amount: totalActive,
      active_loans_count: activeLoans.length,
      pending_loans_count: pendingLoans.length,
      active_loans: activeLoans,
      pending_loans: pendingLoans
    };
  }
}

module.exports = LoanService;