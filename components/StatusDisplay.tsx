import React from 'react';
import { Language, translations } from '../lib/translations';

interface StatusDisplayProps {
  mode: 'work' | 'break';
  isActive: boolean;
  language: Language;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ mode, isActive, language }) => {
  const getStatusText = () => {
    if (!isActive) return translations.statusIdle[language];
    return mode === 'work' ? translations.statusWork[language] : translations.statusBreak[language];
  };

  const statusColor = !isActive ? 'text-slate-400' : mode === 'work' ? 'text-green-400' : 'text-blue-400';

  return (
    <div className="text-center">
      <p className={`text-xl font-semibold tracking-wider transition-colors duration-300 ${statusColor}`}>
        {getStatusText()}
      </p>
    </div>
  );
};
