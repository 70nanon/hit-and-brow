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

### 次のステップ

1. Tailwind CSSのセットアップ
2. Firebaseプロジェクトの作成と設定
3. 認証機能の実装（匿名ログイン or Google認証）
4. ゲームロジックの実装
5. Firestoreを使ったリアルタイム対戦機能

---
