import React from 'react';
import { PlayIcon, PauseIcon, ResetIcon } from './icons';
import { Language, translations } from '../lib/translations';

interface ControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  language: Language;
}

const ControlButton: React.FC<{onClick: () => void, children: React.ReactNode, className?: string, disabled?: boolean}> = ({ onClick, children, className, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center w-full px-6 py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);


export const Controls: React.FC<ControlsProps> = ({ isActive, isPaused, onStart, onPause, onReset, language }) => {
  return (
    <div className="flex items-center justify-center space-x-4">
        {isPaused ? (
             <ControlButton onClick={onStart} className="bg-cyan-500 text-slate-900 hover:bg-cyan-400 focus:ring-cyan-500">
                <PlayIcon className="w-6 h-6 mr-2" />
                {translations.buttonStart[language]}
             </ControlButton>
        ) : (
            <ControlButton onClick={onPause} className="bg-amber-500 text-slate-900 hover:bg-amber-400 focus:ring-amber-500">
                <PauseIcon className="w-6 h-6 mr-2" />
                {translations.buttonPause[language]}
            </ControlButton>
        )}
      
      <ControlButton onClick={onReset} disabled={isPaused && !isActive} className="bg-slate-600 text-slate-200 hover:bg-slate-500 focus:ring-slate-500">
        <ResetIcon className="w-6 h-6 mr-2" />
        {translations.buttonReset[language]}
      </ControlButton>
    </div>
  );
};
