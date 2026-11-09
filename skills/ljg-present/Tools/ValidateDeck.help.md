# ValidateDeck · 4.8

    bun Tools/ValidateDeck.ts deck.html --json
    bun Tools/ValidateDeck.ts deck.html --theme hacker-dark
    bun Tools/ValidateDeck.ts deck.html --browser-report probe.json
    bun Tools/ValidateDeck.ts SloganTemplate.html --template
    bun Tools/ValidateDeck.ts --self-test

## 靜態檢查

- 與當前規範模板一致：資料、受限字型槽和許可之外的 renderer/CSS/DOM 改動會被拒絕。保留舊函式名或校驗 token 不能替代實際模板。
- 最終 RAW_SLIDES、DECK_META 的語法、語義角色、主體互斥和源清單。
- faithful 模式逐欄位內容、順序與續頁重建；editorial 模式授權依據記錄、引用覆蓋與圖資料有效性。
- 資料、元資訊和規範模板共同繫結 buildId。
- 離線資源、字型簽名、許可槽、零動效和執行時語法。

## 瀏覽器報告

--browser-report 核對同一 buildId 的實際頁面探針報告。ProbeDeck.js 檢查渲染後的文字、角色、主體、字號、邊界和互動。未提供報告時，靜態通過不會被描述成視覺驗收。

## 自測

覆蓋規範模板、額外 CSS、跳過渲染的分支、額外指令碼、外部資源、字型偽裝、用途標籤、兩行主張、保真漂移、圖形端點、價格和公式。原生 chart 的真實 renderer 在最小 DOM fixture 中核對共同零點、正負條形、真即時間間距、原始點數、移動資料列表和文本安全。

## 返回值與邊界

成功退出 0，驗證失敗非零。--json 給出逐項失敗和瀏覽器驗證狀態。

來源清單仍需獨立對照完整原稿；工具不能判斷模型自行轉錄的來源是否真實。字型檔案簽名不等於完整解碼證明，截圖器也可能遺漏瀏覽器原生介面細節。有限測試只支援其實際條件，審美和關係含義需源文與視覺複核。
