import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorksProvider } from './contexts/WorksContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Galerie from './pages/Galerie';
import Biographie from './pages/Biographie';
import Contact from './pages/Contact';
import WorkDetail from './pages/WorkDetail';
import Admin from './pages/Admin';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import TicketPage from './pages/TicketPage';
import { adminTabPath, DEFAULT_ADMIN_TAB } from './constants/adminRoutes';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <WorksProvider>
          <Router>
            <div className="app">
              <Navbar />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/galerie/:category/:id" element={<WorkDetail />} />
                  <Route path="/galerie/:category" element={<Galerie />} />
                  <Route path="/galerie" element={<Galerie />} />
                  <Route path="/biographie" element={<Biographie />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/billet/:code" element={<TicketPage />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Navigate to={adminTabPath(DEFAULT_ADMIN_TAB)} replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/:tab"
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </div>
          </Router>
          </WorksProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
