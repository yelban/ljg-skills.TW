# AnnotateAndRender

把一章古文變成「原文主幹 + 彩色夾註 + 完整章節解讀」的單張長 PNG。

## Step 0 — Sufficiency Check

先讀使用者輸入與最近上下文，確認三件事：原文、書名、章節。

- 三項齊全：直接執行。
- 書名或章節可從標題唯一推出：採用該判斷，並用一行說明推斷。
- 存在兩個會改變底本或章節範圍的解釋：最多問 3 個短問題；使用者回覆 `proceed` 時採用最可信版本並顯式標註來源邊界。
- 只有一句短句且使用者只問意思：退出本技能，改做普通翻譯。

## Step 1 — 載入合同

完整讀取：

1. `~/.agents/skills/ljg-explain/SKILL.md`
2. `~/.agents/skills/ljg-writes/SKILL.md`
3. `~/.agents/skills/ljg-writes/Workflows/WriteEssay.md`
4. `References/AnnotationMethod.md`
5. `References/LayoutGrammar.md`
6. `References/InputSchema.md`

借用前兩個技能的語言與理解標準，產物與組織方式服從本工作流，不執行獨立講解的自測或其他技能的 Org 落盤步驟。本工作流在 `/tmp` 生成 classic JSON、HTML、候選 PNG、manifest 與複驗切片，最終只交付通過驗收的 PNG。

## Step 2 — 鎖定原文

1. 原樣儲存使用者提供的底本文字、標點、書名、章節和來源描述。
2. 使用者只給書名與章節時，使用可核驗的權威或公開底本；聯網讀取遵守當前 `web-access` 合同。
3. 不把網路現代改寫冒充原文。底本間有關鍵異文時，選擇一個主底本，並在 `source` 或 `variant` 注中說明。
4. 建立原文連續讀回串。渲染後的黑色原文按順序拼接，必須與底本逐字一致。

## Step 3 — 做逐字註解

按 `References/AnnotationMethod.md` 切成最小有意義單位：

- 每個非標點 token 必須有 `note`。
- `word`：字義、詞義、虛詞功能、語法、古今義。
- `clause`：當前短句在做什麼、動作指向誰、因果如何接上。
- `variant`：通假、異文、底本疑點或解釋分歧。
- 生僻讀音才寫 `pinyin`，不把每個常用字都標成拼音教材。

完成後做覆蓋檢查：非標點 token 數 = 有注 token 數。任何缺口都先補註，再寫章節解讀。

## Step 4 — 寫全章解讀

先用一句普通話固定全章主關係：

```text
在什麼條件下，誰通過什麼動作改變了什麼，最後產生什麼結果。
```

隨後內部借用 `ljg-explain` 與 `ljg-writes` 的共同檢查：

1. 用聰明的 12 歲孩子能複述的中文說清承重詞。
2. 從章內一個最小情境啟動，讓自然解釋先執行，再指出它漏掉的那一步。
3. 每次只補當前缺口需要的一個區分，回到同一情境重跑。
4. 最後重新接起「條件—機制—結果」。
5. 留下一個跨場景遷移或一個失效邊界。

預設 900–1500 箇中文字元，寫成自然推進的 3–6 段。可有唯一標題「章節解讀」，正文不展示“零號模型、概念補位、遷移測試”等腳手架。不得虛構作者經歷或現代故事。

邊界必須埋進自然敘述，不得出現「解讀邊界」「應用邊界」「失效邊界」等獨立標題或提示語。讀者應該直接讀到限制條件，不應看見寫作者的檢查表。

## Step 4.5 — 生成頂部意旨圖

預設使用內建 `image_gen` 生成一幅橫向章節意旨圖；使用者明確說「不要配圖」「純文字」時省略。配圖只抓本章的一個主關係，不逐句畫故事。

提示詞必須包含：

- 畫面用途：古文長圖頂部，橫向 3:2，標題下、原文前。
- 核心意旨：用一個可見動作或狀態表達本章主關係。
- 氣質：古雅、柔和、通透，大量留白，低對比。
- 媒介：水墨或淡礦物色，暖紙底，可有細微紙紋。
- 禁止：文字、書法、標題、印章、水印、邊框、高飽和、擁擠場景、無法核驗的歷史細節。

使用內建 `image_gen` 後，把選中的 PNG 複製進本次獨佔 `/tmp` 工作區的 `assets/`。生成失敗或工具不可用時，不阻斷正文：省略 `heroImage` 與 `heroAlt`，繼續渲染，並在交付中說明無圖原因。不得用遠端圖片 URL 或佔位圖矇混；配圖必須是工作區內真實存在、能嵌入 HTML 並參與 manifest 雜湊校驗的本地檔案。

## Step 5 — 建立隔離工作區並生成 classic JSON

每次執行建立一個新的獨佔工作區。不要複用上一輪目錄，也不要在倉庫、筆記目錄、當前工作目錄或 Downloads 中生成過程檔案。

```bash
run_dir="$(mktemp -d /tmp/ljg-classic.XXXXXX)"
mkdir -p "$run_dir/assets" "$run_dir/qa-slices"
```

