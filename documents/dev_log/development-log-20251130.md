# 開発ログ

## 2025年11月30日

### プロジェクト開始

#### やったこと
- プロジェクトの企画
  - Firebaseを使ったヒットアンドブローのオンライン対戦ゲームを作ることに決定
  - 学習目的でFirebaseの主要機能（Authentication, Firestore）を使う

- 環境構築
  - Vite + React + TypeScriptでプロジェクトを初期化
  - `npm create vite@latest . -- --template react-ts`で作成
  - rolldown-vite (実験的なViteの高速版) を採用

- GitHubリポジトリの作成
  - リポジトリ名: `hit-and-brow`
  - Personal Access Token (PAT) を使ってpush
  - 初回コミット完了

- README.mdの作成
  - プロジェクト概要、技術スタック、開発の流れをドキュメント化
  - ヒットアンドブローのルールも記載

#### 使用した技術
- **Vite**: 高速な開発サーバーとビルドツール
- **React 19**: 最新版のReact
- **TypeScript**: 型安全な開発
- **Git/GitHub**: バージョン管理

#### 学んだこと
- Viteは従来のCreate React Appより圧倒的に速い
- rolldown-viteは実験的な高速ビルドツール
- GitHub PATを使ったHTTPS認証の方法

---

### Tailwind CSSのセットアップ

#### やったこと
- Tailwind CSS v3のインストール
  - 最初v4をインストールしたが、PostCSSプラグインの問題が発生
  - v3にダウングレードして解決
- 設定ファイルの作成
  - `tailwind.config.js` - Tailwindの設定
  - `postcss.config.js` - PostCSSの設定
  - `src/index.css` - Tailwindディレクティブの追加

#### 学んだこと
- Tailwind CSS v4はまだ新しく、情報が少ない
- Viteでは環境変数に`VITE_`プレフィックスが必要
- PostCSSの役割とTailwindとの関係

---

### Firebase SDKのセットアップ

#### やったこと
- Firebaseプロジェクトの作成
  - Firebaseコンソールでプロジェクト作成
  - Authentication（匿名・Google認証）を有効化
  - Firestore Databaseを作成（テストモード）
- Firebase SDKのインストール
  - `npm install firebase`
- 設定ファイルの作成
  - `.env` - Firebase APIキーなどの環境変数
  - `src/firebase.ts` - Firebase初期化コード

#### 学んだこと
- Firebaseの設定は環境変数で管理する
- `.env`ファイルは`.gitignore`に含めてGitにコミットしない
- Realtime DatabaseとFirestoreの違い（今回はFirestoreを採用）

---

### 認証機能の実装 (PR: feature/authentication)

#### やったこと
- 認証コンテキストの作成
  - `src/contexts/AuthContext.tsx` - React Contextで認証状態を管理
  - カスタムフック`useAuth()`で簡単にアクセス
- ログイン画面の実装
  - `src/components/LoginPage.tsx` - ログイン/ログアウトUI
  - 匿名ログインとGoogleログインの両方に対応
- 認証状態の永続化
  - `onAuthStateChanged`でリアルタイム監視
  - リロードしてもログイン状態を維持

#### 学んだこと
- React Context APIの使い方
  - プロバイダーパターンでアプリ全体に状態を共有
  - カスタムフックで使いやすくする
- Firebase Authenticationの基本
  - 匿名認証とGoogle認証の実装方法
  - 認証状態のリアルタイム監視
- TypeScriptの型インポート
  - `import type`で型のみをインポート
  - `verbatimModuleSyntax`への対応

#### PRのポイント
- ✅ 匿名ログイン機能
- ✅ Googleログイン機能
- ✅ ログアウト機能
- ✅ 認証状態の永続化
- ✅ リアルタイム認証状態監視

---

### ゲームロジックの実装 (進行中: feature/game-logic)

#### やったこと
- ゲームロジックの設計
  - 桁数と重複の有無を選択可能な仕様に決定
  - より柔軟でカスタマイズ可能なゲームに
- `src/utils/gameLogic.ts`の作成
  - `generateSecret()` - ランダムな秘密の数字を生成
  - `validateGuess()` - プレイヤーの入力を検証
  - `checkGuess()` - ヒット・ブローを判定
  - `isGameClear()` - ゲームクリア判定
  - 設定可能な項目：桁数、重複の有無

#### 学んだこと
- アルゴリズムの実装
  - 重複なしのランダム数字生成
  - 配列操作（splice、Set）
- 汎用的な設計
  - 設定を引数で受け取ることで柔軟性を確保
  - デフォルト値の設定

#### 次のステップ
- ゲーム画面の実装
- テストの作成（Vitestの検討）
- Firestoreとの統合（オンライン対戦）

---

### 今日の振り返り

#### 達成できたこと
- ✅ プロジェクトのセットアップ完了
- ✅ Tailwind CSSの導入
- ✅ Firebaseの初期設定
- ✅ 認証機能の完全実装（匿名・Google）
- ✅ ゲームロジックの基礎実装

#### 学んだこと
- Viteの高速さと使いやすさ
- Firebase Authenticationの便利さ
- React Context APIによる状態管理
- TypeScriptの型安全性の重要性
- GitHubのブランチ戦略とPR運用

#### 次回やること
1. ゲーム画面UIの実装
2. ゲームロジックのテスト作成
3. Firestoreでのルーム管理機能
4. リアルタイム対戦機能の実装

---
