import type { GameConfig } from './gameLogic';

/**
 * ルームの状態
 */
export type RoomStatus = 'waiting' | 'playing' | 'finished';

/**
 * プレイヤーの役割
 */
export type PlayerRole = 'host' | 'guest';

/**
 * プレイヤー情報
 */
export interface Player {
  uid: string;           // ユーザーID
  role: PlayerRole;      // ホスト or ゲスト
  isReady: boolean;      // 準備完了フラグ
  secret?: string;       // 自分の秘密の数字（相手には見えない）
  guesses: string[];     // 推測の履歴
  lastActiveAt: number;  // 最終アクティブ時刻（タイムスタンプ）
}

/**
 * ルーム情報
 */
export interface Room {
  id: string;                    // ルームID
  status: RoomStatus;            // ルームの状態
  config: GameConfig;            // ゲーム設定
  host: Player;                  // ホストプレイヤー
  guest: Player | null;          // ゲストプレイヤー（未参加の場合null）
  currentTurn: PlayerRole;       // 現在のターン
  createdAt: number;             // 作成日時（timestamp）
  updatedAt: number;             // 更新日時（timestamp）
}

/**
 * ルーム作成時の初期データ
 */
export interface CreateRoomData {
  config: GameConfig;
  hostUid: string;
}

/**
 * 推測結果の履歴（Firestore保存用）
 */
export interface GuessHistory {
  playerUid: string;    // 推測したプレイヤー
  guess: string;        // 推測した数字
  hit: number;          // ヒット数
  blow: number;         // ブロー数
  timestamp: number;    // 推測した時刻
}
