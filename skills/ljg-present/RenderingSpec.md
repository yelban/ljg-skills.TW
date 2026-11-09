# Rendering Spec · 4.8

## 資料入口

Tools/BuildDeck.ts 以資料填入當前 SloganTemplate.html。五個佔位符由工具處理：TITLE、SUBTITLE、THEME、SLIDES_JSON、DECK_META_JSON。採用函式式替換，正文中的美元符號不參與替換語法。

最小完整輸入（JSON）：

    {
      "title":"先核驗，再使用",
      "mode":"faithful",
      "tags":["share"],
      "sources":[
        {"id":"SRC-001","content":{"lines":[{"chunks":[{"t":"生成結果，"}]},{"chunks":[{"t":"工作仍未結束。"}]}]}}
      ],
      "slides":[
        {"role":"statement","sourceIds":["SRC-001"],"lines":[{"chunks":[{"t":"生成結果，"}]},{"chunks":[{"t":"工作仍未結束。"}]}]}
      ]
    }

theme 省略時使用 hacker-dark。editorial 模式同時提供 editingBasis，說明當前使用者允許的提煉、重組或重繪範圍。

## 來源清單

sources 按原稿順序，ID 穩定且唯一。content 是獨立從源轉錄的可呈現內容，使用下方主體與可選文字欄位；可附 kind、raw 等來源記錄。生成者仍需把清單與完整原稿核對，輸出檔案自帶清單不能獨自證明保真。

- faithful：頁面內容與對應源 content 逐欄位一致；首次引用順序與源清單一致。表格不改結構，pre 不改空白。
- editorial：按授權改寫並引用 sourceIds；事實、資料、關係和重要限制回到原稿核驗。原始 content 不隨改寫覆蓋，完整講述進入 notes。
- 每個源至少由一頁引用。多個來源可匯入一頁；未上屏但進入講稿的來源仍要引用。源章節如何保留或整合，由講述意圖明確決定。
- 文件 title 獨立產生封面；僅當首個內容節點文字完全相同且無額外標題或註記時合併。

## 顯式角色

| role | 用途 | 主體 |
|---|---|---|
| identity | 封面，只在開頭 | lines |
| chapter | 新問題、轉折、階段入口 | lines，可選 kicker |
| statement | 一個判斷，允許分行 | lines |
| sequence | 多個同層條目的遞進或並列 | lines |
| quotation | 引文 | lines |
| chart | 比較、數量、趨勢或關係 | chart 或 diagram |
| evidence | 表格、程式碼、源字元塊 | table 或 pre |

每頁恰好一個主體。角色由講述功能選擇，不從 2–4 行或字數推斷。模板保留舊欄位的基礎顯示相容；新構建輸入必須顯式給出 role。

公共可選欄位：

- headline：確有定位用途的標題，不與主張重複。
- kicker：已有章節編號或少量定位資訊。
- caption：輔助說明，重要論點與邊界放入主體。
- notes：完整講稿，僅按 N 展開。
- sourceIds：原始內容引用。
- derivedFrom：補充圖引用，與 sourceIds 互斥；faithful 模式須緊鄰原文頁，editorial 可關聯多處來源。

標題、主體、註記不是固定三段式。巨句可以只有 lines；圖可沒有獨立圖題；證據不需要外框和頁籤。

## 主體格式

    {"lines":[{"indent":0,"chunks":[{"t":"原文"},{"t":"重點","hl":true}]}]}

    {"table":{"header":true,"rows":[["觀察","判斷"],["檔案存在","產物已儲存"]]}}

    {"preTitle":"可選源標題","pre":"source code or original character diagram"}

table.header 依據源表格語義確定，不能無條件把第一行當表頭。真實程式碼和未授權重繪的源圖使用 pre。新關係圖採用結構化 diagram，Unicode 連線與自然文字標籤分開繪製，詳見 ChartSpec。

## 物理續頁

沿源句界或行界分開時，每張續頁保持一個 source ID，並記錄：

    {"sourceParts":[{"id":"SRC-001","index":2,"total":2,"joinBefore":"\n"}]}

續頁連續、編號完整，按 joinBefore 重建原始可見文本。多來源同層列表可以合頁，sources 中各自的 lines 依次連線後應等於該頁 lines。共同含義決定分組，不用統一項數替代語義判斷。

## 可讀性

橫屏邏輯畫布 1920×1080，整體縮放；豎屏獨立單列。有效字號乘舞臺縮放與區域性 fit，SVG 另計 viewBox 縮放。以 1098×648 驗證：

| 內容 | 最低有效字號 |
|---|---|
| 主張 / 章節主句 | 56px；參考樣張通常 80px 以上 |
| 主體文字 / 頁內標題 | 40px |
| 表格 | 30px |
| 圖內關鍵標籤 / 數值 | 26px |
| 輔助註記 | 20px；不能藏關鍵限制 |
| 原始碼 / 字元塊 | 22px；密集塊沿語義邊界續頁 |

手機關鍵文字至少 20px，輔助註記與表格至少 16px。複雜圖保留標籤尺寸並橫向滾動；普通 flow、compare 縱排，趨勢圖使用同一資料的列表。

fit 只做最後微調，小於 0.80 時重新分頁或構圖。ProbeDeck 同時檢查實際子內容，避免外框合規而內部裁切。語義換行與中文尾段保護不增加字元。

## 離線與互動

一個 HTML，字型與許可內嵌，表格、圖表、Unicode 圖和公式無網路依賴。模板沒有任意作者 HTML/JS 注入入口，文字使用 textContent 或受控轉義。

公式只處理閉合的美元分隔符，保留價格字面內容；支援基本上下標和常見運算子，未知命令原樣保留。零動效；resize、字型載入與全屏變化觸發佈局測量。

方向鍵、PageUp/PageDown、Space、Enter、j/k、Home/End、F、N 保留。編輯態、講稿彈層和可滾動圖形不搶翻頁輸入。

## 驗收層次

1. BuildDeck 檢查輸入契約並內嵌資源。
2. ValidateDeck 從最終 HTML 反解析資料，核對源內容、構建指紋、規範模板、離線和零動效。未使用的舊程式碼不能掩蓋替代渲染器。
3. ProbeDeck 在瀏覽器核對實際角色、主物件、文字、字號、邊界和互動；報告繫結 buildId。
4. 截圖對照樣張檢查構圖與節奏。靜態和執行時通過都不能獨自證明審美成立。
