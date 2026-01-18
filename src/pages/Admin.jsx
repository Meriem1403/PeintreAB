import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useWorks } from '../contexts/WorksContext';
import WorkForm from '../components/WorkForm';
import WorkList from '../components/WorkList';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('peintures');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const { works, loading } = useWorks();

  // Scroll en haut lors de l'ouverture de la page admin
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const tabs = [
    { id: 'peintures', label: 'Peintures' },
    { id: 'croquis', label: 'Croquis' },
    { id: 'evenements', label: 'Événements' }
  ];

  const handleAdd = () => {
    setEditingWork(null);
    setIsFormOpen(true);
  };

  const handleEdit = (work) => {
    setEditingWork(work);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWork(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin" key={location.pathname}>
      <motion.div
        className="admin-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        key={`header-${location.pathname}`}
      >
        <div className="admin-header-content">
          <div>
            <h1>Espace Administration</h1>
            <p>Gérez vos œuvres et événements</p>
          </div>
          <motion.button
            className="btn-logout"
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiLogOut />
            Déconnexion
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="admin-tabs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        key={`tabs-${location.pathname}`}
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.label} ({works[tab.id]?.length || 0})
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        className="admin-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        key={`content-${location.pathname}`}
      >
        <div className="admin-actions">
          <motion.button
            className="btn-add"
            onClick={handleAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + Ajouter une œuvre
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${loading ? 'loading' : 'loaded'}-${location.pathname}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <WorkList type={activeTab} onEdit={handleEdit} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isFormOpen && (
          <WorkForm
            key={`form-${editingWork?.id || 'new'}`}
            type={activeTab}
            work={editingWork}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
