import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToRoom,
  updatePlayerReady,
  setPlayerSecret,
  startGame,
  submitGuess,
  deleteRoom,
  updatePlayerActive,
  leaveRoomAsGuest,
} from '../utils/roomService';
import { generateRandomSecret, validateGuess, checkGuess, isGameClear, isTurnLimitReached } from '../utils/gameLogic';
import type { Room } from '../utils/roomTypes';

interface OnlineGamePageProps {
  roomId: string;
  onExit: () => void;
}

/**
 * オンライン対戦のゲーム画面
 */
export default function OnlineGamePage({ roomId, onExit }: OnlineGamePageProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [mySecret, setMySecret] = useState<string>('');
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 自分がホストかどうか
  const isHost = room?.host.uid === user?.uid;
  const myPlayer = isHost ? room?.host : room?.guest;
  const opponentPlayer = isHost ? room?.guest : room?.host;

  // 自分のターンかどうか
  const isMyTurn = room?.currentTurn === (isHost ? 'host' : 'guest');

  /**
   * プレイヤーがオンラインかどうか判定（30秒以内にアクティブ）
   */
  const isPlayerOnline = (lastActiveAt: number): boolean => {
    const now = Date.now();
    const ONLINE_THRESHOLD = 30 * 1000; // 30秒
    return now - lastActiveAt < ONLINE_THRESHOLD;
  };

  /**
   * ルーム情報のリアルタイム監視
   */
  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId, (updatedRoom) => {
      if (!updatedRoom) {
        // ルームが削除された場合は退出
        onExit();
      } else {
        setRoom(updatedRoom);
      }
    });

    return () => unsubscribe();
  }, [roomId, onExit]);

  /**
   * 定期的にアクティブ状態を更新（10秒ごと）
   */
  useEffect(() => {
    if (!user) return;

    // 初回実行
    updatePlayerActive(roomId, user.uid);

    // 10秒ごとに更新
    const interval = setInterval(() => {
      updatePlayerActive(roomId, user.uid);
    }, 10000);

    return () => clearInterval(interval);
  }, [roomId, user]);

  /**
   * ルームから退出（ホストの場合はルーム削除、ゲストの場合は退室）
   */
  const handleExit = async () => {
    try {
      if (isHost) {
        // ホストの場合はルームを削除
        await deleteRoom(roomId);
      } else {
        // ゲストの場合は退室
        await leaveRoomAsGuest(roomId);
      }
      onExit();
    } catch (err) {
      console.error('退出エラー:', err);
      // エラーが発生してもとりあえず画面から退出
      onExit();
    }
  };

  /**
   * 秘密の数字を自動生成して設定
   */
  const handleGenerateSecret = async () => {
    if (!room || !user) return;

    try {
      setLoading(true);
      const secret = generateRandomSecret(room.config);
      setMySecret(secret);
      await setPlayerSecret(roomId, user.uid, secret);
      setError('');
    } catch (err) {
      setError('秘密の数字の設定に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 準備完了/解除をトグル
   */
  const handleToggleReady = async () => {
    if (!myPlayer || !user) return;

    try {
      setLoading(true);
      await updatePlayerReady(roomId, user.uid, !myPlayer.isReady);
      setError('');
    } catch (err) {
      setError('準備状態の更新に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ゲーム開始
   */
  const handleStartGame = async () => {
    try {
      setLoading(true);
      await startGame(roomId);
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('ゲームの開始に失敗しました');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 推測を送信
   */
  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !room) return;

    setError('');

    // 入力バリデーション
    const validationError = validateGuess(currentGuess, room.config);
    if (validationError) {
      setError(validationError);
      return;
    }

    // ターン数制限チェック
    const currentTurnCount = myPlayer?.guesses.length || 0;
    if (isTurnLimitReached(currentTurnCount, room.config)) {
      setError('最大ターン数に達しました');
      return;
    }

    try {
      setLoading(true);
      await submitGuess(roomId, user.uid, currentGuess);
      setCurrentGuess('');
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('推測の送信に失敗しました');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 推測履歴からヒット/ブローを計算
   */
  const getGuessResults = (guesses: string[], secret: string) => {
    return guesses.map((guess) => {
      const result = checkGuess(secret, guess);
      return { guess, ...result };
    });
  };

  // ローディング中
  if (!room) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">ルーム情報を読み込み中...</p>
      </div>
    );
  }

  // 待機画面
  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">ルーム待機中</h2>
              <button
                onClick={handleExit}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                退出
              </button>
            </div>

            <div className="space-y-4">
              {/* ゲーム設定 */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-bold mb-2">ゲーム設定</h3>
                <p>
                  {room.config.digits}桁
                  {room.config.allowDuplicate ? ' (重複あり)' : ' (重複なし)'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  最大ターン数: {room.config.maxTurns ? `${room.config.maxTurns}ターン` : '無制限'}
                </p>
              </div>

              {/* プレイヤー情報 */}
              <div className="grid grid-cols-2 gap-4">
                {/* ホスト */}
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-bold mb-2">ホスト</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="mr-1">{isPlayerOnline(room.host.lastActiveAt) ? '🟢' : '⚫'}</span>
                    {room.host.uid.substring(0, 8)}...
                    {isHost && ' (あなた)'}
                  </p>
                  <p className={`text-sm ${room.host.isReady ? 'text-green-600' : 'text-gray-400'}`}>
                    {room.host.isReady ? '✓ 準備完了' : '準備中...'}
                  </p>
                </div>

                {/* ゲスト */}
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-bold mb-2">ゲスト</h3>
                  {room.guest ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="mr-1">{isPlayerOnline(room.guest.lastActiveAt) ? '🟢' : '⚫'}</span>
                        {room.guest.uid.substring(0, 8)}...
                        {!isHost && ' (あなた)'}
                      </p>
                      <p className={`text-sm ${room.guest.isReady ? 'text-green-600' : 'text-gray-400'}`}>
                        {room.guest.isReady ? '✓ 準備完了' : '準備中...'}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">待機中...</p>
                  )}
                </div>
              </div>

              {/* 秘密の数字設定 */}
              {!myPlayer?.secret && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                  <p className="text-sm mb-2">秘密の数字を設定してください</p>
                  <button
                    onClick={handleGenerateSecret}
                    disabled={loading}
                    className="w-full py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
                  >
                    自動生成
                  </button>
                  {mySecret && (
                    <p className="text-sm mt-2 font-mono text-center">
                      あなたの秘密の数字: <span className="font-bold">{mySecret}</span>
                    </p>
                  )}
                </div>
              )}

              {/* 準備ボタン */}
              {myPlayer?.secret && (
                <button
                  onClick={handleToggleReady}
                  disabled={loading}
                  className={`w-full py-3 rounded font-bold disabled:bg-gray-400 ${
                    myPlayer.isReady
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {myPlayer.isReady ? '準備解除' : '準備完了'}
                </button>
              )}

              {/* ゲーム開始ボタン（両者準備完了時のみ） */}
              {room.host.isReady && room.guest?.isReady && (
                <button
                  onClick={handleStartGame}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold disabled:bg-gray-400"
                >
                  ゲーム開始！
                </button>
              )}

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ゲーム中画面
  if (room.status === 'playing') {
    const myResults = myPlayer ? getGuessResults(myPlayer.guesses, opponentPlayer?.secret || '') : [];
    const opponentResults = opponentPlayer ? getGuessResults(opponentPlayer.guesses, mySecret) : [];

    // 勝敗判定
    const iWon = myResults.some((r) => isGameClear(r, room.config));
    const opponentWon = opponentResults.some((r) => isGameClear(r, room.config));

    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* ヘッダー */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">オンライン対戦中</h2>
              <button
                onClick={handleExit}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                退出
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {room.config.digits}桁
              {room.config.allowDuplicate ? ' (重複あり)' : ' (重複なし)'}
              {' / '}
              ターン: {myPlayer?.guesses.length || 0}
              {room.config.maxTurns && ` / ${room.config.maxTurns}`}
            </p>
          </div>

          {/* 勝敗表示 */}
          {(iWon || opponentWon) && (
            <div className={`${iWon ? 'bg-green-100 border-green-600' : 'bg-red-100 border-red-600'} border-2 rounded-lg p-6 mb-6 text-center`}>
              <h3 className="text-2xl font-bold mb-2">
                {iWon ? '🎉 勝利！' : '😢 敗北...'}
              </h3>
              <p className="mb-2">
                {iWon ? 'おめでとうございます！' : '相手が先にクリアしました'}
              </p>
              <p className="font-mono">
                相手の数字: <span className="font-bold">{opponentPlayer?.secret}</span>
              </p>
              <p className="font-mono">
                あなたの数字: <span className="font-bold">{mySecret}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 自分の推測履歴 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">
                あなたの推測 ({myPlayer?.guesses.length || 0}回)
              </h3>
              
              {/* 入力フォーム */}
              {!iWon && !opponentWon && (
                <form onSubmit={handleSubmitGuess} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentGuess}
                      onChange={(e) => setCurrentGuess(e.target.value)}
                      placeholder={`${room.config.digits}桁の数字`}
                      className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={room.config.digits}
                      disabled={!isMyTurn || loading}
                    />
                    <button
                      type="submit"
                      disabled={!isMyTurn || loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      推測
                    </button>
                  </div>
                  {!isMyTurn && !iWon && !opponentWon && (
                    <p className="text-sm text-gray-500 mt-2">相手のターンです</p>
                  )}
                  {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  )}
                </form>
              )}

              {/* 履歴 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {myResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">まだ推測していません</p>
                ) : (
                  myResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-blue-50 rounded"
                    >
                      <span className="font-mono text-lg">{result.guess}</span>
                      <div className="flex gap-4">
                        <span className="text-red-600 font-bold">H: {result.hit}</span>
                        <span className="text-yellow-600 font-bold">B: {result.blow}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 相手の推測履歴 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">
                相手の推測 ({opponentPlayer?.guesses.length || 0}回)
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                あなたの秘密の数字: <span className="font-mono font-bold">{mySecret}</span>
              </p>

              {/* 履歴 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {opponentResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">相手はまだ推測していません</p>
                ) : (
                  opponentResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-green-50 rounded"
                    >
                      <span className="font-mono text-lg">{result.guess}</span>
                      <div className="flex gap-4">
                        <span className="text-red-600 font-bold">H: {result.hit}</span>
                        <span className="text-yellow-600 font-bold">B: {result.blow}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ゲーム終了画面
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">ゲーム終了</h2>
        <button
          onClick={handleExit}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ルーム一覧に戻る
        </button>
      </div>
    </div>
  );
}
