# NEON TOWER — 名張祭

easy-threeによる、1プレイ最大60秒の3Dタワーゲームの試作。

公開URL: https://masabando.github.io/game-2026/

## 起動

```sh
npm install
npm run dev
```

表示されたURLをブラウザで開きます。スペースキー・画面クリック・スマホのタップ・「積む」ボタンで操作します。左右／奥行き方向が交互に切り替わり、重ならなかったら終了。音は右上のSOUNDボタンでBGM・効果音をまとめて切り替えます（初期状態はOFF）。BGMはプレイ開始ごとに4曲からランダムに選び、同じ曲の連続を避けます。曲名は右上に表示し、リザルト中も再生を続けます。別タブへ移るとBGMを一時停止します。最高記録はゲーム終了時にブラウザのlocalStorage（nabari-neon-best）に保存されます。端末・ブラウザ間では共有されず、サイトデータを消すとリセットされます。

## 確認・配布

```sh
npm test
npm run build
npm run preview
```

distが配布用ファイルです。依存ライブラリは同梱されます。タイトルはArchivo Black、日本語UIはNoto Sans JPをGoogle Fontsから読み込みます（ネット接続がない場合は代替フォントで表示）。HTTPサーバーで配信してください（index.htmlの直接ダブルクリックは対象外）。GitHub Pagesの公開URLから遊ぶ場合、当日のPCにNode.jsは不要です。

描画解像度を最大1.5倍に制限し、リアルタイムの影・ブルーム・物理エンジンを使わず描画しています。WebGL2対応ブラウザとGPUが必要です。当日のWindows 10機で速度と表示の実機確認が必要です。

## GitHub Pagesへの公開

mainへのpushでGitHub Actionsがテスト・ビルドし、distをGitHub Pagesへ公開します。PagesのSourceはGitHub Actionsです。Viteのbaseは/game-2026/に設定しています。リポジトリ名を変更する場合はbaseも変更してください。
