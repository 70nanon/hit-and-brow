import { useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/LoginPage'
import GamePage from './components/GamePage'
import './App.css'

function App() {
  // 認証状態を取得
  const { user } = useAuth()

  // ユーザーがログインしていない場合はログインページを表示
  if (!user) {
    return <LoginPage />
  }

  // ログイン済みの場合はゲームページを表示
  return <GamePage />
}

export default App
