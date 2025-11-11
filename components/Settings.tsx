import React, { ChangeEvent } from 'react';
import { UploadIcon } from './icons';
import { Language, translations } from '../lib/translations';

interface SettingsProps {
  workMinutes: number;
  setWorkMinutes: (minutes: number) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
  // Renamed prop to reflect the new functionality
  onMusicFileSelected: (file: File | null) => void; 
  musicFileName?: string;
  isDisabled: boolean;
  language: Language;
}

const SettingsInput: React.FC<{label: string, value: number, onChange: (e: ChangeEvent<HTMLInputElement>) => void, disabled: boolean}> = ({ label, value, onChange, disabled }) => (
    <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-slate-400">{label}</label>
        <input
            type="number"
            value={value}
            onChange={onChange}
            disabled={disabled}
            min="1"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />
    </div>
);

export const Settings: React.FC<SettingsProps> = ({
  workMinutes,
  setWorkMinutes,
  breakMinutes,
  setBreakMinutes,
  // Use the new prop name
  onMusicFileSelected, 
  musicFileName,
  isDisabled,
  language,
}) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Pass the selected file to the new handler
      onMusicFileSelected(e.target.files[0]); 
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-700">
      <div className="grid grid-cols-2 gap-4">
        <SettingsInput
            label={translations.settingsWorkLabel[language]}
            value={workMinutes}
            onChange={(e) => setWorkMinutes(Number(e.target.value))}
            disabled={isDisabled}
        />
        <SettingsInput
            label={translations.settingsBreakLabel[language]}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            disabled={isDisabled}
        />
      </div>
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-slate-400">{translations.settingsSoundLabel[language]}</label>
        <label htmlFor="music-upload" className={`flex items-center justify-center w-full px-4 py-2 text-sm text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDisabled ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-cyan-500'}`}>
          <UploadIcon className="w-5 h-5 mr-2" />
          <span>{musicFileName ? musicFileName : translations.settingsFileButton[language]}</span>
        </label>
        <input
          id="music-upload"
          type="file"
          accept=".mp3,audio/*"
          onChange={handleFileChange}
          disabled={isDisabled}
          className="hidden"
        />
      </div>
    </div>
  );
};
