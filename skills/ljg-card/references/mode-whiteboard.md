# 模具：白板（-w）

白板把作者怎樣一步步走到結論攤開。1080px 豎長卡片像下潛深水：問題在上，前提、證據、矛盾、轉折與區域性分支逐層變深，最後停在內容自身的收束處。讀者只看成品，也應能複述「為什麼下一步從上一步發生」。

自然流動來自前一步留下的壓力，而不是旁白不斷宣佈「現在繼續追問」。主幹在賬本里始終明確；前臺只讓真正改變論證方向的鉸鏈出聲，普通延續、解釋和遞進保持安靜。

用於知識講解時，讀者還應知道現實物件憑什麼歸入概念、規則怎樣產生具體結果。先讀 `references/learning-design.md`，明確目標讀者的判斷任務。縱向主幹表示作者論證的先後，下上結構表示物件與概念的對應；二者獨立，不把整張白板強制改成上下兩欄。

執行時先讀取 `references/image-generation.md` 與 `assets/whiteboard_template.html`。共享協議決定資產身份和來源邊界，本檔案決定論證抽取、縱向主幹與區域性結構。

## 一、先建立論證賬本

視覺母題之前，先按原文閱讀順序建立賬本。不要從摘要直接進入排版；摘要會保留結論，卻最容易刪除作者抵達結論的過程。

先把鎖定後的正文按原段落儲存為精確來源快照；段落之間保留一個空行。用確定性工具生成獨立來源清單：

```bash
bun assets/prepare-whiteboard-source.ts /tmp/<task>/source.txt /tmp/<task>/whiteboard-source-inventory.json
```

工具會鎖定原檔案 SHA-256，並按順序給每個非空段落分配 `src-01`、`src-02`……及段落雜湊。論證賬本的 `source_sections` 必須與這份獨立清單 ID、順序完全一致，因此不能先漏掉原文，再讓自寫賬本與 DOM 互相證明。

每個來源段落登記為 `source_sections`：

- `id`：穩定來源錨點，例如 `src-01`；
- `disposition: rendered`：它進入白板，並列出對應 `step_ids`；
- `disposition: omitted`：它既不承擔必要論證，也不承擔目標讀者所需的學習材料，同時寫清 `omission_reason`；
- 每個源章節必須二選一，不能靜默消失。

對候選材料做兩種刪除測試，任一成立就保留：

- **論證承重**：刪後，後面的判斷失去前提、轉折、證據或邊界。
- **學習承重**：刪後，目標讀者無法初次辨認概念、區分易混物件、完成規則與具體結果的對應。例子未參與證明，也可能在這裡承重。

學習材料優先放進所屬步驟的 `support` 或區域性 `.learning-material`，不為了保留一個例子強造推理轉折；它的來源段落仍以 `rendered` 對映到該步驟。確實新增獨立判斷時才建立新步驟。最終賬本中每個步驟的 `must_render` 仍為 `true`；`omission_reason` 要說明被刪材料的功能為何不再需要，不能只寫「只是例子」。不湊固定節點數。

賬本欄位與引用齊全只證明材料已登記。節點的實際解釋還應把物件、動作或狀態、歸類依據與結果接起來；正文中看不見的對應，讀者無法從箭頭或欄位名中補出。用 `references/learning-design.md` 的同文對照審閱表達，不把結構門禁當成講解效果。

每個步驟登記：

| 欄位 | 含義 |
|---|---|
| `id` | 穩定步驟 ID，與 DOM 的 `data-step-id` 一致 |
| `role` | `question` / `premise` / `evidence` / `tension` / `inference` / `turn` / `synthesis` / `conclusion` / `boundary` |
| `source_refs` | 一個或多個來源章節 ID |
| `claim` | 本步新增的判斷，不重複總標題 |
| `support` | 原文給出的事實、解釋或限定；沒有時為空字串 |
| `residue` | 本步自然留下、足以推動後文的未解壓力；沒有就為空字串，不為湊深度製造問題 |
| `must_render` | 最終賬本固定為 `true` |
| `presentation` | `text` / `typography` / `image` / `chain` / `branch` / `timeline` / `matrix` / `radial` |

