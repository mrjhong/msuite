import React, { useEffect, useState } from 'react';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo, 
  FiX, 
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Alert = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose, 
  closable = true,
  title = null,
  details = null
}) => {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Tipos de alerta con gradientes y sombras
  const alertTypes = {
    success: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      text: 'text-green-900',
      border: 'border-green-200',
      icon: <FiCheckCircle className="h-6 w-6 text-green-600" />,
      accent: 'bg-green-500',
      button: 'hover:bg-green-100 text-green-700'
    },
    error: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      text: 'text-red-900',
      border: 'border-red-200',
      icon: <FiAlertCircle className="h-6 w-6 text-red-600" />,
      accent: 'bg-red-500',
      button: 'hover:bg-red-100 text-red-700'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-200',
      icon: <FiAlertTriangle className="h-6 w-6 text-amber-600" />,
      accent: 'bg-amber-500',
      button: 'hover:bg-amber-100 text-amber-700'
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      text: 'text-blue-900',
      border: 'border-blue-200',
      icon: <FiInfo className="h-6 w-6 text-blue-600" />,
      accent: 'bg-blue-500',
      button: 'hover:bg-blue-100 text-blue-700'
    }
  };

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  if (!visible) return null;

  const currentType = alertTypes[type] || alertTypes.info;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed top-6 right-6 z-50 w-full max-w-md shadow-xl rounded-lg overflow-hidden ${currentType.bg} border ${currentType.border}`}
        >
          {/* Barra de acento */}
          <div className={`h-1 w-full ${currentType.accent}`}></div>
          
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {currentType.icon}
              </div>
              
              <div className="ml-3 flex-1">
                {title && (
                  <h3 className={`text-lg font-semibold ${currentType.text}`}>
                    {title}
                  </h3>
                )}
                <p className={`mt-1 text-sm ${currentType.text}`}>
                  {message}
                </p>
                
                {details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: expanded ? 'auto' : 0,
                      opacity: expanded ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">{details}</pre>
                    </div>
                  </motion.div>
                )}
              </div>
              
              <div className="ml-4 flex flex-col items-end space-y-2">
                {closable && (
                  <button
                    onClick={handleClose}
                    className={`p-1 rounded-full ${currentType.button} transition-colors`}
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                )}
                
                {details && (
                  <button
                    onClick={toggleExpand}
                    className={`p-1 rounded-full ${currentType.button} transition-colors`}
                  >
                    {expanded ? (
                      <FiChevronUp className="h-5 w-5" />
                    ) : (
                      <FiChevronDown className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Barra de progreso */}
          {duration && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`h-1 ${currentType.accent} opacity-50`}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;