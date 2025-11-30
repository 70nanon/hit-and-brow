import { useState } from 'react';
import { generateRandomSecret, validateGuess, checkGuess, isGameClear, type GameConfig } from '../utils/gameLogic';

/**
 * 推測履歴の型
 */
interface GuessHistory {
  guess: string; // 推測した数字
  hit: number; // ヒット数
  blow: number; // ブロー数
}

/**
 * ゲームの状態
 */
type GameState = 'config' | 'playing' | 'won' | 'lost';

/**
 * ゲームページコンポーネント
 * シングルプレイモードのヒットアンドブローゲーム
 */
export default function GamePage() {
  // ゲームの設定
  const [config, setConfig] = useState<GameConfig>({
    digits: 4,
    allowDuplicate: false,
  });

  // ゲームの状態
  const [gameState, setGameState] = useState<GameState>('config');
  
  // 秘密の数字（正解）
  const [secret, setSecret] = useState<string>('');
  
  // 現在の入力値
  const [currentGuess, setCurrentGuess] = useState<string>('');
  
  // 推測履歴
  const [history, setHistory] = useState<GuessHistory[]>([]);
  
  // エラーメッセージ
  const [error, setError] = useState<string>('');

  /**
   * ゲーム開始処理
   */
  const startGame = () => {
    const newSecret = generateRandomSecret(config);
    setSecret(newSecret);
    setGameState('playing');
    setHistory([]);
    setCurrentGuess('');
    setError('');
    console.log('ゲーム開始（デバッグ用）: 正解 =', newSecret);
  };

  /**
   * 推測の送信処理
   */
  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 入力値のバリデーション
    const validationError = validateGuess(currentGuess, config);
    if (validationError) {
      setError(validationError);
      return;
    }

    // ヒットとブローを計算
    const result = checkGuess(secret, currentGuess);
    
    // 履歴に追加
    setHistory([...history, { 
      guess: currentGuess, 
      hit: result.hit, 
      blow: result.blow 
    }]);

    // クリア判定
    if (isGameClear(result, config)) {
      setGameState('won');
    }

    // 入力欄をクリア
    setCurrentGuess('');
  };

  /**
   * 設定画面のレンダリング
   */
  const renderConfig = () => (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">ゲーム設定</h2>
      
      <div className="space-y-4">
        {/* 桁数選択 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            桁数を選択
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setConfig({ ...config, digits: num })}
                className={`py-2 px-4 rounded ${
                  config.digits === num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {num}桁
              </button>
            ))}
          </div>
        </div>

        {/* 重複許可オプション */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.allowDuplicate}
              onChange={(e) => setConfig({ ...config, allowDuplicate: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">数字の重複を許可する</span>
          </label>
        </div>

        {/* ゲーム開始ボタン */}
        <button
          onClick={startGame}
          className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
        >
          ゲーム開始
        </button>
      </div>
    </div>
  );

  /**
   * ゲーム画面のレンダリング
   */
  const renderGame = () => (
    <div className="max-w-2xl mx-auto mt-8 p-6">
      {/* ゲーム情報 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">Hit and Blow</h2>
        <p className="text-center text-gray-600">
          {config.digits}桁の数字を当てよう！
          {config.allowDuplicate ? '（重複あり）' : '（重複なし）'}
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          試行回数: {history.length}回
        </p>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmitGuess}>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              placeholder={`${config.digits}桁の数字を入力`}
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={config.digits}
              disabled={gameState !== 'playing'}
            />
            <button
              type="submit"
              disabled={gameState !== 'playing'}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              推測
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </form>
      </div>

      {/* 推測履歴 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">推測履歴</h3>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center">まだ推測していません</p>
        ) : (
          <div className="space-y-2">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <span className="font-mono text-lg">{item.guess}</span>
                <div className="flex gap-4">
                  <span className="text-red-600 font-bold">
                    Hit: {item.hit}
                  </span>
                  <span className="text-yellow-600 font-bold">
                    Blow: {item.blow}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ゲーム終了メッセージ */}
      {gameState === 'won' && (
        <div className="bg-green-100 border-2 border-green-600 rounded-lg p-6 mb-6 text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-2">
            🎉 おめでとうございます！
          </h3>
          <p className="text-green-700">
            {history.length}回で正解しました！
          </p>
          <p className="text-green-700 font-mono text-xl mt-2">
            正解: {secret}
          </p>
        </div>
      )}

      {/* 新しいゲームボタン */}
      <button
        onClick={() => setGameState('config')}
        className="w-full py-3 bg-gray-600 text-white rounded hover:bg-gray-700 font-bold"
      >
        設定画面に戻る
      </button>
    </div>
  );

  // 状態に応じて画面を切り替え
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {gameState === 'config' ? renderConfig() : renderGame()}
    </div>
  );
}