按 `References/InputSchema.md` 把以下過程檔案全部寫入 `$run_dir`：

```text
$run_dir/{timestamp}--classic-{safe-name}.json
$run_dir/{timestamp}--classic-{safe-name}.html
$run_dir/{timestamp}--classic-{safe-name}.candidate.png
$run_dir/{timestamp}--classic-{safe-name}.candidate.manifest.json
$run_dir/assets/{safe-name}-意旨圖.png
$run_dir/qa-slices/*.png
```

`{safe-name}` 由書名與章節構成，並移除路徑分隔符與控制字元。即使使用者要求“重做、修改、重跑”，也新建本輪工作區；只有最終交付路徑可在使用者明確要求時覆蓋。

`original` 儲存鎖定後的完整底本；不得省略。渲染器會將所有 token 的 `text` 順序拼接，並與它逐字比對。

## Intent-to-Flag Mapping

| 使用者表達 | 引數 | 作用 |
|---|---|---|
| 預設、配圖、古雅 | JSON `heroImage` + `heroAlt` | 生成並嵌入頂部意旨圖 |
| 不要配圖、純文字 | 省略 `heroImage` + `heroAlt` | 保持純文字長圖 |
| 預設、長圖、一張圖 | `--width 1080` | 標準閱讀寬度 |
| 指定寬度 | `--width <畫素>` | 僅在 720–1600 範圍內採用 |
| 指定最終 PNG 路徑 | 交付階段複製到 `<path>` | 本次顯式目標覆蓋預設 `$HOME/Downloads/` |
| 保留指定 HTML | 驗收後複製 HTML 到 `<path>` | 未明確要求時 HTML 只留在 `/tmp` |

## Step 6 — 渲染

從技能根目錄執行：

```bash
bun Tools/RenderClassic.ts \
  --input "$run_dir/<classic.json>" \
  --output "$run_dir/<classic.candidate.png>" \
  --html "$run_dir/<classic.html>" \
  --width 1080 \
  --slices-dir "$run_dir/qa-slices"
```

首次缺依賴時只用：

```bash
bun install
bunx playwright install chromium
```

不得改用 `npm`、`npx`、Python 排版指令碼或遠端截圖服務。

## Step 7 — 驗收

依次執行：

```bash
bun Tools/ValidateClassic.ts \
  --input "$run_dir/<classic.json>" \
  --png "$run_dir/<classic.candidate.png>" \
  --manifest "$run_dir/<classic.candidate.manifest.json>"
```

再做視覺讀回：

1. 看整圖：書名、章節、意旨圖、原文、註解、章節解讀和來源層級是否一眼分開。
2. 看頂部：意旨圖位於標題後、原文前；無字、無水印、不過亮，且不會把標題或第一段擠出閱讀節奏。
3. 看中段：夾註沒有蓋住原文，顏色沒有混義，斷行不把一個註解拆碎。
4. 看解讀：暖紙深墨能連續閱讀，正文沒有藍色長段，也沒有「解讀邊界」等腳手架標籤。
5. 看底部：最後一段與來源完整出現，沒有大塊異常空白或裁切。
6. 高圖使用覆蓋全高的重疊切片檢查，不能只看縮小整圖。

硬門：

- 黑色原文連續讀回 = 鎖定底本。
- 非標點 token 註解覆蓋率 = 100%。
- PNG 真寬度 = 請求寬度，真高度 > 0。
- 書名、章節和「章節解讀」均出現在 HTML 與 PNG 可見區域。
- 提供 `heroImage` 時，圖片必須被嵌入 HTML 且在 PNG 中可見；不得載入遠端資源。
- 章節解讀中不得出現「解讀邊界」。
- 檔案雜湊、DOM 計數與 manifest 一致。

## Step 7.5 — 交付已驗收 PNG

只有 Step 7 的硬門和整圖、重疊切片目視讀回全部通過後，才建立最終交付：

1. 預設目標是 `$HOME/Downloads/{safe-name}.png`；使用者顯式指定另一最終 PNG 路徑時採用該路徑。
2. 若預設目標已存在且使用者沒有明確要求覆蓋，使用 `$HOME/Downloads/{safe-name}-{timestamp}.png`，不得靜默覆蓋。
3. 將候選 PNG 複製到最終路徑；JSON、HTML、manifest、意旨圖與 QA 切片仍留在 `$run_dir`。
4. 對候選 PNG 與最終 PNG 分別執行 `shasum -a 256`，兩者必須一致；再讀回最終 PNG 的真實畫素尺寸。雜湊或尺寸不一致即交付失敗。
5. 不自動刪除 `$run_dir`。它是本次複驗附件的臨時容器，由系統臨時目錄生命週期管理；不得把它冒充長期成品目錄。

## Step 8 — 報告

最終報告：Downloads 中最終 PNG 的絕對路徑、畫素尺寸、原文 token/註解覆蓋、章節解讀字數、視覺讀回結論，以及候選/最終 PNG 的 SHA-256 一致性。把 PNG 放在第一位；隨後列出 `$run_dir` 及其中的 JSON、HTML、manifest 作為臨時複驗附件。
