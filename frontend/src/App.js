import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Login from './pages/Login';
import Dashboard from './pages/DashboardRouter';
import Loans from './pages/Loans';
import Savings from './pages/Savings';
import LoanApplication from './pages/LoanApplication';
import EarlyRepayment from './pages/EarlyRepayment';
import AdminDashboard from './pages/AdminDashboard';
import AdminConfig from './pages/AdminConfig';
import PostSavings from './pages/PostSavings';
import RecordRepayment from './pages/RecordRepayment';
import DistributeInterest from './pages/DistributeInterest';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/apply-loan" element={<LoanApplication />} />
            <Route path="/early-repayment/:loanId" element={<EarlyRepayment />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/config" element={<AdminConfig />} />
            <Route path="/admin/post-savings" element={<PostSavings />} />
            <Route path="/admin/record-repayment" element={<RecordRepayment />} />
            <Route path="/admin/distribute-interest" element={<DistributeInterest />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;