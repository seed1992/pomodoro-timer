import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerDisplay } from './components/TimerDisplay';
import { Settings } from './components/Settings';
import { Controls } from './components/Controls';
import { StatusDisplay } from './components/StatusDisplay';
import { translations, Language } from './lib/translations';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import ForegroundService from './plugins/ForegroundService';
import FloatingWindow from './plugins/FloatingWindow';

type TimerMode = 'work' | 'break';

const SOUND_FILE_KEY = 'pomodoro_sound_file_uri';
const WORK_MINUTES_KEY = 'pomodoro_work_minutes';
const BREAK_MINUTES_KEY = 'pomodoro_break_minutes';

function App() {
  const [workMinutes, setWorkMinutes] = useState(40);
  const [breakMinutes, setBreakMinutes] = useState(10);
  // musicFile is no longer needed as we handle the file directly via Capacitor
  // const [musicFile, setMusicFile] = useState<File | null>(null); 
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicFileName, setMusicFileName] = useState<string | undefined>(undefined);

  const [mode, setMode] = useState<TimerMode>('work');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  // --- Persistence Handlers ---

  // 1. Load settings on startup
  useEffect(() => {
    const loadSettings = async () => {
      // Load Minutes
      const workMins = await Preferences.get({ key: WORK_MINUTES_KEY });
      if (workMins.value) setWorkMinutes(Number(workMins.value));

      const breakMins = await Preferences.get({ key: BREAK_MINUTES_KEY });
      if (breakMins.value) setBreakMinutes(Number(breakMins.value));

      // Load Sound File URI
      const soundUriResult = await Preferences.get({ key: SOUND_FILE_KEY });
      if (soundUriResult.value) {
        try {
          const { uri, name } = JSON.parse(soundUriResult.value);
          setMusicFileName(name);
          setMusicUrl(uri);
        } catch (e) {
          console.error('Error parsing sound URI from preferences:', e);
        }
      }
    };
    loadSettings();
  }, []);

  // 2. Save minutes whenever they change
  useEffect(() => {
    Preferences.set({ key: WORK_MINUTES_KEY, value: String(workMinutes) });
  }, [workMinutes]);

  useEffect(() => {
    Preferences.set({ key: BREAK_MINUTES_KEY, value: String(breakMinutes) });
  }, [breakMinutes]);

  // 3. Handle file selection and persistence
  const handleMusicFileSelection = useCallback(async (file: File | null) => {
    if (!file) {
      // Clear sound
      setMusicUrl(null);
      setMusicFileName(undefined);
      await Preferences.remove({ key: SOUND_FILE_KEY });
      return;
    }

    try {
      // Read the file as a base64 string
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1]; // Get base64 part
        
        // Save the file to the application's data directory
        const fileName = `sound_${Date.now()}_${file.name}`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Data,
          recursive: true,
        });

        // Store the file URI and name in preferences
        const soundData = { uri: result.uri, name: file.name };
        await Preferences.set({ key: SOUND_FILE_KEY, value: JSON.stringify(soundData) });

        setMusicFileName(file.name);
        setMusicUrl(result.uri);
      };
    } catch (e) {
      console.error('Error saving sound file:', e);
    }
  }, []);

  // --- Timer Logic ---

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setIsPaused(true);
    setMode('work');
    setSecondsLeft(workMinutes * 60);
  }, [workMinutes]);

  useEffect(() => {
    // This effect now ONLY runs when workMinutes changes, and the timer is not active.
    if (!isActive) {
      setSecondsLeft(workMinutes * 60);
    }
  }, [workMinutes]); // We remove `isActive` from the dependency array

  // Removed the old musicFile useEffect as it's replaced by handleMusicFileSelection

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => console.error("Audio playback failed:", error));
    }
  }, []);
  
  const switchMode = useCallback(() => {
    const nextMode = mode === 'work' ? 'break' : 'work';
    const nextSeconds = (nextMode === 'work' ? workMinutes : breakMinutes) * 60;
    
    setMode(nextMode);
    setSecondsLeft(nextSeconds);
    playSound();
  }, [mode, workMinutes, breakMinutes, playSound]);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          // 更新前景服務
          const currentText = mode === 'work' ? translations.statusWorking[language] : translations.statusBreaking[language];
          if (isFloating) {
            const timeString = `${String(Math.floor((prev - 1) / 60)).padStart(2, '0')}:${String((prev - 1) % 60).padStart(2, '0')}`;
            FloatingWindow.update({ text: timeString });
          }
          ForegroundService.update({
            title: translations.title[language],
            text: currentText,
            secondsLeft: prev - 1,
          });
          if (prev <= 1) {
            // 停止前景服務，因為模式切換後，計時器會自動重新啟動
            ForegroundService.stop();
            switchMode();
            return 0; // The switchMode will set the new time
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, switchMode]);
  
  const handleStart = () => {
    // 啟動前景服務
    const currentText = mode === 'work' ? translations.statusWorking[language] : translations.statusBreaking[language];
    ForegroundService.start({
      title: translations.title[language],
      text: currentText,
      secondsLeft: secondsLeft,
    });
    // To resume, we just need to set isActive to true and isPaused to false.
    // The main timer useEffect will handle the rest.
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    // 停止前景服務
    ForegroundService.stop();
      // This will stop the timer via the main useEffect.
      setIsActive(false);
      // We keep track that it's paused, not reset.
      setIsPaused(true);
  }

  const handleReset = () => {
    // 停止前景服務
    ForegroundService.stop();
    resetTimer();
  };

    const toggleFloatingWindow = async () => {
    if (isFloating) {
      await FloatingWindow.hide();
      setIsFloating(false);
    } else {
      const hasPermission = await FloatingWindow.checkPermission();
      if (!hasPermission.hasPermission) {
        const permissionResult = await FloatingWindow.requestPermission();
        if (!permissionResult.granted) {
          console.error('Floating window permission not granted');
          return;
        }
      }
      const timeString = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
      await FloatingWindow.show({ initialText: timeString });
      setIsFloating(true);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'zh' ? 'en' : 'zh'));
  };

  const totalSeconds = (mode === 'work' ? workMinutes : breakMinutes) * 60;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md mx-auto bg-slate-800/50 rounded-2xl shadow-2xl p-6 md:p-8 space-y-8 backdrop-blur-sm border border-slate-700">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-wider">
            {translations.title[language]}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={toggleFloatingWindow}
              className="px-3 py-1 text-sm font-semibold text-cyan-400 bg-slate-700/50 rounded-full hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {isFloating ? 'Hide Float' : 'Show Float'}
            </button>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-sm font-semibold text-cyan-400 bg-slate-700/50 rounded-full hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {language === 'zh' ? 'EN' : '中文'}
            </button>
          </div>
        </div>
        
        <StatusDisplay mode={mode} isActive={isActive} language={language} />

        <TimerDisplay secondsLeft={secondsLeft} totalSeconds={totalSeconds} />

        <Controls 
          isActive={isActive}
          isPaused={isPaused}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          language={language}
        />

        <Settings 
          workMinutes={workMinutes}
          setWorkMinutes={setWorkMinutes}
          breakMinutes={breakMinutes}
          setBreakMinutes={setBreakMinutes}
          // Pass the new handler instead of the old setMusicFile
          onMusicFileSelected={handleMusicFileSelection} 
          musicFileName={musicFileName}
          isDisabled={isActive}
          language={language}
        />

        {/* Use musicUrl which is now a persisted file URI */}
        {musicUrl && <audio ref={audioRef} src={musicUrl} />}
      </div>
    </div>
  );
}

export default App;
