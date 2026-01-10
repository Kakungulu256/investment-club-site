# Crownzcom Investment Club - Savings & Loan Management System

A comprehensive financial management application for investment clubs with role-based access control, loan management, and savings tracking.

## Features

### Core Functionality
- **User Management**: Admin and Member roles with proper authentication
- **Savings Management**: Monthly savings tracking with unit trust pooling
- **Loan System**: Short-term loans with flexible repayment schedules
- **Interest Calculations**: Configurable rates for loans and early repayments
- **Financial Reporting**: Member statements and administrative summaries
- **Audit Trail**: Complete transaction logging for compliance

### Role-Based Access Control
- **Admin**: Full system access, configuration, loan approvals, transaction posting
- **Member**: View-only access to personal data, loan applications, early repayment requests

### Financial Logic
- Annual subscription fee requirement
- 2% standard loan interest (configurable)
- 3% early repayment interest (configurable)
- Proportional trust earnings distribution
- Equal loan interest distribution among members

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Initialize Database**
```bash
npm run init-db
```

3. **Start Server**
```bash
npm start
# or for development
npm run dev
```

4. **Access Application**
- API: http://localhost:3000
- Web Interface: http://localhost:3000 (serve public/index.html)

### Default Login
- **Username**: admin
- **Password**: admin123

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with username and password
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### POST /api/auth/register (Admin only)
Register new member
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

#### POST /api/auth/pay-subscription
Pay annual subscription fee
```json
{
  "year": 2024
}
```

### Loan Endpoints

#### POST /api/loans/apply
Apply for a loan (Members only)
```json
{
  "principal": 100000,
  "repayment_period": 6,
  "custom_amounts": {
    "1": 30000,
    "2": 25000
  }
}
```

#### GET /api/loans/my-loans
Get user's loans

#### GET /api/loans/:loanId
Get loan details with repayment schedule

#### POST /api/loans/:loanId/approve (Admin only)
Approve loan application
```json
{
  "disbursement_date": "2024-01-15"
}
```

#### POST /api/loans/:loanId/repayment (Admin only)
Record loan repayment
```json
{
  "amount": 25000,
  "payment_date": "2024-02-01",
  "schedule_id": 1,
  "transaction_type": "regular",
  "notes": "Monthly payment"
}
```

### Savings Endpoints

#### GET /api/savings/my-savings
Get member's savings balance and transactions

#### GET /api/savings/my-statement
Get comprehensive financial statement

#### POST /api/savings/post (Admin only)
Post savings for a member
```json
{
  "user_id": 2,
  "amount": 50000,
  "description": "Monthly savings deposit",
  "transaction_date": "2024-01-01"
}
```

#### POST /api/savings/distribute-loan-interest (Admin only)
Calculate loan interest distribution
```json
{
  "total_interest": 10000,
  "retained_earnings": 2000
}
```

### Admin Endpoints

#### GET /api/admin/config
Get system configuration

#### PUT /api/admin/config
Update system configuration
```json
{
  "configs": [
    {
      "key": "loan_interest_rate",
      "value": "0.025"
    }
  ]
}
```

#### POST /api/admin/expenses
Record administrative expense
```json
{
  "category": "admin",
  "amount": 5000,
  "description": "Office supplies",
  "expense_date": "2024-01-01"
}
```

#### GET /api/admin/financial-summary
Get comprehensive financial summary

## Database Schema

### Key Tables
- **users**: User accounts and roles
- **system_config**: Configurable system parameters
- **savings_transactions**: All savings deposits, withdrawals, and interest
- **loans**: Loan applications and status
- **repayment_schedules**: Planned repayment amounts and dates
- **repayment_transactions**: Actual repayment records
- **expenses**: Administrative expenses and fees
- **audit_log**: Complete transaction audit trail

## Configuration

### System Settings (Admin configurable)
- `annual_subscription_fee`: Annual membership fee
- `loan_interest_rate`: Standard loan interest rate (default: 2%)
- `early_repayment_rate`: Early repayment penalty rate (default: 3%)
- `loan_processing_fee`: Fixed loan processing fee

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- SQL injection protection
- Complete audit logging
- CORS and security headers

## Financial Validation

- Subscription fee validation before loan applications
- Repayment schedule mathematical validation
- Balance checks for withdrawals
- Interest calculation verification
- Transaction integrity with database transactions

## Development

### Project Structure
```
src/
├── database/           # Database setup and connection
├── repositories/       # Data access layer
├── services/          # Business logic layer
├── routes/            # API endpoints
├── middleware/        # Authentication and validation
├── utils/             # Financial calculations and utilities
└── server.js          # Main application entry point
```

### Adding New Features
1. Create repository for data access
2. Implement business logic in services
3. Add API routes with proper authentication
4. Update audit logging
5. Add validation and error handling

## Deployment

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key
```

### Production Considerations
- Use environment-specific JWT secrets
- Enable HTTPS
- Configure proper CORS origins
- Set up database backups
- Monitor audit logs
- Implement rate limiting

## Support

For technical support or feature requests, contact the development team.

## License

Proprietary - Crownzcom Investment Club