---
name: ljg-present
description: "Unix 氣質的演講設計與保真排版。把 Org/Markdown 提綱或經授權提煉的講稿製成單檔案離線 HTML；以語義角色選擇巨句、對照、Unicode 關係圖、證據與章節版式。預設深色，支援講稿層、原生圖表與翻頁筆。USE WHEN present、做演講、slides、按 outline 美化、把講述精髓放上螢幕。NOT FOR 未經授權改寫作者內容或生成企業 PPT。"
user_invocable: true
version: "4.8.0"
---

# ljg-present：演講鑄造器

讓觀眾一眼找到這一頁的主角，讓講者有足夠的提示繼續展開。Unix 氣質來自精確的關係、自然的文字、清楚的主次和有意保留的空白。

## Workflow Routing

| 工作 | 入口 |
|---|---|
| 生成、重排或改進演示 | [Workflows/Generate.md](Workflows/Generate.md) |

## Gotchas

- share、talk 等用途標籤不決定顏色。未指定視覺主題時使用 hacker-dark。
- 兩行可以是一個判斷。role 由講述功能決定；行數只參與字號與分頁。
- 標題、主體、提示句不是必填三件套。主句已經完成表達時，讓它獨立站住。
- Unicode 連線線使用等寬網格，中文節點獨立排版。不要把中文逐字塞進固定字元格。
- 靜態通過不等於畫面成立。構建工具固定模板；瀏覽器探針核對實際繪製的頁面，截圖另檢視覺主次。

## 兩種內容契約

| 模式 | 何時使用 | 保真物件 |
|---|---|---|
| faithful 保真排版 | 已有投影提綱；未授權改寫 | 原文字句、順序、表格、程式碼和源圖 |
| editorial 演講編排 | 使用者已要求提煉講稿、重組展示或重繪圖 | 觀點、證據、限定條件、數值和關係；上屏文字可在授權範圍內改寫 |

當前請求已授權的提煉或重繪直接執行，不重複詢問。演講編排記錄 editingBasis，上屏內容以 sourceIds 回到完整來源；完整講述放入 notes，按 N 檢視。僅有「做成演示」不自動授權刪改作者內容。

## 設計與實現

- 先讀 [DesignSystem.md](DesignSystem.md)，按相關版式檢視 [CompositionReference.md](CompositionReference.md) 的實際樣張。
- 資料契約見 [RenderingSpec.md](RenderingSpec.md)；關係圖、原生圖表與原始碼的邊界見 [ChartSpec.md](ChartSpec.md)。
- 使用 Tools/BuildDeck.ts 把資料裝入 SloganTemplate.html；不在產物末尾補 CSS，不另寫渲染分支。
- 保留源中的章節轉折與停頓。內容節點數、頁數和圖數都不是質量目標。
- 核心觀點、重要限制和資料按投影距離保持可讀；輔助資訊退後或進入講稿，不能縮小核心資訊來製造留白。

## 主題

顯式選擇 > 明確的 theme_* 視覺標籤 > hacker-dark。普通話題、用途標籤不參與主題選擇。

| 意圖或引數 | theme |
|---|---|
| 預設、Unix、terminal、暗色 | hacker-dark |
| 淺色 Hacker、--hacker、相容 --cyber | hacker |
| -b / --theme=black | black |
| -r / --theme=red | red |
| -y / --theme=yellow | yellow |

## 交付

一個 ~/Downloads/{title}.html，字型內嵌，圖表內聯，離線、零動效。→ ↓ Space Enter j PageDown 前進；← ↑ k PageUp 後退；Home/End 首末頁；F 全屏；N 講稿。滾動圖形和講稿時不觸發翻頁。

靜態驗證檢查當前模板與源資料；使用 Interceptor 隔離瀏覽器載入 Tools/ProbeDeck.js，再看整套縮圖與代表頁。隔離瀏覽器不可用時保留產物並如實報告未完成視覺複驗，不改用主瀏覽器冒充驗收。

## Examples

- 「按原提綱做演示，別改字」→ faithful，根據語義選版式，必要時沿源邊界續頁。
- 「把講述精髓放進展示，供我現場展開」→ editorial，提煉主張、對照或關係，完整講稿進入 notes。
- 「把舊 ASCII 圖改成 Unicode」→ 記錄重繪授權，以節點、連線和方向核對新圖；真實程式碼仍逐字元保留。
