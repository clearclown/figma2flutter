# figma2flutter

Figma デザインを Flutter ウィジェットコードに変換する **デザイン忠実性保証システム**。

Figma Dev Mode のコード生成プラグインとして動作し、IR (Intermediate Representation) を介した構造的変換と、3層の検証パイプラインでピクセル単位の忠実性を保証します。

## アーキテクチャ

```
FIGMA PLUGIN (Dev Mode)
  │
  ├── Node Extractors (async)    → IR JSON (構造データ)
  │     ├── style, layout, text
  │     ├── token (color, typography)
  │     ├── vector (SVG export)
  │     └── screenshot (PNG @2x)
  │
  ├── IR → Flutter/Dart Compiler  → Widget Code
  │     ├── container-emitter     (RECTANGLE → Container)
  │     ├── text-emitter          (TEXT → Text/RichText)
  │     ├── flex-emitter          (FRAME → Row/Column/Wrap)
  │     ├── stack-emitter         (GROUP/FRAME(NONE) → Stack)
  │     ├── image-emitter         (IMAGE → ClipRRect + Image.asset)
  │     ├── component-emitter     (COMPONENT → StatelessWidget)
  │     └── vector-emitter        (VECTOR → SvgPicture/CustomPaint)
  │
  └── 3-Layer Verification
        Layer 1: Structural (vitest snapshot)
        Layer 2: Visual (Figma PNG vs Flutter golden)
        Layer 3: AI (Claude Vision analysis)
```

## セットアップ

```bash
npm install
```

## ビルド

```bash
# Figma プラグイン
npm run build

# CLI ツール
npm run build:cli

# ビジュアル検証 CLI
npm run build:verify
```

## テスト

```bash
# 全テスト実行 (46 tests)
npm test

# TypeScript 型チェック
npm run typecheck
```

## 使い方

### Figma プラグイン

1. Figma デスクトップアプリで Dev Mode を開く
2. Plugins > figma2flutter を選択
3. 出力言語を選択:
   - **Flutter/Dart** — ウィジェットコード + トークンクラス
   - **IR (JSON)** — 中間表現データ
4. (オプション) Include Screenshots: **Yes (@2x PNG)** でスクリーンショット付きIR出力

### CLI 変換

```bash
# 基本変換
node dist/cli.js design.ir.json

# 出力先指定
node dist/cli.js design.ir.json --out-dir ./lib/generated

# スクリーンショット付き
node dist/cli.js design.ir.json --with-screenshots

# IR検証のみ
node dist/cli.js design.ir.json --validate-only
```

### ビジュアル検証

Figma参照スクリーンショットとFlutterゴールデンをClaude Vision APIで比較:

```bash
export ANTHROPIC_API_KEY=your-key-here

# 基本比較
node dist/verify-visual.js figma_ref.png flutter_golden.png

# IR コンテキスト付き
node dist/verify-visual.js figma_ref.png flutter_golden.png --ir design.ir.json

# JSON出力 (CI向け)
node dist/verify-visual.js figma_ref.png flutter_golden.png --json
```

## プロジェクト構造

```
src/
├── ir/
│   ├── schema.ts              # IR型定義 (8ノードタイプ + スクリーンショット)
│   └── ir-validator.ts        # トークン参照・範囲検証
├── compiler/
│   ├── flutter-compiler.ts    # IR → Dart コンパイラ
│   ├── test-emitter.ts        # テスト生成 (golden + structural + screenshot)
│   ├── token-emitter.ts       # トークンDartクラス生成
│   ├── dart-formatter.ts      # Dartコードフォーマット
│   └── emitters/              # 7つのウィジェットエミッタ
├── plugin/
│   ├── main.ts                # Figma codegenハンドラ (async)
│   ├── extractor/             # ノード抽出 (style, layout, text, token, screenshot)
│   └── utils/                 # カラーユーティリティ
├── cli/
│   ├── convert.ts             # 変換CLI
│   └── verify-visual.ts       # Claude Vision検証CLI
└── shared/
    ├── constants.ts           # バージョン・インデント定数
    └── types.ts               # 設定型定義

test/
├── fixtures/                  # 16 IR JSONテストフィクスチャ
├── expected/                  # 15 期待出力Dartファイル
├── compiler/                  # コンパイラ・テストエミッタテスト
└── ir/                        # IRバリデータテスト

agents/                        # Claude Code エージェント
commands/                      # Claude Code コマンド
skills/                        # Claude Code スキル
hooks/                         # Claude Code フック
```

## 設定

`figma2flutter.config.json` でターゲットFlutterプロジェクトとトークンマッピングを設定:

```json
{
  "targetFlutterProject": "~/Projects/tabechao/mobile",
  "generatedDir": "lib/generated",
  "testDir": "test/golden/generated",
  "goldenDir": "test/goldens/ci",
  "tokenConfig": {
    "colorClassName": "DesignTokens",
    "colorImport": "package:mobile/core/theme/design_tokens.dart",
    "generateTokenFiles": false
  },
  "screenshotConfig": {
    "scale": 2,
    "referenceDir": "test/goldens/figma_ref",
    "tolerance": 0.03
  },
  "verificationConfig": {
    "enabled": true,
    "anthropicModel": "claude-sonnet-4-20250514",
    "autoVerifyOnFailure": true
  }
}
```

## CI

GitHub Actionsで自動検証:

- **compiler-tests** — TypeCheck + 46テスト + ビルド
- **ir-validation** — 全テストフィクスチャのIR検証
- **visual-verification** — ゴールデンテスト失敗時にClaude Visionで差異分析、PRコメントにレポート投稿

## 対応ノードタイプ

| Figma | IR Type | Flutter Widget |
|-------|---------|---------------|
| Frame (auto-layout) | FRAME | Row / Column / Wrap |
| Frame (free-form) | FRAME | Stack + Positioned |
| Text | TEXT | Text / RichText + TextSpan |
| Rectangle | RECTANGLE | Container + BoxDecoration |
| Rectangle (image fill) | IMAGE | ClipRRect + Image.asset |
| Component | COMPONENT | StatelessWidget class |
| Instance | INSTANCE | (same as Frame) |
| Group | GROUP | Stack + Positioned |
| Vector | VECTOR | SvgPicture.string / CustomPaint |

## ライセンス

MIT
