import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createRoom, getWaitingRooms, joinRoom } from '../utils/roomService';
import type { Room } from '../utils/roomTypes';
import type { GameConfig } from '../utils/gameLogic';

interface RoomListPageProps {
  onJoinRoom: (roomId: string) => void;
}

/**
 * ルームリスト画面コンポーネント
 * ルームの作成と参加を行う
 */
export default function RoomListPage({ onJoinRoom }: RoomListPageProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // ゲーム設定（ルーム作成時）
  const [config, setConfig] = useState<GameConfig>({
    digits: 4,
    allowDuplicate: false,
    maxTurns: 15,
  });

  /**
   * 待機中のルーム一覧を取得
   */
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const waitingRooms = await getWaitingRooms();
      setRooms(waitingRooms);
      setError('');
    } catch (err) {
      setError('ルーム一覧の取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ルームを作成
   */
  const handleCreateRoom = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const roomId = await createRoom({
        config,
        hostUid: user.uid,
      });
      
      // ルーム画面に遷移
      onJoinRoom(roomId);
    } catch (err) {
      setError('ルームの作成に失敗しました');
      console.error(err);
      setLoading(false);
    }
  };

  /**
   * ルームに参加
   */
  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await joinRoom(roomId, user.uid);
      
      // ルーム画面に遷移
      onJoinRoom(roomId);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('ルームへの参加に失敗しました');
      }
      console.error(err);
      setLoading(false);
    }
  };

  // 初回マウント時にルーム一覧を取得
  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">オンライン対戦</h1>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* ルーム作成セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">ルームを作成</h2>
          
          <div className="space-y-4">
            {/* 桁数選択 */}
            <div>
              <label className="block text-sm font-medium mb-2">桁数</label>
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
                    disabled={loading}
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
                  disabled={loading}
                />
                <span className="text-sm font-medium">数字の重複を許可</span>
              </label>
            </div>

            {/* 最大ターン数選択 */}
            <div>
              <label className="block text-sm font-medium mb-2">最大ターン数</label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => setConfig({ ...config, maxTurns: num || undefined })}
                    className={`py-2 px-4 rounded ${
                      (config.maxTurns || 0) === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    disabled={loading}
                  >
                    {num === 0 ? '無制限' : `${num}ターン`}
                  </button>
                ))}
              </div>
            </div>

            {/* 作成ボタン */}
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700 font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '作成中...' : 'ルームを作成'}
            </button>
          </div>
        </div>

        {/* ルーム一覧セクション */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">待機中のルーム</h2>
            <button
              onClick={fetchRooms}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:bg-gray-400"
            >
              更新
            </button>
          </div>

          {loading && rooms.length === 0 ? (
            <p className="text-gray-500 text-center py-8">読み込み中...</p>
          ) : rooms.length === 0 ? (
            <p className="text-gray-500 text-center py-8">待機中のルームがありません</p>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const isFull = room.guest !== null;
                const isMyRoom = room.host.uid === user?.uid;
                
                return (
                  <div
                    key={room.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    <div>
                      <div className="font-medium">
                        {room.config.digits}桁 
                        {room.config.allowDuplicate ? ' (重複あり)' : ' (重複なし)'}
                        {' / '}
                        {room.config.maxTurns ? `${room.config.maxTurns}ターン` : '無制限'}
                      </div>
                      <div className="text-sm text-gray-600">
                        ホスト: {room.host.uid.substring(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        作成: {new Date(room.createdAt).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={loading || isMyRoom || isFull}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isMyRoom ? '自分のルーム' : isFull ? '満員' : '参加'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
