import { createPortal } from 'react-dom';

/** Modales / overlays au-dessus de la navbar (évite le contexte d’empilement .exhibition). */
const ModalPortal = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

export default ModalPortal;
