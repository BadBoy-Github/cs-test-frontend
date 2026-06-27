import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useContext } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthContext } from './context/AuthContext';
import { setNavigateCallback } from './utils/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestTaking from './pages/TestTaking';
import TestResults from './pages/TestResults';
import TestResultDetail from './pages/TestResultDetail';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminTests from './pages/AdminTests';
import AdminStudents from './pages/AdminStudents';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminTestResults from './pages/AdminTestResults';
import AdminAttemptDetail from './pages/AdminAttemptDetail';
import NotFound from './pages/NotFound';

function AppContent() {
  const navigate = useNavigate();
  const { setNavigateCallback } = useContext(AuthContext);

  useEffect(() => {
    // Set navigate callbacks for AuthContext and API
    setNavigateCallback(() => navigate);
    setNavigateCallback(() => navigate);
  }, [navigate, setNavigateCallback]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/test/:testId" element={<TestTaking />} />
            <Route path="/results" element={<TestResults />} />
            <Route path="/results/:testId" element={<TestResultDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin/create-test" element={<AdminDashboard />} />
            <Route path="/admin/tests" element={<AdminTests />} />
            <Route path="/admin/test-results" element={<AdminTestResults />} />
            <Route path="/admin/attempt/:attemptId" element={<AdminAttemptDetail />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;