`role` 描述論證作用，不把教學例子一律標成 `evidence`。`support` 與區域性學習材料可以呈現物件、判別依據、關係及結果，不要求五項分欄。原文例項繫結其真實 `source_refs`；經授權補例放在所解釋步驟內，可見標註「補充假設例」，其規則的來源引用不能冒充例子來自原文。缺材料且未獲補例授權時，在製作記錄和交付回覆中寫明缺口。

關係另行登記為 `relations`，每條含 `id`、`from`、`to`、`kind`、`visibility`、`bridge`：

- `kind`：`continue` / `deepen` / `contrast` / `question` / `branch` / `return` / `boundary`；
- `visibility: implicit`：普通延續、解釋、例證或自然遞進。`bridge` 固定為空，視覺上只讓縱向主幹繼續；
- `visibility: visible`：矛盾出現、問題被改寫、條件變化、分支、回收或邊界。`bridge` 寫一條完整、具體的自然句，不再拆成關係標籤與解釋句。

同一條邊只能有一個可見承載面：如果當前步驟已經用 `residue` 留下了壓力，隨後關係就使用 `implicit`；如果轉折需要獨立停頓，當前步驟的 `residue` 留空，由關係的 `bridge` 承擔。不要同時寫兩遍。相鄰不自動等於因果。

最終賬本使用下面的結構，並寫入模板的 `{{LOGIC_LEDGER_JSON}}`：

```json
{
  "version": 2,
  "source_sha256": "鎖定原文的 64 位 SHA-256",
  "source_sections": [
    {"id": "src-01", "disposition": "rendered", "step_ids": ["step-01", "step-02"]},
    {"id": "src-02", "disposition": "omitted", "omission_reason": "作者資訊，不參與論證"}
  ],
  "steps": [
    {
      "id": "step-01",
      "role": "question",
      "source_refs": ["src-01"],
      "claim": "原文真正試圖回答的問題",
      "support": "問題出現的具體局面",
      "residue": "這隻說明經驗會消失，還沒有說明它應該寫到哪裡。",
      "must_render": true,
      "presentation": "typography"
    }
  ],
  "relations": [
    {"id": "rel-01", "from": "step-01", "to": "step-02", "kind": "deepen", "visibility": "implicit", "bridge": ""}
  ]
}
```

把 JSON 中的 `<` 序列化為 `\u003c`，不要把原文 HTML 或可執行內容複製進 `<script type="application/json">`。

## 二、一條主幹，區域性變形

每張白板只有一個 `.reasoning-spine`。它是閱讀方向，也是視覺上的下潛線。舊的整卡 `data-whiteboard-layout` 已停用：真實文章可以先鏈式遞進，中段分叉，隨後用矩陣比較，再匯入結論。

開頭使用：

- `.whiteboard-title`：文章議題，不提前代替全部推導；
- `.whiteboard-question`：讀者帶著什麼問題向下走；
- 可選 `.whiteboard-orientation`：交代來源場景，不寫結論摘要。

每個承重步驟使用：

```html
<article class="logic-step"
         data-step-id="step-02"
         data-role="tension"
         data-source-refs="src-01 src-02">
  <div class="step-marker" aria-hidden="true">
    <span class="step-depth">02</span><span class="step-dot"></span>
  </div>
  <div class="step-panel">
    <span class="step-role">矛盾</span>
    <h2 class="step-claim">短期記住不等於長期學會</h2>
    <p class="step-support">上下文結束後，經驗沒有穩定進入下一次任務。</p>
    <p class="step-residue">這隻說明經驗會消失，還沒有說明它應該寫到哪裡。</p>
  </div>
</article>
```

普通遞進仍登記端點，但保持靜默：

```html
<div class="logic-relation"
     data-relation-id="rel-02"
     data-from="step-02"
     data-to="step-03"
     data-kind="deepen"
     data-visibility="implicit"
     aria-hidden="true"></div>
```

真正改變方向時才使用可見轉折；一句話同時承擔關係與理由：

