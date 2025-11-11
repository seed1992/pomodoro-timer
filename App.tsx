import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerDisplay } from './components/TimerDisplay';
import { Settings } from './components/Settings';
import { Controls } from './components/Controls';
import { StatusDisplay } from './components/StatusDisplay';
import { translations, Language } from './lib/translations';

type TimerMode = 'work' | 'break';

function App() {
  const [workMinutes, setWorkMinutes] = useState(40);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);

  const [mode, setMode] = useState<TimerMode>('work');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [language, setLanguage] = useState<Language>('zh');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (musicFile) {
      const url = URL.createObjectURL(musicFile);
      setMusicUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [musicFile]);

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
          if (prev <= 1) {
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
      // To resume, we just need to set isActive to true and isPaused to false.
      // The main timer useEffect will handle the rest.
      setIsActive(true);
      setIsPaused(false);
  };

  const handlePause = () => {
      // This will stop the timer via the main useEffect.
      setIsActive(false);
      // We keep track that it's paused, not reset.
      setIsPaused(true);
  }

  const handleReset = () => {
    resetTimer();
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
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 text-sm font-semibold text-cyan-400 bg-slate-700/50 rounded-full hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {language === 'zh' ? 'EN' : '中文'}
          </button>
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
          setMusicFile={setMusicFile}
          musicFileName={musicFile?.name}
          isDisabled={isActive}
          language={language}
        />

        {musicUrl && <audio ref={audioRef} src={musicUrl} />}
      </div>
    </div>
  );
}

export default App;
