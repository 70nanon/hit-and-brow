import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';   
import type { User } from 'firebase/auth';
import { signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

// 認証コンテキストの型定義
// このコンテキストを通じて、アプリ全体で認証状態を共有する
interface AuthContextType {
  user: User | null;        // 現在ログイン中のユーザー（未ログインならnull）
  loading: boolean;         // 認証状態の読み込み中かどうか
  signInAnonymous: () => Promise<void>;   // 匿名ログイン関数
  signInWithGoogle: () => Promise<void>;  // Googleログイン関数
  signOut: () => Promise<void>;  // ログアウト関数
}

// Contextを作成（初期値はundefined）
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProviderコンポーネント：子コンポーネントに認証機能を提供する
export function AuthProvider({ children }: { children: ReactNode }) {
  // ユーザー状態を管理（ログイン中のユーザー情報を保持）
  const [user, setUser] = useState<User | null>(null);
  // 読み込み状態を管理（初期状態の判定中はtrue）
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebaseの認証状態変化を監視
    // ログイン/ログアウト時に自動的に呼ばれる
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);         // ユーザー状態を更新
      setLoading(false);     // 読み込み完了
    });

    // コンポーネントがアンマウントされる時にリスナーを解除
    return unsubscribe;
  }, []);

  // 匿名ログイン関数
  // Firebaseの匿名認証を使用して自動的にユーザーを作成
  const signInAnonymous = async () => {
    await signInAnonymously(auth);
  };

  // Googleログイン関数
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };



  // ログアウト関数
  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  // Contextプロバイダーで子コンポーネントをラップ
  // これにより、子コンポーネントでuseAuth()が使えるようになる
  return (
    <AuthContext.Provider value={{ user, loading, signInAnonymous, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// カスタムフック：認証コンテキストを簡単に使うためのヘルパー
export function useAuth() {
  const context = useContext(AuthContext);
  // AuthProvider外で使われた場合はエラーを投げる
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}