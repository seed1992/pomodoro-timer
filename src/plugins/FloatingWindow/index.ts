import { registerPlugin } from '@capacitor/core';

export interface FloatingWindowPlugin {
  /**
   * 檢查是否有懸浮視窗權限
   * @returns {Promise<{hasPermission: boolean}>}
   */
  checkPermission(): Promise<{ hasPermission: boolean }>;

  /**
   * 請求懸浮視窗權限
   * @returns {Promise<{granted: boolean}>}
   */
  requestPermission(): Promise<{ granted: boolean }>;

  /**
   * 顯示懸浮視窗
   * @param {string} htmlContent - 要顯示在懸浮視窗中的HTML內容
   * @returns {Promise<void>}
   */
  show(options: { htmlContent: string }): Promise<void>;

  /**
   * 隱藏懸浮視窗
   * @returns {Promise<void>}
   */
  hide(): Promise<void>;
}

const FloatingWindow = registerPlugin<FloatingWindowPlugin>('FloatingWindow');

export default FloatingWindow;
