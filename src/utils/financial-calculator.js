class FinancialCalculator {
  
  static calculateLoanInterest(principal, interestRate) {
    return principal * interestRate;
  }

  static calculateEarlyRepaymentInterest(principal, earlyRate) {
    return principal * earlyRate;
  }

  static calculateTotalLoanAmount(principal, interestRate, processingFee) {
    const interest = this.calculateLoanInterest(principal, interestRate);
    return principal + interest + processingFee;
  }

  static generateRepaymentSchedule(principal, interestRate, processingFee, repaymentPeriod, customAmounts = {}, disbursementDate) {
    const totalAmount = this.calculateTotalLoanAmount(principal, interestRate, processingFee);
    const schedule = [];
    let remainingBalance = totalAmount;
    
    // Calculate custom amounts first
    const customMonths = Object.keys(customAmounts).map(Number).sort((a, b) => a - b);
    const customTotal = Object.values(customAmounts).reduce((sum, amount) => sum + amount, 0);
    
    // Validate custom amounts don't exceed total
    if (customTotal > totalAmount) {
      throw new Error('Custom repayment amounts exceed total loan amount');
    }

    // Generate schedule
    for (let month = 1; month <= repaymentPeriod; month++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setMonth(dueDate.getMonth() + month);
      
      let scheduledAmount;
      
      if (customAmounts[month]) {
        scheduledAmount = customAmounts[month];
      } else if (month === repaymentPeriod) {
        // Last month gets remaining balance
        scheduledAmount = remainingBalance;
      } else {
        // Calculate equal distribution for non-custom months
        const remainingMonths = repaymentPeriod - customMonths.filter(m => m < month).length;
        const remainingAmount = totalAmount - customTotal;
        scheduledAmount = Math.round(remainingAmount / remainingMonths);
      }

      schedule.push({
        month_number: month,
        due_date: dueDate.toISOString().split('T')[0],
        scheduled_amount: scheduledAmount,
        status: 'pending'
      });

      remainingBalance -= scheduledAmount;
    }

    // Validate schedule
    const totalScheduled = schedule.reduce((sum, payment) => sum + payment.scheduled_amount, 0);
    if (Math.abs(totalScheduled - totalAmount) > 1) {
      throw new Error('Repayment schedule does not match total loan amount');
    }

    return schedule;
  }

  static validateRepaymentSchedule(principal, interestRate, processingFee, repaymentPeriod, customAmounts) {
    const totalAmount = this.calculateTotalLoanAmount(principal, interestRate, processingFee);
    const customTotal = Object.values(customAmounts || {}).reduce((sum, amount) => sum + amount, 0);
    
    // Check if custom amounts exceed total
    if (customTotal > totalAmount) {
      return { valid: false, error: 'Custom repayment amounts exceed total loan amount' };
    }

    // Check if any single payment exceeds total
    for (const amount of Object.values(customAmounts || {})) {
      if (amount > totalAmount) {
        return { valid: false, error: 'Individual repayment amount exceeds total loan amount' };
      }
    }

    // Check if custom months are within repayment period
    for (const month of Object.keys(customAmounts || {})) {
      if (month < 1 || month > repaymentPeriod) {
        return { valid: false, error: 'Custom repayment month is outside repayment period' };
      }
    }

    return { valid: true };
  }

  static calculateProportionalDistribution(totalAmount, memberSavings, totalSavings) {
    if (totalSavings === 0) return 0;
    return (memberSavings / totalSavings) * totalAmount;
  }

  static calculateEqualDistribution(totalAmount, memberCount) {
    if (memberCount === 0) return 0;
    return totalAmount / memberCount;
  }

  static calculateEarlyRepayment(remainingBalance, earlyRepaymentRate) {
    const earlyInterest = this.calculateEarlyRepaymentInterest(remainingBalance, earlyRepaymentRate);
    return {
      earlyInterest,
      totalPayment: remainingBalance + earlyInterest
    };
  }

  static recalculateScheduleAfterPayment(schedule, paymentAmount, scheduleId) {
    const updatedSchedule = [...schedule];
    const paymentIndex = updatedSchedule.findIndex(s => s.id === scheduleId);
    
    if (paymentIndex === -1) {
      throw new Error('Schedule item not found');
    }

    // Mark payment as paid
    updatedSchedule[paymentIndex].actual_amount = paymentAmount;
    updatedSchedule[paymentIndex].status = 'paid';

    // If overpayment, adjust future payments
    const overpayment = paymentAmount - updatedSchedule[paymentIndex].scheduled_amount;
    if (overpayment > 0) {
      let remainingOverpayment = overpayment;
      
      for (let i = paymentIndex + 1; i < updatedSchedule.length && remainingOverpayment > 0; i++) {
        if (updatedSchedule[i].status === 'pending') {
          const reduction = Math.min(remainingOverpayment, updatedSchedule[i].scheduled_amount);
          updatedSchedule[i].scheduled_amount -= reduction;
          remainingOverpayment -= reduction;
        }
      }
    }

    return updatedSchedule;
  }
}

module.exports = FinancialCalculator;