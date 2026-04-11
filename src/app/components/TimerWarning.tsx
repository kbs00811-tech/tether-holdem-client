import { motion } from "motion/react";

interface TimerWarningProps {
  timeLeft: number;
}

export function TimerWarning({ timeLeft }: TimerWarningProps) {
  const show = timeLeft > 0 && timeLeft <= 5;
  
  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-red-500"
        animate={{
          opacity: [0.5, 1, 0.5],
          boxShadow: [
            "0 0 10px rgba(239, 68, 68, 0.5)",
            "0 0 30px rgba(239, 68, 68, 1)",
            "0 0 10px rgba(239, 68, 68, 0.5)",
          ],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Right border */}
      <motion.div
        className="absolute top-0 right-0 bottom-0 w-1 bg-red-500"
        animate={{
          opacity: [0.5, 1, 0.5],
          boxShadow: [
            "0 0 10px rgba(239, 68, 68, 0.5)",
            "0 0 30px rgba(239, 68, 68, 1)",
            "0 0 10px rgba(239, 68, 68, 0.5)",
          ],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1,
        }}
      />

      {/* Bottom border */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"
        animate={{
          opacity: [0.5, 1, 0.5],
          boxShadow: [
            "0 0 10px rgba(239, 68, 68, 0.5)",
            "0 0 30px rgba(239, 68, 68, 1)",
            "0 0 10px rgba(239, 68, 68, 0.5)",
          ],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      {/* Left border */}
      <motion.div
        className="absolute top-0 left-0 bottom-0 w-1 bg-red-500"
        animate={{
          opacity: [0.5, 1, 0.5],
          boxShadow: [
            "0 0 10px rgba(239, 68, 68, 0.5)",
            "0 0 30px rgba(239, 68, 68, 1)",
            "0 0 10px rgba(239, 68, 68, 0.5)",
          ],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
    </motion.div>
  );
}