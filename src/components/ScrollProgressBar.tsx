import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none bg-white/10 backdrop-blur-xs">
      <motion.div
        className="h-full origin-left bg-gradient-to-r from-gray-200 via-white to-gray-100 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
        style={{
          scaleX,
        }}
      />
    </div>
  );
}
