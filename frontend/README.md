# Crownzcom Investment Club - Frontend

React.js frontend application with Tailwind CSS for the investment club management system.

## Features

- **Authentication**: Login/logout with JWT tokens
- **Dashboard**: Overview of savings and loans
- **Loan Management**: Apply for loans, view repayment schedules
- **Savings Tracking**: View savings balance and transaction history
- **Admin Panel**: Approve loans, view financial summaries (admin only)
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Backend API running on port 3000

### Installation

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

4. **Access application**
- Frontend: http://localhost:3001
- API proxy: http://localhost:3000

### Default Login
- **Username**: admin
- **Password**: admin123

## Project Structure

```
src/
├── components/         # Reusable components
│   └── ProtectedRoute.js
├── contexts/          # React contexts
│   └── AuthContext.js
├── pages/             # Page components
│   ├── Login.js
│   ├── Dashboard.js
│   ├── LoanApplication.js
│   ├── Savings.js
│   ├── Loans.js
│   └── AdminDashboard.js
├── utils/             # Utility functions
├── App.js             # Main app component
├── index.js           # Entry point
└── index.css          # Tailwind CSS imports
```

## Available Routes

- `/login` - User authentication
- `/dashboard` - Main dashboard (default)
- `/apply-loan` - Loan application form
- `/savings` - Savings overview and transactions
- `/loans` - Loan details and repayment schedules
- `/admin` - Admin dashboard (admin only)

## Key Components

### AuthContext
- Manages user authentication state
- Handles login/logout functionality
- Provides user data across components

### ProtectedRoute
- Wraps protected pages
- Redirects to login if not authenticated
- Shows loading state during auth check

### Dashboard
- Overview of user's financial status
- Quick action buttons
- Role-based navigation (admin panel for admins)

### Admin Features
- View pending loan applications
- Approve/reject loans
- Financial summary statistics
- Member management overview

## API Integration

The frontend communicates with the backend API through:
- Axios HTTP client
- JWT token authentication
- Automatic token management
- Error handling and user feedback

## Styling

- **Tailwind CSS 3**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Color Scheme**: Professional blue/green theme
- **Components**: Cards, forms, buttons, navigation

## Development

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.js`
3. Update navigation links
4. Add API integration if needed

### Customizing Styles
- Modify `tailwind.config.js` for theme changes
- Add custom CSS in `src/index.css`
- Use Tailwind utility classes

## Build & Deploy

### Production Build
```bash
npm run build
```

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL (optional, uses proxy by default)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - Crownzcom Investment Club