```html
<div class="logic-relation"
     data-relation-id="rel-03"
     data-from="step-03"
     data-to="step-04"
     data-kind="branch"
     data-visibility="visible"
     aria-label="單一記憶層無法同時滿足快速更新與穩定保留，問題由此分成兩條路線。">
  <span class="relation-rail" aria-hidden="true">
    <span class="relation-stem"></span><span class="relation-arrowhead"></span>
  </span>
  <div class="transition-copy">
    <p class="transition-sentence">單一記憶層無法同時滿足快速更新與穩定保留，問題由此分成兩條路線。</p>
  </div>
</div>
```

賬本步驟、DOM 步驟、賬本關係與 DOM 關係的 ID、順序、型別、顯隱和文字必須一致。第一步是 `question`，結論前至少有真實推導；結尾服從原文的結論、問題或餘韻，不強制以 `boundary` 收尾。`boundary` 僅標記原文真正改變判斷的適用條件或限制，不能為它補造免責宣告，也不能讓頂部一句核心判斷替代整條路徑。

### 流水式銜接的刪除測試

先把標題、支撐文字和可選 `residue` 連起來朗讀，再逐條檢查關係：

- 刪除這句轉折，讀者仍能順著前一步進入下一步：改為 `implicit`；
- 刪除後會丟失矛盾、問題改寫、分叉、回收或邊界：保留 `visible`；
- 過渡句只說「繼續追問」「再向前一步」「因此展開」而沒有指出原文中的具體未解物件：它只是報幕，重寫或刪除；
- 下一節點標題已經自然回答了前一步的餘壓：不要再加關係文案。

可見轉折的數量由刪除測試決定，不設比例。目標不是少寫，而是隻在邏輯真正換擋時寫。

## 三、五種 topology 降為區域性工具

區域性結構使用 `data-logic-shape`，可以在同一主幹內組合：

| 區域性結構 | 適用時刻 | 必須出現的語義面 |
|---|---|---|
| `chain` | 一個節點內部還需展開短遞進 | `.local-chain` 與有序子項 |
| `branch` | 同一問題分出不同條件、機制或路線 | `.local-branch`、兩條以上 `.branch-path`、迴流或開放說明 |
| `timeline` | 同一物件發生狀態遷移 | `.local-timeline`、時間/狀態標籤 |
| `matrix` | 兩條獨立軸形成比較空間 | `.local-matrix`、兩條軸與四區 |
| `radial` | 多個獨立機制共同作用於一處 | `.local-radial`、中心與獨立輻射項 |

分支必須說明去向：

```html
<section class="local-shape local-branch"
         data-logic-shape="branch"
         data-branch-state="converged"
         data-entry-step="step-04"
         data-return-step="step-07">
  <div class="branch-grid">
    <div class="branch-path" data-branch-id="route-a">...</div>
    <div class="branch-path" data-branch-id="route-b">...</div>
  </div>
  <p class="branch-return">兩條路線在 step-07 重新匯合。</p>
</section>
```

`converged` 分支的每條路徑都要通過關係抵達 `data-return-step`；暫時無法匯合時使用 `data-branch-state="open"` 並寫可見的 `.branch-open`，不能畫完兩欄就遺忘它們。

## 四、影像只進入承重步驟

在決定是否用圖前，同時檢查論證與判別是否受損：刪圖後兩者均不受損才可省略。具體下層材料可以由文字、原圖或生成場景承載，0 幅生成圖仍合法；保留圖片必須說明它讓哪個特徵或結果更容易辨認。

生成圖預算為 `0–4` 幅。白板沒有頂部 hero 圖槽；圖片只嵌入它解釋的 `.logic-step`，並讓 `data-source-claim` 等於該步驟 ID：

```html
<figure class="generated-art generated-art--whiteboard"
        data-asset-kind="generated"
        data-asset-id="g02"
        data-source-claim="step-05">
  <img src="/absolute/path.png" alt="閥門收緊後，流入容器的水明顯變少">
</figure>
```

圖片只畫人、手、物件、容器、繩索、閥門、地形等可見動作。箭頭、軸線、矩陣邊界、標籤、公式、標題和編號全部留給 HTML/CSS。提示詞追加：

```text
minimal hand-drawn whiteboard vignette, warm paper-compatible flat background,
one object and one visible action, loose marker line, low detail, generous clean margin
```

