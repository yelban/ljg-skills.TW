# Generate

## 完成狀態

交付一個離線 HTML。每頁的語義角色和主視覺明確，章節節奏與原意成立，文字與關係有來源，原尺寸可讀，整套有一致的視覺語言。

讀取完整源文、[DesignSystem.md](../DesignSystem.md)、[RenderingSpec.md](../RenderingSpec.md) 和對應的[構圖樣張](../CompositionReference.md)。有圖時再讀 [ChartSpec.md](../ChartSpec.md)。宣告本次使用的內容模式與視覺方向。

## 內容模式與授權

| 當前請求 | 資料模式 |
|---|---|
| 按提綱排版、保持原文、未授權刪改 | faithful |
| 提煉講稿、把精髓上屏、重組展示、已授權重繪 | editorial，editingBasis 記錄當前授權 |

不為已經授權的工作再次確認。改寫範圍由當前請求決定，模式本身不授予擴大內容、發表或推送的許可權。

源清單先於演示資料，獨立從原稿轉錄，不能由改寫後的 slides 倒推。faithful 核對原文字句、表格與空白；editorial 核對觀點、事實、數值、關係與重要限制，並把完整講述關聯到 notes。僅在備註中保留的來源也要由相應頁面引用。

章節、主張、對照、關係和證據由講述用途確定。兩行主張保持 statement；章節邊界可以獨立成為問題頁；標題和提示句可省略。源節點數不等於最終頁數。模式允許的改寫或續頁，應服務於閱讀與講述，而不是塞進固定模板。

## 構建資料

準備 deck.json：文件元資訊、mode、獨立 sources 清單和帶顯式 role 的 slides。語法見 RenderingSpec；完整可執行示例見 References/CompositionDeck.json。

主題只從明確的視覺意圖選擇。share/talk/course 等普通標籤不改變預設 hacker-dark；只有 theme_hacker 等明確視覺標籤可作後備。舊引數 --hacker/--cyber/-b/-r/-y 在生成輸入時對映到相應 theme。

## 工具契約

    bun Tools/BuildDeck.ts /tmp/deck.json ~/Downloads/演示標題.html
    bun Tools/ValidateDeck.ts ~/Downloads/演示標題.html --json

BuildDeck 從當前模板組裝，使用函式式佔位符替換，內嵌字型並驗證最終檔案。不要另寫 renderer、追加 CSS 或複製舊演示作為新模板。新能力應在技能模板和迴歸樣例中實現；產物只承載資料。

| 意圖 | 工具選項 |
|---|---|
| 顯式淺色 | BuildDeck --theme hacker |
| 深色預設 | 不傳 theme，或 --theme hacker-dark |
| 機器可讀靜態報告 | ValidateDeck --json |
| 校驗真實瀏覽器報告 | ValidateDeck --browser-report /tmp/probe.json |

## 瀏覽器與視覺驗收

使用 Interceptor 隔離 context。把 Tools/ProbeDeck.js 作為主頁面表達式執行；需要驗證視口響應時使用 Interceptor 當前的視口驗證工具。儲存報告後交給 ValidateDeck，報告必須對應同一 buildId。

ProbeDeck 檢查實際 DOM 的角色、主物件、內容、字號、越界、圖形標籤以及翻頁與講稿開關。至少包含一個橫屏投影尺寸和一個手機尺寸。再看整套 25% 縮圖與各類代表頁，按 CompositionReference 判斷主次與節奏；關係圖逐一看標籤與連線。

靜態 PASS 只表明模板、資料和資源符合合同。瀏覽器探針不替代視覺判斷，也不證明具體翻頁筆硬體工作。隔離瀏覽器不可用時保留產物，明確記錄視覺複驗未完成。

## 交付說明

給出最終 HTML 路徑、模式與主題、頁數、內容核對範圍、實際完成的驗證及限制。方向鍵 / Space 翻頁，F 全屏，N 講稿。只交付最終單檔案；中間 JSON、指令碼和截圖留在任務臨時目錄。
