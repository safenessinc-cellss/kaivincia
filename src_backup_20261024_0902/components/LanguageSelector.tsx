import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../i18n/translations';

interface LanguageSelectorProps {
  variant?: 'compact' | 'pills' | 'minimal';
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export default function LanguageSelector({ 
  variant = 'compact', 
  className = '',
  theme = 'auto' 
}: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages, currentLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-black/10 border border-black/10 backdrop-blur-md ${className}`}>
        {availableLanguages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-[#00F0FF] text-black shadow-md scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.code.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const isDark = theme === 'dark' || (theme === 'auto' && true);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
          theme === 'dark'
            ? 'bg-gray-900/80 hover:bg-gray-800 text-gray-200 border-gray-800 hover:border-[#00F0FF]/40'
            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-[#00F0FF]'
        } shadow-sm cursor-pointer`}
        title="Cambiar Idioma / Change Language"
        aria-expanded={isOpen}
      >
        <span className="text-sm">{currentLanguageOption.flag}</span>
        <span className="font-mono">{currentLanguageOption.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-2xl border p-1.5 z-50 backdrop-blur-xl ${
              theme === 'dark'
                ? 'bg-[#0a0a0a]/95 border-gray-800 text-gray-200'
                : 'bg-white/95 border-gray-200 text-gray-800'
            }`}
          >
            <div className="px-3 py-2 border-b border-gray-100/10 mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
              <Globe className="w-3 h-3 text-[#00F0FF]" />
              <span>Seleccionar Idioma</span>
            </div>
            <div className="space-y-0.5">
              {availableLanguages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#00F0FF]/15 text-[#00F0FF]'
                        : 'hover:bg-gray-500/10 text-gray-400 hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <span className="font-medium text-[11px]">{lang.nativeName}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#00F0FF]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