專屬負向約束：圖中不要箭頭、軸線、標籤、紙紋、便籤殼、陰影或新增高飽和色。透明背景不穩定時，平底色必須與 `--board` 完全一致。

## 五、豎長閱讀節奏

- 1080px 寬度固定，高度由推理深度決定；不為接近某個模板高度刪節點。
- 連續下潛線貫穿主幹；每個步驟帶深度編號、角色、判斷與支撐，只有真實未解壓力才增加 `residue`。
- 鋪墊收緊，矛盾、轉折、分支迴流、結論放大；不要把所有節點做成等重卡片牆。
- 每經過一個真正的推理轉折，增加縱向留白；同一層的證據與例子收緊在所屬步驟附近。
- 手寫體只用於真正的可見轉折、深度標記和短批註；正文使用本地中文 Sans。
- 適用條件與證據限定放在對應步驟的 `.logic-evidence` 或 `.step-support` 中；原文確有獨立承重的限制時，作為普通 `.logic-step` 沿主幹呈現。結尾不追加閱讀提示、製作說明或驗收宣告。
- 承擔首次辨認、易混對比或輸入輸出對應的材料使用 `.learning-material`，身份用 `.learning-label` 寫明，正文保持主要閱讀字號與深墨色。不要把關鍵判別藏進小號淺色附註；窄分支容不下時移到所屬步驟附近的全寬位置，不縮字硬塞。
- 換案問題按內容需要放在講解之後，使用 `.transfer-check`；後置 `.transfer-feedback` 說明答案依據，並可自然結束正文。先判斷再下滑的提示只能提供自測機會，不能保證答案未被看見；這一驗證限制在交付回覆中說明。
- 整圖縮小時應先看到一條連續向下的線、少數明顯轉折和最後的收束；原畫素下正文必須輕鬆可讀。

將最終賬本寫入 `{{LOGIC_LEDGER_JSON}}`，語義內容寫入 `{{CONTENT_HTML}}`，只在必要時用 `{{CUSTOM_CSS}}` 做區域性微調，並替換 `{{LOGO}}` 與 `{{SOURCE_LINE}}`。所有中間檔案寫入本任務獨佔的 `/tmp` 目錄。

## 六、截圖與驗收

```bash
bun assets/capture.ts /tmp/<task>/whiteboard.html ~/Downloads/{name}.png 1080 1600 fullpage /tmp/<task>/whiteboard-source-inventory.json /tmp/<task>/source.txt
```

截圖器會阻斷：佔位符殘留、缺少來源清單或原文快照、原文雜湊漂移、來源清單與論證賬本段落不一致、缺少唯一主幹、舊整卡 topology、賬本 JSON 錯誤、源章節無去向、承重步驟遺漏或亂序、節點未繫結來源、關係端點懸空或文字漂移、靜默關係仍帶文案或箭頭、可見關係缺少完整 bridge、同一條邊同時使用 residue 與 bridge、分支不迴流也不宣告開放、生成圖超過 4 幅或未繫結步驟、破圖/空 alt、橫向或隱藏溢位、超出支援高度。

最終驗收分別檢查：

1. **來源覆蓋**：逐項核對 `source_sections`，每個章節都有步驟或具體省略理由。
2. **論證複述**：只看 PNG，能夠說出原文的問題、承重前提、後文怎樣從前文自然發生、區域性分支怎樣回收、結論與邊界；只能複述結論分類而不能解釋推導時，判定失敗。
3. **朗讀流暢**：隱藏角色名、深度編號和關係資料後，順讀標題與正文；如果像提綱旁白反覆報幕，或刪除某條可見轉折後毫無損失，判定失敗。
4. **畫素檢查**：整圖一次；長圖再用有重疊的頂部/中段/底部切片覆蓋全部高度，確認下潛線連續、關係方向正確、真正轉折才形成停頓、文字無裁切、來源未漂移。
5. **下上連線（知識講解）**：只看成品，能指出關鍵物件、歸類依據、關係條件與具體結果；能否在換案中判斷適用或不適用。先審材料是否足夠，再區分有無讀者實測。來源對賬和賬本一致只驗證結構，不裁定例子是否足以教會、刪例是否合理、補例是否真實。
