import { registerPlugin } from '@capacitor/core';

export interface ForegroundServicePlugin {
  /**
   * 啟動前景服務
   * @param options 包含通知標題、內容和剩餘秒數
   */
  start(options: { title: string; text: string; secondsLeft: number }): Promise<void>;

  /**
   * 停止前景服務
   */
  stop(): Promise<void>;

  /**
   * 更新前景服務的通知內容和剩餘秒數
   * @param options 包含通知標題、內容和剩餘秒數
   */
  update(options: { title: string; text: string; secondsLeft: number }): Promise<void>;
}

const ForegroundService = registerPlugin<ForegroundServicePlugin>('ForegroundService');

export default ForegroundService;
