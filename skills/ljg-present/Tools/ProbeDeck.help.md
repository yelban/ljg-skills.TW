# ProbeDeck

瀏覽器主頁面中的只讀驗收表達式。它翻閱頁面並測試鍵盤，結束後恢復原頁，不修改演示檔案。

按 Interceptor 當前隔離與視口契約執行 Tools/ProbeDeck.js。需要視口測試時，可將檔案作為其驗證工具的表達式：

    VerifyViewport.ts probe <deck-url> --widths 1098 --height 648 --expr @<skill-dir>/Tools/ProbeDeck.js

再以 390×844 等手機尺寸執行一次。不要通過手動呼叫佈局函式來冒充 resize/字型載入行為，視口工具應保證頁面渲染生命週期活躍。

報告包含 buildId、視口、每頁角色、主物件、文字核對、有效字號、越界、節點重疊，以及鍵盤和講稿開關結果。原生條形、比較、文字、表格、原始碼和 Unicode 節點按實際 DOM 核對。

    bun Tools/ValidateDeck.ts output.html --browser-report probe.json

ValidateDeck 接受原始報告或視口工具返回的 results 包裝，核對報告所屬的同一構建。一次報告只證明記錄的視口、頁面和探針範圍；截圖中的主次、留白、關係正確性與圖形接縫仍需單獨觀察。
