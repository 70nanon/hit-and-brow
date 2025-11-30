import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { user, loading, signInAnonymous, signInWithGoogle, signOut } = useAuth()

  // 認証状態の読み込み中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-500 mb-8">
        Hit and Blow
      </h1>

      {user ? (
        // ログイン中の表示
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="mb-4">ログイン中です！</p>
          <p className="text-sm text-gray-600 mb-4">
            ユーザーID: {user.uid}
          </p>
          <button
            onClick={signOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            ログアウト
          </button>
        </div>
      ) : (
        // 未ログインの表示
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <button
              onClick={signInAnonymous}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ゲストログイン（戦績は保存されません）
            </button>
          </div>
          <div className="mb-4">
            <button
              onClick={signInWithGoogle}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-4"
            >
              Googleでログイン
            </button>
          </div>
        </div>
      )}
    </div>
  )
}