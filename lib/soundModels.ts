// lib/soundModels.ts

/**
 * 聲音選項的類型
 * - 'none': 無聲
 * - 'builtin': 內建音源，value為檔案路徑 (e.g., /assets/sounds/SOUND.mp3)
 * - 'custom': 自定義音源，value為檔案名稱 (e.g., my_custom_sound.mp3)
 */
export type SoundType = 'none' | 'builtin' | 'custom';

export interface SoundOption {
  id: string;
  type: SoundType;
  name: string; // 顯示給使用者的名稱
  value: string; // 實際儲存的值 (路徑或檔案名)
}

// 內建音源列表
export const BUILTIN_SOUNDS: SoundOption[] = [
  { id: 'none', type: 'none', name: '無聲', value: '' },
  { id: 'sound_mp3', type: 'builtin', name: '預設鈴聲 (Sound.mp3)', value: '/assets/sounds/Sound.mp3' },
  // 可以在這裡添加更多內建音源
];

// 預設音源
export const DEFAULT_SOUND_ID = BUILTIN_SOUNDS[1].id; // 預設為 Sound.mp3
