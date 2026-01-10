const SavingsRepository = require('../repositories/savings-repository');
const UserRepository = require('../repositories/user-repository');
const ConfigRepository = require('../repositories/config-repository');
const FinancialCalculator = require('../utils/financial-calculator');
const AuditLogger = require('../utils/audit-logger');

class SavingsService {
  
  static async postSavings(savingsData, postedBy) {
    const { user_id, amount, description, transaction_date } = savingsData;
    
    // Validate user exists and is a member
    const user = UserRepository.findById(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'member') {
      throw new Error('Savings can only be posted for members');
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Savings amount must be positive');
    }

    // Create savings transaction
    const transaction = SavingsRepository.createTransaction({
      user_id,
      amount,
      transaction_type: 'deposit',
      description: description || 'Monthly savings deposit',
      posted_by: postedBy,
      transaction_date: transaction_date || new Date().toISOString().split('T')[0]
    });

    AuditLogger.log(postedBy, 'SAVINGS_POSTED', 'savings_transactions', transaction.id, null, {
      user_id,
      amount,
      description
    });

    return transaction;
  }

  static async withdrawSavings(withdrawalData, postedBy) {
    const { user_id, amount, description, transaction_date } = withdrawalData;
    
    // Check current balance
    const currentBalance = SavingsRepository.getUserBalance(user_id);
    if (currentBalance < amount) {
      throw new Error('Insufficient savings balance');
    }

    // Create withdrawal transaction (negative amount)
    const transaction = SavingsRepository.createTransaction({
      user_id,
      amount: -Math.abs(amount),
      transaction_type: 'withdrawal',
      description: description || 'Savings withdrawal',
      posted_by: postedBy,
      transaction_date: transaction_date || new Date().toISOString().split('T')[0]
    });

    AuditLogger.log(postedBy, 'SAVINGS_WITHDRAWAL', 'savings_transactions', transaction.id, null, {
      user_id,
      amount: -Math.abs(amount),
      description
    });

    return transaction;
  }

  static getUserSavings(userId) {
    const balance = SavingsRepository.getUserBalance(userId);
    const transactions = SavingsRepository.findByUserId(userId);
    
    return {
      balance,
      transactions
    };
  }

  static getUserStatement(userId, startDate, endDate) {
    const user = UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const statement = SavingsRepository.getMemberStatement(userId, startDate, endDate);
    const currentBalance = SavingsRepository.getUserBalance(userId);

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username
      },
      current_balance: currentBalance,
      statement_period: { start_date: startDate, end_date: endDate },
      transactions: statement
    };
  }

  static getAllMemberBalances() {
    return SavingsRepository.getAllBalances();
  }

  static async distributeLoanInterest(distributionData, postedBy) {
    const { total_interest, retained_earnings = 0 } = distributionData;
    
    if (total_interest <= 0) {
      throw new Error('Total interest must be positive');
    }

    // Calculate distributable amount after retained earnings
    const distributableAmount = total_interest - retained_earnings;
    if (distributableAmount <= 0) {
      throw new Error('No amount available for distribution after retained earnings');
    }

    // Get all subscribed members for equal distribution
    const currentYear = new Date().getFullYear();
    const subscribedMembers = UserRepository.getSubscribedMembers(currentYear);
    
    if (subscribedMembers.length === 0) {
      throw new Error('No subscribed members found for interest distribution');
    }

    // Calculate equal distribution
    const interestPerMember = FinancialCalculator.calculateEqualDistribution(
      distributableAmount, subscribedMembers.length
    );

    // Create interest transactions for each member
    const distributions = subscribedMembers.map(member => ({
      user_id: member.id,
      amount: interestPerMember,
      description: `Loan interest distribution - ${new Date().toISOString().split('T')[0]}`,
      posted_by: postedBy,
      transaction_date: new Date().toISOString().split('T')[0]
    }));

    SavingsRepository.distributeInterest(distributions);

    AuditLogger.log(postedBy, 'LOAN_INTEREST_DISTRIBUTED', 'savings_transactions', null, null, {
      total_interest,
      retained_earnings,
      distributed_amount: distributableAmount,
      members_count: subscribedMembers.length,
      amount_per_member: interestPerMember
    });

    return {
      total_interest,
      retained_earnings,
      distributed_amount: distributableAmount,
      members_count: subscribedMembers.length,
      amount_per_member: interestPerMember
    };
  }

  static async distributeTrustEarnings(distributionData, postedBy) {
    const { total_earnings, retained_earnings = 0 } = distributionData;
    
    if (total_earnings <= 0) {
      throw new Error('Total earnings must be positive');
    }

    // Calculate distributable amount
    const distributableAmount = total_earnings - retained_earnings;
    if (distributableAmount <= 0) {
      throw new Error('No amount available for distribution after retained earnings');
    }

    // Get member balances for proportional distribution
    const memberBalances = SavingsRepository.getAllBalances();
    const totalSavings = SavingsRepository.getTotalSavings();
    
    if (totalSavings <= 0) {
      throw new Error('No savings found for proportional distribution');
    }

    // Calculate proportional distributions
    const distributions = memberBalances
      .filter(member => member.balance > 0)
      .map(member => {
        const proportionalAmount = FinancialCalculator.calculateProportionalDistribution(
          distributableAmount, member.balance, totalSavings
        );
        
        return {
          user_id: member.id,
          amount: Math.round(proportionalAmount * 100) / 100, // Round to 2 decimal places
          description: `Trust earnings distribution - ${new Date().toISOString().split('T')[0]}`,
          posted_by: postedBy,
          transaction_date: new Date().toISOString().split('T')[0]
        };
      });

    if (distributions.length === 0) {
      throw new Error('No members with savings balance found for distribution');
    }

    SavingsRepository.distributeInterest(distributions);

    AuditLogger.log(postedBy, 'TRUST_EARNINGS_DISTRIBUTED', 'savings_transactions', null, null, {
      total_earnings,
      retained_earnings,
      distributed_amount: distributableAmount,
      total_savings: totalSavings,
      distributions: distributions.length
    });

    return {
      total_earnings,
      retained_earnings,
      distributed_amount: distributableAmount,
      total_savings: totalSavings,
      distributions
    };
  }

  static getSavingsSummary() {
    const totalSavings = SavingsRepository.getTotalSavings();
    const memberBalances = SavingsRepository.getAllBalances();
    const membersWithSavings = memberBalances.filter(m => m.balance > 0).length;

    return {
      total_savings: totalSavings,
      total_members: memberBalances.length,
      members_with_savings: membersWithSavings,
      member_balances: memberBalances
    };
  }

  static getMonthlyReport(year, month) {
    const monthlyDeposits = SavingsRepository.getMonthlyDeposits(year, month);
    const totalMonthlyDeposits = monthlyDeposits.reduce((sum, deposit) => sum + deposit.monthly_deposit, 0);

    return {
      year,
      month,
      total_deposits: totalMonthlyDeposits,
      member_deposits: monthlyDeposits
    };
  }
}

module.exports = SavingsService;