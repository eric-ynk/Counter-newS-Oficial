// components/PageTransition.jsx
// Requer o pacote "motion" (novo nome do framer-motion): npm install motion
import { motion } from 'motion/react';

const variantes = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(6px)' },
};

// easeOutExpo — desacelera bem no final, dá a sensação "fluida" sem
// parecer elástico ou bouncy
const transicao = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variantes}
      initial='initial'
      animate='animate'
      exit='exit'
      transition={transicao}
      style={{ willChange: 'opacity, transform, filter' }}
    >
      {children}
    </motion.div>
  );
}