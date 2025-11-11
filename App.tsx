import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerDisplay } from './components/TimerDisplay';
import { Settings } from './components/Settings';
import { Controls } from './components/Controls';
import { StatusDisplay } from './components/StatusDisplay';
import { translations, Language } from './lib/translations';
import { Preferences } from '@capacitor/preferences';
import { SoundOption, BUILTIN_SOUNDS, DEFAULT_SOUND_ID, SoundType } from './lib/soundModels';
import ForegroundService from './plugins/ForegroundService';
import FloatingWindow from './plugins/FloatingWindow';
import { NativeAudio } from '@capacitor-community/native-audio';

type TimerMode = 'work' | 'break';

const WORK_MINUTES_KEY = 'pomodoro_work_minutes';
const SOUND_OPTION_KEY = 'pomodoro_sound_option';
const BREAK_MINUTES_KEY = 'pomodoro_break_minutes';
const ALARM_SOUND_ID = 'alarmSound'; // Unique ID for our sound
const CUSTOM_SOUND_FILE_KEY = 'pomodoro_custom_sound_file_uri';

function App() {
  const [selectedSound, setSelectedSound] = useState<SoundOption>(BUILTIN_SOUNDS.find(s => s.id === DEFAULT_SOUND_ID)!);
  const [customSoundUri, setCustomSoundUri] = useState<string | null>(null);
  const [customSoundName, setCustomSoundName] = useState<string | undefined>(undefined);
  const [workMinutes, setWorkMinutes] = useState(40);
  const [breakMinutes, setBreakMinutes] = useState(10);
  
  const [mode, setMode] = useState<TimerMode>('work');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');

  const intervalRef = useRef<number | null>(null);

  // --- Sound Handling ---
  const getSoundPath = useCallback((sound: SoundOption) => {
    if (sound.type === 'builtin') {
      // For built-in sounds, we need to remove the leading '/' for assetPath
      return sound.value.substring(1);
    } else if (sound.type === 'custom' && customSoundUri) {
      return customSoundUri;
    }
    return ''; // 'none' or custom not set
  }, [customSoundUri]);

  const preloadSound = useCallback(async (sound: SoundOption) => {
    const path = getSoundPath(sound);
    if (path) {
      try {
        await NativeAudio.preload({
          assetId: ALARM_SOUND_ID,
          assetPath: path,
          audioChannelNum: 1,
          isUrl: sound.type === 'custom', // Custom sound is a file URI, which is treated as a URL
        });
      } catch (err) {
        console.error('Error preloading sound:', err);
      }
    }
  }, [getSoundPath]);

  const unloadSound = useCallback(async () => {
    try {
      await NativeAudio.unload({ assetId: ALARM_SOUND_ID });
    } catch (err) {
      // Ignore error if sound was not loaded
    }
  }, []);

  // Preload/Unload effect
  useEffect(() => {
    unloadSound().then(() => {
      if (selectedSound.type !== 'none') {
        preloadSound(selectedSound);
      }
    });

    return () => {
      unloadSound();
    };
  }, [selectedSound, preloadSound, unloadSound]);


  // --- Settings Persistence ---
  useEffect(() => {
    const loadSettings = async () => {
      // Load Minutes
      const workMins = await Preferences.get({ key: WORK_MINUTES_KEY });
      if (workMins.value) setWorkMinutes(Number(workMins.value));

      const breakMins = await Preferences.get({ key: BREAK_MINUTES_KEY });
      if (breakMins.value) setBreakMinutes(Number(breakMins.value));

      // Load Sound Option
      const soundOptionResult = await Preferences.get({ key: SOUND_OPTION_KEY });
      if (soundOptionResult.value) {
        const savedSoundId = soundOptionResult.value;
        const foundSound = BUILTIN_SOUNDS.find(s => s.id === savedSoundId);
        if (foundSound) {
          setSelectedSound(foundSound);
        } else if (savedSoundId === 'custom') {
          // Load custom sound details
          const customSoundResult = await Preferences.get({ key: CUSTOM_SOUND_FILE_KEY });
          if (customSoundResult.value) {
            const { uri, name } = JSON.parse(customSoundResult.value);
            setCustomSoundUri(uri);
            setCustomSoundName(name);
            setSelectedSound({ id: 'custom', type: 'custom', name: name, value: uri });
          } else {
            // Custom sound selected but file lost, fallback to default
            setSelectedSound(BUILTIN_SOUNDS.find(s => s.id === DEFAULT_SOUND_ID)!);
          }
        }
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    Preferences.set({ key: WORK_MINUTES_KEY, value: String(workMinutes) });
  }, [workMinutes]);

  useEffect(() => {
    Preferences.set({ key: BREAK_MINUTES_KEY, value: String(breakMinutes) });
  }, [breakMinutes]);

  // Save selected sound option
  useEffect(() => {
    Preferences.set({ key: SOUND_OPTION_KEY, value: selectedSound.id });
  }, [selectedSound]);

  // --- Timer Logic ---
  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setIsPaused(true);
    setMode('work');
    setSecondsLeft(workMinutes * 60);
  }, [workMinutes]);

  useEffect(() => {
    if (!isActive) {
      setSecondsLeft(workMinutes * 60);
    }
  }, [workMinutes]);

  const playSound = useCallback(() => {
    if (selectedSound.type !== 'none') {
      // Play the preloaded sound by its ID
      NativeAudio.play({ assetId: ALARM_SOUND_ID })
        .catch(error => console.error("Audio playback failed:", error));
    }
  }, [selectedSound]);
  
  const switchMode = useCallback(() => {
    const nextMode = mode === 'work' ? 'break' : 'work';
    const nextSeconds = (nextMode === 'work' ? workMinutes : breakMinutes) * 60;
    
    setMode(nextMode);
    setSecondsLeft(nextSeconds);
    playSound(); // Play sound when modes switch
  }, [mode, workMinutes, breakMinutes, playSound]);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          // Update foreground service and floating window
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
            ForegroundService.stop();
            switchMode();
            return 0;
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
  }, [isActive, isPaused, switchMode, isFloating, language, mode]);
  
  const handleStart = () => {
    const currentText = mode === 'work' ? translations.statusWorking[language] : translations.statusBreaking[language];
    ForegroundService.start({
      title: translations.title[language],
      text: currentText,
      secondsLeft: secondsLeft,
    });
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    ForegroundService.stop();
    setIsActive(false);
    setIsPaused(true);
  }

  const handleReset = () => {
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
          selectedSound={selectedSound}
          setSelectedSound={setSelectedSound}
          setCustomSoundUri={setCustomSoundUri}
          setCustomSoundName={setCustomSoundName}
          isDisabled={isActive}
          language={language}
        />


      </div>
    </div>
  );
}

export default App;
