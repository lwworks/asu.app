import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export const IconLoading = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 165 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-current", className)}
    >
      {/* First row */}
      <motion.rect
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0, 0] }}
        transition={{ duration: 2, delay: 0.1, repeat: Infinity }}
        x="2"
        y="66"
        width="32"
        height="32"
      />
      {/* Second row */}
      <motion.rect
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0, 0] }}
        transition={{ duration: 2, delay: 0.2, repeat: Infinity }}
        x="66"
        y="66"
        width="32"
        height="32"
      />
      <motion.rect
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0, 0] }}
        transition={{ duration: 2, delay: 0.2, repeat: Infinity }}
        x="34"
        y="34"
        width="32"
        height="32"
      />
      {/* Third row */}
      <motion.rect
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0, 0] }}
        transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
        x="130"
        y="66"
        width="32"
        height="32"
      />
      <motion.rect
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0, 0] }}
        transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
        x="98"
        y="34"
        width="32"
        height="32"
      />
      <motion.rect
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0, 0] }}
        transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
        x="66"
        y="2"
        width="32"
        height="32"
      />
      {/* Fourth row */}
      <motion.rect
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0, 0] }}
        transition={{ duration: 2, delay: 0.4, repeat: Infinity }}
        x="130"
        y="2"
        width="32"
        height="32"
      />
      <path d="M100.381 0V32H128.507V0H164.634V36H132.507V64H164.634V100H128.507V68H100.381V100H64.2539V68H36.127V100H0V64H32.127V32H64.2539V0H100.381ZM132.507 96H160.634V68H132.507V96ZM68.2539 96H96.3809V68H68.2539V96ZM4 96H32.127V68H4V96ZM100.381 64H128.507V36H100.381V64ZM68.2539 64H96.3809V36H68.2539V64ZM36.127 64H64.2539V36H36.127V64ZM132.507 32H160.634V4H132.507V32ZM68.2539 32H96.3809V4H68.2539V32Z" />
    </svg>
  );
};
