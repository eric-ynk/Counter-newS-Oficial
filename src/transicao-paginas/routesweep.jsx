// components/RouteSweep.jsx
// Reforça a transição com uma varredura verde no topo — a mesma cor de
// "presença/vivo" que o site já usa no chat e nos badges de status.
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router';
import './routesweep.css';

export default function RouteSweep() {
  const location = useLocation();

  return (
    <AnimatePresence>
      <motion.div
        key={location.pathname}
        className='route-sweep'
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
        transition={{ duration: 0.6, times: [0, 0.5, 1], ease: 'easeInOut' }}
      />
    </AnimatePresence>
  );
}