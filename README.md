# ljg-skills-tw

> **這是繁體中文（台灣）在地化同步版本**
>
> 上游：[lijigang/ljg-skills](https://github.com/lijigang/ljg-skills) | 維護者：[@yelban](https://github.com/yelban)
>
> 所有內容已使用 OpenCC s2twp 轉換為繁體中文（台灣正體）。


我的 Codex 自定義技能集。

## 安裝

使用 [skills CLI](https://github.com/vercel-labs/skills) 安裝到 Codex：

```bash
# 安裝全部技能（全域性，org-mode 格式）
bunx skills add yelban/ljg-skills.TW -g -a codex --skill '*' -y

# 安裝全部技能（Markdown 格式，適用於 Obsidian / VSCode / Notion 等）
bunx skills add yelban/ljg-skills.TW#md -g -a codex --skill '*' -y

# 安裝單個技能
bunx skills add yelban/ljg-skills.TW -g -a codex --skill ljg-card -y

# 安裝單個技能（Markdown 格式）
bunx skills add yelban/ljg-skills.TW#md -g -a codex --skill ljg-card -y

# 安裝商業模式畫布技能（兩個分支均輸出 PNG、HTML 和 JSON）
bunx skills add yelban/ljg-skills.TW -g -a codex --skill ljg-business-model -y

# 安裝多個指定技能
bunx skills add yelban/ljg-skills.TW -g -a codex --skill ljg-card --skill ljg-learn -y

# 檢視倉庫中有哪些技能
bunx skills add yelban/ljg-skills.TW -l
```

**引數說明：**

| 引數 | 作用 |
|------|------|
| `-a codex` | 只安裝給 Codex |
| `-g` | 全域性安裝到 `~/.agents/skills/`（推薦）；不加則安裝到專案級 `.agents/skills/` |
| `--skill <name>` | 指定安裝某個技能，可重複使用 |
| `--skill '*'` | 安裝倉庫內全部技能 |
| `#md` | 從 `md` branch 安裝 Markdown 格式版本（預設為 org-mode） |
| `-y` | 跳過互動確認 |
| `-l` | 僅列出可用技能，不安裝 |

### ljg-card 依賴

`ljg-card` 依賴 Playwright 截圖，安裝後需額外執行：

```bash
cd ~/.agents/skills/ljg-card && bun install && bunx playwright install chromium
```

### 替代方式：git clone

倉庫根目錄不是技能目錄，clone 後還要把 `skills/` 同步到 Codex。下面兩種格式二選一：

```bash
# org-mode 版本（master）
git clone --branch master --depth 1 https://github.com/yelban/ljg-skills.TW.git "$HOME/code/ljg-skills"
mkdir -p "$HOME/.agents/skills"
rsync -a "$HOME/code/ljg-skills/skills/" "$HOME/.agents/skills/"

# Markdown 版本（md）
git clone --branch md --depth 1 https://github.com/yelban/ljg-skills.TW.git "$HOME/code/ljg-skills-md"
mkdir -p "$HOME/.agents/skills"
rsync -a "$HOME/code/ljg-skills-md/skills/" "$HOME/.agents/skills/"
```

## 技能

| 技能 | 說明 |
|------|------|
| **ljg-analogy** | 結構類比 — 為場景或兩個物件的差異尋找精妙類比與關係隱喻，保留關鍵關係、解釋增量與遷移邊界 |
| **ljg-blind** | 盲區掃描 — 讀取指定日期的 AI 對話，找出結構性思維盲區，並用微信讀書章節精準補上 |
| **ljg-business-model** | 商業模式畫布 — 基於《商業模式新生代》，把專案資料整理為經典九模組 PNG 卡片，區分材料、推測與缺項，保留可修改的 HTML 和 JSON |
| **ljg-card** | 內容鑄卡 — 將文本鑄成長圖 `-l`、原文保真全文卡 `-f`、漫畫 `-c`、白板 `-w` 四種 PNG；`-f` 不生成新圖，只呈現原稿自帶圖片，其餘模式按各自影像合同生成點陣圖 |
| **ljg-classic** | 古文精讀 — 將原文、逐字註解、句義、章節意旨圖與全章解讀排成一張可連續閱讀的長 PNG |
| **ljg-learn** | 概念解剖 — 從八個方向切開一個概念（歷史、辯證、現象、語言、形式、存在、美感、元反思），壓成一句頓悟 |
| **ljg-paper** | 論文閱讀 — 面向無行業背景的讀者，從具體角色與動作講清研究問題、作者貢獻、結果如何得來及證據邊界 |
| **ljg-book** | 拆書 — 講清全書的主要內容、各條主線如何相連，以及事實、事件與後果怎樣逐步改變理解；保留必要的多線發展 |
| **ljg-qa** | 資訊提問機 — 把文章/論文/書的核心觀點抽成 Q-A 鏈，Q 切要害，A 四段（結論 / 形式化 / 步驟 / 邊界） |
| **ljg-explain** | 通俗講解 — 把概念、公式、機制與原理講到能辨認、推導和遷移；預設在對話中完整講解，以遷移示例說明應用 |
| **ljg-rank** | 降秩引擎 — 給一個領域，找出背後不可再少的獨立生成器 |
| **ljg-constraint** | 約束引擎 — 給一個領域/專業/角色，找出框住它的那幾條約束（硬/軟/自設三層），揪出被當成硬約束的假牆、指出哪條能重新定義 |
| **ljg-is** | 理解引擎 — 把名詞的「是什麼」與動詞的「怎樣運作」接起來，再推出認知修正與可執行判斷 |
| **ljg-map** | 知識地圖 — 以《學習觀》的知識觀洞察文稿，提取概念、判別依據與聯結；按內容自身結構繪圖，每個節點配白話定義、短公式與具體語義 |
| **ljg-mechanism** | 機制研究 — 從具體現象追蹤過程、比較競爭解釋，並聯網核對關鍵因果與遷移條件；交付證據能支撐的機制判斷及邊界 |
| **ljg-think** | 追本之箭 — 給一個觀點或現象，縱向深鑽到不可再分的本質 |
| **ljg-word** | 單詞精通 — 深度拆解一個英語單詞的核心語義和頓悟時刻 |
| **ljg-writes** | 寫作引擎 — 把一個觀點寫成可理解、可遷移、經得住反例的中文文章 |
| **ljg-teach** | 體驗式教學 — 先讓學習者作出選擇，用公平的意外顯化認知缺口，命名後再以遷移局面複測 |
| **ljg-invest** | 投資分析 — 核心判斷專案是否是一臺「秩序創造機器」 |
| **ljg-read** | 伴讀 — 用《學習觀》的「下上結構」，從具體情境講清概念、判別依據與有條件的關係；預設直接在對話中展示 |
| **ljg-relationship** | 關係分析 — 五層結構診斷 + 精神分析，通過對話引導幫使用者"看見"關係真實結構 |
| **ljg-roundtable** | 圓桌討論 — 一個議題一場圓桌：真實人物逐輪交鋒，每輪收一張 ASCII 結構圖，散場全文存檔 |
| **ljg-structure** | 母題結構風洞 — 從表層問題找到反覆出現的母題，提煉可遷移結構，用 ASCII 圖說明關係並設計最小可逆實驗 |
| **ljg-present** | Unix 演講設計 — 保真排版 / 授權講稿提煉；按語義選擇五類版式，中文與 Unicode 連線分層，預設暗色，單檔案離線 HTML，支援講稿層與翻頁器 |
| **ljg-push** | 推送引擎 — 把本地 `~/.agents/skills/ljg-*` 一鍵同步到 github repo（master + md 雙分支）|


## 輸出格式

筆記類技能提供兩種預設輸出格式，通過不同 branch 安裝，功能完全相同：

| Branch | 格式 | 適用場景 |
|--------|------|----------|
| `master`（預設） | Org-mode（`.org`） | Emacs / Denote 使用者 |
| `md` | Markdown（`.md`） | Obsidian / VSCode / Notion 等 Markdown 生態使用者 |

`ljg-map` 在兩個分支中均預設直接在對話中輸出知識地圖與節點解釋；僅在使用者要求時儲存檔案。圖形隨文稿的知識關係變化，不預設固定層級。

`ljg-read` 在兩個分支中均預設使用中文 Markdown 在對話中講解文本；僅在使用者明確要求時儲存檔案。預設連貫講完當前範圍，提問伴讀與互動自測按需開啟。

`ljg-explain` 與 `ljg-mechanism` 在兩個分支中均預設直接在對話中交付，分別用於通俗講解與機制研究；僅在使用者明確要求時按指定格式儲存檔案。

`ljg-analogy` 在兩個分支中均預設直接在對話中給出類比或隱喻；比較兩個物件時保留關鍵差異，僅在使用者明確要求時儲存檔案。

`ljg-business-model` 在兩個分支中均交付 PNG 商業模式畫布，並保留 HTML 和 JSON；執行需要 Bun，匯出圖片需要可用的真實瀏覽器截圖能力。
