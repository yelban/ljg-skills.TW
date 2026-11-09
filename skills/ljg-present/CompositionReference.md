# 構圖參考

這裡的五類樣張使用同一組構造內容，展示同一種視覺語言怎樣服務不同講述功能。它們是對照依據，不是需要輪流套用的版式配額。

完整資料：[CompositionDeck.json](References/CompositionDeck.json)。復現：

    bun Tools/BuildDeck.ts References/CompositionDeck.json /tmp/composition-reference.html

封面由文件 title 生成；後續五頁依次是章節、巨句、對照、閉環、證據。

## 巨句

![巨句樣張](References/Statement.png)

主張自己承擔標題。兩行仍是同一個判斷，尺寸、停頓和四周空白共同形成焦點；不補同義圖注。

## 對照

![對照樣張](References/Compare.png)

兩邊共享基線、字號和比較維度。分類與說明形成兩級關係，區域性細線承擔分隔；沒有獨立外框或第三個總結塊。

## 關係

![關係樣張](References/Diagram.png)

Unicode 迴路把反饋送回輸入與處理。中文節點自然排版，變數貼近節點。檢查箭頭是否完整、迴路是否閉合、線條是否穿過無關標籤。

## 證據

![證據樣張](References/Evidence.png)

表格承擔資訊結構，頁內主張與證據同軸。只留有用途的橫線，避免逐格邊框和視窗外殼。示例為構造的定性材料，不是現實業務記錄。

## 章節

![章節樣張](References/Chapter.png)

一個新問題獲得停頓。章節定位、主句和空白的比例區別於正文；裝飾圖和長導語都不是必需品。

## 怎樣使用

先按本頁講述功能選擇對應樣張，再檢查主角、閱讀順序、比例和空白。內容不同可以換行、分頁或調整節點位置，但不要把所有頁面重新退化為「標題＋主體＋說明」。

樣張的來源、佈局和指令碼都可由 JSON 與當前模板復現；僅複製截圖或舊 HTML 會丟失可驗證的內容契約。字號與邊界用 ProbeDeck 檢查，視覺關係以實際截圖判斷。
