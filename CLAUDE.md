# shukuba-site（滋賀 古民家宿泊 公式ホームページ）

滋賀県の古民家民泊事業（滋賀宿泊PJ）の公式ホームページ兼予約システム。このフォルダ単体で完結する作業ボックス。CEOフォルダとは別に、ここを作業ディレクトリにしてClaude Codeセッションを開けば、公式HP構築の作業に専念できる。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | トップページ |
| `rooms.html` | 部屋・宿泊プラン紹介 |
| `area.html` | エリア・観光案内 |
| `admin.html` | 管理画面 |
| `common.js` / `style.css` | 共通スクリプト・スタイル |
| `netlify/functions/` | バックエンドAPI（予約・空室・決済・LINE連携） |

## バックエンドAPI（Netlify Functions）

| ファイル | 役割 |
|---|---|
| `availability.js` | 空室確認 |
| `reserve.js` | 予約登録 |
| `cancel.js` | 予約キャンセル |
| `payment.js` | 決済処理 |
| `pricing.js` | 料金計算 |
| `line-webhook.js` | LINE連携Webhook |
| `admin.js` | 管理画面API |

## 開発・デプロイ

- Netlify上で稼働（`netlify.toml`参照、publish = "."、functions = `netlify/functions`）
- 依存: `@netlify/blobs`（データストア）
- デプロイ確認後、URLや合言葉が決まったら `spice-worksHD/CLAUDE.md` の定期実行タスク表または該当部署ページに追記する

## 作業方針

- 単体HTML＋Netlify Functionsの構成を維持し、外部依存は最小限に
- 宿泊予約サイトとしての一般的な機能（空室・予約・決済・キャンセル・通知）を中心に構築する
