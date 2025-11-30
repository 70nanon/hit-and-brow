import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import GamePage from './components/GamePage';
import RoomListPage from './components/RoomListPage';
import OnlineGamePage from './components/OnlineGamePage';
import './App.css';

type Screen = 'menu' | 'singlePlay' | 'onlinePlay' | 'onlineGame';

function App() {
  const { user, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [currentRoomId, setCurrentRoomId] = useState<string>('');

  // ログインしていない場合はログイン画面を表示
  if (!user) {
    return <LoginPage />;
  }

  // ログアウト処理
  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentScreen('menu');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // ルームに参加/作成したときの処理
  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setCurrentScreen('onlineGame');
  };

  // ルームから退出したときの処理
  const handleExitRoom = () => {
    setCurrentRoomId('');
    setCurrentScreen('onlinePlay');
  };

  // メニュー画面
  if (currentScreen === 'menu') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Hit and Blow</h1>
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentScreen('singlePlay')}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg"
              >
                シングルプレイ
              </button>
              
              <button
                onClick={() => setCurrentScreen('onlinePlay')}
                className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg"
              >
                オンライン対戦
              </button>

              <button
                onClick={handleSignOut}
                className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold"
              >
                ログアウト
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              ログイン中: {user.uid.substring(0, 12)}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // シングルプレイ画面
  if (currentScreen === 'singlePlay') {
    return (
      <div>
        <button
          onClick={() => setCurrentScreen('menu')}
          className="fixed top-4 left-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← メニューに戻る
        </button>
        <GamePage />
      </div>
    );
  }

  // オンライン対戦画面（ルーム一覧）
  if (currentScreen === 'onlinePlay') {
    return (
      <div>
        <button
          onClick={() => setCurrentScreen('menu')}
          className="fixed top-4 left-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← メニューに戻る
        </button>
        <RoomListPage onJoinRoom={handleJoinRoom} />
      </div>
    );
  }

  // オンライン対戦画面（ゲーム中）
  if (currentScreen === 'onlineGame') {
    return <OnlineGamePage roomId={currentRoomId} onExit={handleExitRoom} />;
  }

  return null;
}

export default App;
