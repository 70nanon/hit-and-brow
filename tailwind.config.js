export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // どのファイルでTailwindを使うか
  ],
  theme: {
    extend: {},  // カスタムカラーやサイズを追加できる
  },
  plugins: [],
}