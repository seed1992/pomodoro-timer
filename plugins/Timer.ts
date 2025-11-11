import { registerPlugin } from '@capacitor/core';

export interface TimerPlugin {
  start(options: { seconds: number }): Promise<void>;
  pause(): Promise<void>;
  reset(): Promise<void>;
}

const Timer = registerPlugin<TimerPlugin>('Timer');

export default Timer;
