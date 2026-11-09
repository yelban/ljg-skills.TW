# BuildDeck

從結構化資料生成規範模板的單檔案離線演示，自動內嵌字型並檢查最終檔案。

    bun Tools/BuildDeck.ts input.json output.html
    bun Tools/BuildDeck.ts input.json output.html --theme hacker

輸入需要 title、sources、slides。mode 預設為 faithful；editorial 還需 editingBasis。每頁提供顯式 role；示例見 References/CompositionDeck.json，完整欄位見 RenderingSpec.md。

顯式 theme 優先於 theme_* 視覺標籤；share/talk 等用途標籤不改變預設 hacker-dark。輸出目錄不存在時建立。已有目標 HTML 會更新，因此使用明確的任務產物路徑。

構建過程：驗證資料 → 當前模板組裝 → EmbedAssets → ValidateDeck。任一步失敗即非零退出。資料和規範模板共同進入 buildId，改動內容或渲染實現都會使舊瀏覽器報告失效。

本工具不解析任意 Org/Markdown，也不決定作者是否授權提煉。技能負責讀取完整源、選擇內容模式和轉錄獨立來源清單；工具負責兌現已選擇的契約。不要把改寫後的 slides 反過來當來源。
