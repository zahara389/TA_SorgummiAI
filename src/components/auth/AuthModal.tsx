import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  description: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, type, title, description }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[340px] bg-white rounded-[24px] p-8 flex flex-col items-center text-center shadow-2xl"
          >
            {/* Circular Icon */}
            <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mb-6 ${
              type === 'success' ? 'border-[#10b981] text-[#10b981]' : 'border-[#f87171] text-[#f87171]'
            }`}>
              {type === 'success' ? (
                <Check className="w-10 h-10 stroke-[2.5px]" />
              ) : (
                <X className="w-10 h-10 stroke-[2.5px]" />
              )}
            </div>

            {/* Content */}
            <h3 className="text-[22px] font-semibold text-[#404040] mb-3">
              {title}
            </h3>
            <p className="text-[15px] text-[#737373] leading-relaxed mb-8">
              {description}
            </p>

            {/* OK Button */}
            <button
              onClick={onClose}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold text-sm tracking-wide transition-colors active:scale-[0.98]"
            >
              OK
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
