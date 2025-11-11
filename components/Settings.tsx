import React, { ChangeEvent, useState } from 'react';
import { UploadIcon } from './icons';
import { Language, translations } from '../lib/translations';
import { SoundOption, BUILTIN_SOUNDS, SoundType } from '../lib/soundModels';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

// Constants from App.tsx
const CUSTOM_SOUND_FILE_KEY = 'pomodoro_custom_sound_file_uri';

interface SettingsProps {
  workMinutes: number;
  setWorkMinutes: (minutes: number) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
  selectedSound: SoundOption;
  setSelectedSound: (sound: SoundOption) => void;
  setCustomSoundUri: (uri: string | null) => void;
  setCustomSoundName: (name: string | undefined) => void;
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
  selectedSound,
  setSelectedSound,
  setCustomSoundUri,
  setCustomSoundName,
  isDisabled,
  language,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleSoundChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId === 'custom') {
      // Custom option selected, wait for file input
      return;
    }
    
    const newSound = BUILTIN_SOUNDS.find(s => s.id === selectedId);
    if (newSound) {
      setSelectedSound(newSound);
      // If switching from custom, clear custom state
      if (selectedSound.type === 'custom') {
        setCustomSoundUri(null);
        setCustomSoundName(undefined);
        Preferences.remove({ key: CUSTOM_SOUND_FILE_KEY });
      }
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Read the file as a base64 string
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1]; // Get base64 part
        
        // Save the file to the application's data directory
        const fileName = `custom_sound_${Date.now()}_${file.name}`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Data,
          recursive: true,
        });

        // Store the file URI and name in preferences
        const soundData = { uri: result.uri, name: file.name };
        await Preferences.set({ key: CUSTOM_SOUND_FILE_KEY, value: JSON.stringify(soundData) });

        // Update App state
        setCustomSoundUri(result.uri);
        setCustomSoundName(file.name);
        setSelectedSound({ id: 'custom', type: 'custom', name: file.name, value: result.uri });
        setIsUploading(false);
      };
    } catch (e) {
      console.error('Error saving custom sound file:', e);
      setIsUploading(false);
    }
  };

  const isCustomSelected = selectedSound.type === 'custom';

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
        
        {/* Dropdown for sound selection */}
        <select
          value={selectedSound.id}
          onChange={handleSoundChange}
          disabled={isDisabled || isUploading}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {BUILTIN_SOUNDS.map(sound => (
            <option key={sound.id} value={sound.id}>
              {sound.name}
            </option>
          ))}
          {/* Custom File Option */}
          <option value="custom" disabled={isCustomSelected && !isUploading}>
            {isCustomSelected ? `${translations.settingsCustomFile[language]} (${selectedSound.name})` : translations.settingsCustomFile[language]}
          </option>
        </select>

        {/* Custom File Upload Button (Only visible when 'custom' is selected or for initial upload) */}
        <div className={`transition-all duration-300 overflow-hidden ${isCustomSelected ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <label htmlFor="music-upload" className={`flex items-center justify-center w-full px-4 py-2 text-sm text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDisabled || isUploading ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-cyan-500'}`}>
            <UploadIcon className="w-5 h-5 mr-2" />
            <span>{isUploading ? '上傳中...' : (selectedSound.type === 'custom' ? translations.settingsFileButton[language] : translations.settingsFileButton[language])}</span>
          </label>
          <input
            id="music-upload"
            type="file"
            accept=".mp3,audio/*"
            onChange={handleFileChange}
            disabled={isDisabled || isUploading}
            className="hidden"
            key={selectedSound.id} // Reset file input when sound changes
          />
        </div>
      </div>
    </div>
  );
};
