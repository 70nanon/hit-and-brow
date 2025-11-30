// ゲーム設定の型定義
export type GameConfig = {
  digits: number;           // 桁数（3〜6桁など）
  allowDuplicate: boolean;  // 重複を許可するか
}

// デフォルト設定（4桁、重複なし）
export const defaultConfig: GameConfig = {
  digits: 4,
  allowDuplicate: false,
}

// ヒット・ブローの判定結果
export type GuessResult = {
  hit: number;   // 数字と位置が一致
  blow: number;  // 数字は一致するが位置が違う
}

/**
 * ランダムな秘密の数字を生成
 * @param config ゲーム設定
 * @returns 生成された数字（文字列）
 */
export function generateRandomSecret(config: GameConfig = defaultConfig): string {
  const { digits, allowDuplicate } = config;
  const availableDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const result: number[] = [];

  if (!allowDuplicate && digits > 10) {
    throw new Error('重複なしの場合、桁数は10以下である必要があります');
  }

  while (result.length < digits) {
    if (allowDuplicate) {
      // 重複を許可する場合：ランダムに選ぶ
      const randomDigit = availableDigits[Math.floor(Math.random() * 10)];
      result.push(randomDigit);
    } else {
      // 重複を許可しない場合：使用済みの数字を除外
      const randomIndex = Math.floor(Math.random() * availableDigits.length);
      const selectedDigit = availableDigits[randomIndex];
      result.push(selectedDigit);
      availableDigits.splice(randomIndex, 1); // 使用した数字を削除
    }
  }

  return result.join('');
}

/**
 * プレイヤーの入力を検証
 * @param guess 入力された数字
 * @param config ゲーム設定
 * @returns 検証結果（エラーメッセージ、またはnull）
 */
export function validateGuess(guess: string, config: GameConfig = defaultConfig): string | null {
  const { digits, allowDuplicate } = config;

  // 桁数チェック
  if (guess.length !== digits) {
    return `${digits}桁の数字を入力してください`;
  }

  // 数字のみかチェック
  if (!/^\d+$/.test(guess)) {
    return '数字のみを入力してください';
  }

  // 重複チェック（重複不可の場合）
  if (!allowDuplicate) {
    const uniqueDigits = new Set(guess.split(''));
    if (uniqueDigits.size !== digits) {
      return '重複しない数字を入力してください';
    }
  }

  return null; // エラーなし
}

/**
 * ヒット・ブローを判定
 * @param secret 秘密の数字
 * @param guess プレイヤーの予想
 * @returns ヒット数とブロー数
 */
export function checkGuess(secret: string, guess: string): GuessResult {
  let hit = 0;
  let blow = 0;

  // 各桁をチェック
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      // 数字と位置が一致 → ヒット
      hit++;
    } else if (secret.includes(guess[i])) {
      // 数字は含まれるが位置が違う → ブロー
      blow++;
    }
  }

  return { hit, blow };
}

/**
 * ゲームクリア判定
 * @param result 判定結果
 * @param config ゲーム設定
 * @returns クリアしたかどうか
 */
export function isGameClear(result: GuessResult, config: GameConfig = defaultConfig): boolean {
  return result.hit === config.digits;
}