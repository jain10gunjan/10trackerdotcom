import { memo } from "react";
import { motion, useIsPresent } from "framer-motion";

const FloatingCard = ({ emoji, title, position }) => {
  const isPresent = useIsPresent();
  
  return (
    <motion.div
      className={`absolute ${position} bg-white/10 backdrop-blur-sm rounded-lg p-2 shadow-sm`}
      initial={{ y: 0 }}
      animate={isPresent ? { y: [0, -8, 0] } : { y: 0 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-white text-xs font-medium">{title}</span>
      </div>
    </motion.div>
  );
};

export default memo(FloatingCard);