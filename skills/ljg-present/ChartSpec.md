# Chart Contract

圖讓關係直接可見。源中有資料、順序或關係才畫；不補數值曲線，不把並列或相關性擅自升級為因果箭頭。

## 表達選擇

| 材料 | 主體 |
|---|---|
| 數量、趨勢、簡單流程、雙向對照 | chart |
| 迴路、分支、非線性節點關係 | diagram：Unicode 連線 + 自然文字標籤 |
| 真程式碼、需逐字元保留的源 ASCII/Unicode | pre |

faithful 的補充圖緊跟原文頁，用 derivedFrom；原文仍保留。使用者授權重繪或演講編排後，可以新圖承載同一關係，以 sourceIds 追蹤原文。表示可以改變，標籤所指、連線方向、數值和結論強度保持有據。

## 原生 chart

    {"role":"chart","sourceIds":["SRC-001"],"chart":{"kind":"compare","title":"兩種工作","items":[{"label":"生成","text":"形成候選"},{"label":"驗證","text":"檢查依據"}]}}

- bar：2–6 個 {label,value}，共用零基線和源單位，可有負值；全零保留零點。
- line：2–6 個 {label,x,value}，x 嚴格遞增、間距真實，縱軸含零；直線連線原始點，不補點、平滑或外推。
- flow：2–4 個 {label,text?}，只表示源文明示的先後；豎屏縱排。
- compare：兩個 {label,text}，共享維度和基線；豎屏按源順序。

公共欄位：非空 title、items、可選 note；最多一個 item 使用 emphasis:true。bar/line 可帶 unit，line 可帶 xLabel/yLabel。數值必須有限，不用字串、null 或補零代表缺失。數字與標籤保持源順序。

## Unicode 關係圖

    {
      "role":"chart",
      "headline":"反饋回到輸入",
      "sourceIds":["SRC-002"],
      "diagram":{
        "columns":25,"rows":7,
        "nodes":[
          {"id":"input","label":"輸入","caption":"x","col":3,"row":1},
          {"id":"result","label":"結果","caption":"f(x)","col":20,"row":1}
        ],
        "edges":[
          {"from":"input","to":"result"},
          {"from":"result","to":"input","via":[[20,5],[3,5]],"label":"反饋","at":[12,5]}
        ]
      }
    }

節點按 id 連線；label 使用自然文字，caption 是就近的可選釋義。col/row 只是佈局錨點，不是資料值。節點不強制加框。

edges 的 from/to 決定語義方向，via 指定路徑拐點。未對齊的相鄰點以水平再垂直的直角路徑連線。label 標註過程，at 可指定位置。共享路徑形成交點，在目標前的可見位置繪製箭頭。

連線層使用 ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ → ← ↑ ↓。文字與線條分層；節點保持自然中文字距，遮讓線條，不把中文拉到兩個字元單元。需要連續對比的圖使用相同 rows/columns、節點錨點和標籤規格。

實際瀏覽器檢查：節點不重疊，迴路閉合，箭頭完整且方向正確，線段連續，標籤和釋義相鄰。路由穿過無關節點時調整 via 或位置。節點太多、說明太長時拆分語義，不能靠小字處理。

## 邊界

一圖一個主要關係，chart/diagram 不與 lines/table/pre 混作多個主體。圖題和輔助說明可以省，但理解圖所需的資訊必須保留。

Unicode 是關係圖的呈現方式，不成為所有頁面的配額或裝飾。資料契約、瀏覽器測量和源文核對分別證明其覆蓋的部分；箭頭是否有來源仍需完整原文審計。
