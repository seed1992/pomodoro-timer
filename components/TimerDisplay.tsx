import React from 'react';

interface TimerDisplayProps {
  secondsLeft: number;
  totalSeconds: number;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ secondsLeft, totalSeconds }) => {
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) : 1;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
      <svg className="absolute w-full h-full" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          strokeWidth="10"
          className="stroke-slate-700"
          fill="none"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          strokeWidth="10"
          className="stroke-cyan-400 transition-all duration-1000 ease-linear"
          fill="none"
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <div className="relative text-6xl font-mono font-bold text-slate-100">
        {formatTime(secondsLeft)}
      </div>
    </div>
  );
};
