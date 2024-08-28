# WRTN TS Proxy

本プログラムは[リートン](https://wrtn.jp/)のチャット機能をAPIとして提供するためのソフトウェアです.

試作段階であり, 現在いくつかの主要な機能には対応していません.

## セットアップ方法

### 要件

- Cloudflare Accessアカウント
- Bun/Node

サーバーレスとしてCloudflare Workersを採用しているため, 利用するにあたってWRTNとCloudflareのアカウントが必要になります.

### 手順

- プロジェクトのクローン: `git clone https://github.com/tkgstrator/wrtn_ts_proxy && cd wrtn_ts_proxy`
- 依存関係のインストール: `bun install`
- Cloudlflareにログインする: `bun wrangler login`
- ワーカーをリリースする: `bun wrangler deploy`

## 利用方法

`https://wrtn_proxy.YOURNAME.workers.dev/docs`でOpanAPIで書かれたドキュメントが確認できます.

また[デモ版](https://wrtn_proxy.lemonandchan.workers.dev/docs)を利用することも出来ます.

### 機能

- 認証
  - [x] ログイン
  - [x] リフレッシュ
- チャットルーム
  - [x] 作成
  - [x] 取得
  - [x] 削除
  - [x] 一括取得
  - [x] 一括削除
- チャット
  - [x] 送信
  - [x] 受信

### モデル

プラットフォームによって利用できるモデルが異なります.

| LLM            | Web | iOS | Android |
| :------------: | :-: | :-: | :-----: |
| Search         | ✔  | ✔  | ✔      |
| GPT-3.5        | -   | ✔  | -       |
| GPT-4o         | ✔  | ✔  | ✔      |
| GPT-4v         | -   | ✔  | -       |
| GPT-4o-mini    | ✔  | ✔  | ✔      |
| SD3            | ✔  | -   | -       |
| Claude 3 Haiku | ✔  | -   | -       |

## 今後の展望

- [ ] チャット履歴
  - [ ] 作成(キャラクター指定)
  - [ ] 複数削除
- [ ] キャラクター
  - [ ] 作成
- [ ] その他
  - [ ] ユニットID取得
