import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Standard 60fps spring transitions (transform & opacity only)
 */
export const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8
};

export const softSpringTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 1
};

/**
 * Page view transition wrapper
 */
export const PageTransition = ({ children, viewKey, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 10
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.22,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -8,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.15
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`w-full min-w-0 ${className}`}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Staggered container for song lists and card grids
 */
export const StaggerContainer = ({ children, className = '', staggerDelay = 0.04 }) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: 0.02
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Individual item inside a StaggerContainer
 */
export const StaggerItem = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 12
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.25,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div variants={itemVariants} className={className} style={{ willChange: 'transform, opacity' }}>
      {children}
    </motion.div>
  );
};

/**
 * Spring-animated button with tactile press feedback
 */
export const SpringButton = ({
  children,
  onClick,
  className = '',
  scaleHover = 1.04,
  scaleTap = 0.95,
  title,
  type = 'button',
  disabled = false,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      whileHover={shouldReduceMotion || disabled ? {} : { scale: scaleHover }}
      whileTap={shouldReduceMotion || disabled ? {} : { scale: scaleTap }}
      transition={springTransition}
      className={className}
      style={{ willChange: 'transform' }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/**
 * Spring-animated card with hover elevation
 */
export const SpringCard = ({
  children,
  onClick,
  className = '',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.015 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
      transition={springTransition}
      className={className}
      style={{ willChange: 'transform' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Heart button with bounce pop on like
 */
export const AnimatedLikeButton = ({ isLiked, onToggle, size = 18, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={shouldReduceMotion ? {} : { scale: 1.35 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className={`p-1.5 rounded-full transition-colors ${className}`}
      style={{ willChange: 'transform' }}
      title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isLiked ? 'text-purple-400 fill-purple-400' : 'text-slate-400 hover:text-white'}
        animate={isLiked && !shouldReduceMotion ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </motion.svg>
    </motion.button>
  );
};

export default {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  SpringButton,
  SpringCard,
  AnimatedLikeButton,
  springTransition,
  softSpringTransition
};
