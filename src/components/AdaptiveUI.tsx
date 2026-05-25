import React, { useState, useEffect } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

/**
 * AAA Device Detection Hook
 * Tracks screen width and orientation to provide real-time responsive states.
 */
export function useDevice() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const landscapeQuery = window.matchMedia('(orientation: landscape)');

    const update = () => {
      setIsMobile(mobileQuery.matches);
      setIsLandscape(landscapeQuery.matches);
    };

    update();
    mobileQuery.addEventListener('change', update);
    landscapeQuery.addEventListener('change', update);

    return () => {
      mobileQuery.removeEventListener('change', update);
      landscapeQuery.removeEventListener('change', update);
    };
  }, []);

  return { isMobile, isLandscape };
}

/**
 * AAA Glass Panel Component
 * Implements the "Divine OS" material aesthetic with glassmorphism and fine edges.
 */
interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  intensity = 'medium', 
  className = '', 
  ...props 
}) => {
  const blurMap = {
    low: 'backdrop-blur-md',
    medium: 'backdrop-blur-xl',
    high: 'backdrop-blur-2xl'
  };

  return (
    <motion.div
      className={`
        bg-slate-950/45 ${blurMap[intensity]} 
        border border-white/10 rounded-2xl 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] 
        transition-all duration-300 hover:border-white/15
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Adaptive Container
 * Automatically shifts between flex-row and flex-col based on mobile state.
 */
interface AdaptiveContainerProps {
  isMobile: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({ 
  isMobile, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 ${className}`}>
      {children}
    </div>
  );
};
