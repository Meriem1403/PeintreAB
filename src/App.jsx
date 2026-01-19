import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WorksProvider } from './contexts/WorksContext';
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
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WorksProvider>
          <Router>
            <div className="app">
              <Navbar />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/galerie" element={<Galerie />} />
                  <Route path="/galerie/:category/:id" element={<WorkDetail />} />
                  <Route path="/biographie" element={<Biographie />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </ErrorBoundary>
            </div>
          </Router>
        </WorksProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
