import { motion } from 'framer-motion';
import { useWorks } from '../contexts/WorksContext';
import WorkCard from './WorkCard';
import './WorkList.css';

const WorkList = ({ type, onEdit }) => {
  const { works, removeWork } = useWorks();
  const items = works[type] || [];

  if (items.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>Aucune œuvre pour le moment. Ajoutez-en une pour commencer !</p>
      </motion.div>
    );
  }

  return (
    <div className="work-list">
      {items.map((work, index) => (
        <motion.div
          key={work.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <WorkCard
            work={work}
            type={type}
            onEdit={() => onEdit(work)}
            onDelete={() => removeWork(type, work.id)}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default WorkList;
