import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isDarkMode?: boolean;
  size?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, isDarkMode = true, size = 'max-w-2xl' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-48%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-48%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ 
              position: 'fixed',
              left: '50%', 
              top: '50%',
              zIndex: 510
            }}
            className={`w-full ${size} max-h-[80vh] border rounded-[28px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden transition-colors duration-300 ${
              isDarkMode ? 'bg-[#111814] border-white/10' : 'bg-white border-gray-100'
            }`}
          >
            <div className={`shrink-0 flex items-center justify-between px-5 py-4 md:px-8 md:py-6 border-b transition-colors ${
              isDarkMode ? 'border-white/5' : 'border-gray-100'
            }`}>
              <h3 className={`text-base md:text-xl font-serif font-bold transition-colors truncate pr-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                  isDarkMode ? 'hover:bg-white/5 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className={`p-5 md:p-8 overflow-y-auto flex-1 no-scrollbar scroll-smooth ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
