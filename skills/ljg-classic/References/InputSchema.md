# Input Schema

渲染器讀取 UTF-8 JSON。最小結構：

```json
{
  "book": "道德經",
  "chapter": "第十六章",
  "heroImage": "assets/第十六章-意旨圖.png",
  "heroAlt": "山谷晨霧中，萬物從靜處顯出往復",
  "original": "致虛極，守靜篤。",
  "source": "採用通行本；標點為本次整理",
  "passages": [
    {
      "tokens": [
        {
          "text": "致虛極",
          "note": "盡力使內心虛靜",
          "tone": "word"
        },
        {
          "text": "，",
          "punctuation": true
        },
        {
          "text": "守靜篤",
          "note": "徹底守住清靜",
          "tone": "clause"
        },
        {
          "text": "。",
          "punctuation": true
        }
      ]
    }
  ],
  "interpretation": [
    "這一章先處理人的觀看位置。心被眼前得失佔滿時，人只能跟著變化跑；把心放空並守住安靜，才有機會看見變化重複出現的軌跡。",
    "這裡的虛靜不是發呆，而是暫時不讓自己的慾望搶先替世界下結論。"
  ]
}
```

## 欄位

| 欄位 | 型別 | 要求 |
|---|---|---|
| `book` | string | 必填，非空；顯示在頁首 |
| `chapter` | string | 必填，非空；顯示在書名下 |
| `heroImage` | string | 可選；本地 PNG/JPEG/WebP，絕對路徑或相對 JSON 的路徑；禁止 URL 與 data URI |
| `heroAlt` | string | `heroImage` 存在時必填；一句話說明可見畫面和章節意旨，不重複書名章節 |
| `original` | string | 必填；鎖定底本的完整原文，必須與全部 token 順序拼接完全一致 |
| `source` | string | 可選；顯示在頁尾，不推斷不存在的版本資訊 |
| `passages` | array | 必填，至少一段 |
| `passages[].tokens` | array | 必填，按原文順序排列 |
| `text` | string | 必填，必須保留底本原字 |
| `punctuation` | boolean | 標點設為 true；設為 true 時不要求 note |
| `note` | string | 所有非標點 token 必填 |
| `tone` | enum | 非標點必填：`word`、`clause`、`variant` |
| `pinyin` | string | 可選，只用於必要讀音 |
| `interpretation` | string[] | 必填，至少一段自然中文 |

## 內容不變數

1. 按 token 順序拼接 `text`，必須與 `original` 逐字一致。
2. `punctuation !== true` 的 token 全部有非空 `note` 和合法 `tone`。
3. `interpretation` 不是逐句翻譯列表，而是完整章節解讀。
4. JSON 中不放 HTML；渲染器統一轉義並控制樣式。
5. `heroImage` 與 `heroAlt` 成對出現；圖片在渲染時編碼為 data URL，HTML 不保留本地熱鏈。
6. `interpretation` 不得出現「解讀邊界」；邊界條件寫進自然段，不顯示寫作腳手架。
