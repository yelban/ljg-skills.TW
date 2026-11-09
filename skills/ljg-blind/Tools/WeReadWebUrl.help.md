# WeReadWebUrl

把微信讀書 API 返回的裸 `bookId`、`chapterUid` 編碼成電腦端可開啟的網頁閱讀器連結。

## 用法

```bash
bun "${HOME}/.agents/skills/ljg-blind/Tools/WeReadWebUrl.ts" <bookId> [chapterUid]
```

- 同時傳 bookId、chapterUid：輸出目標章節網頁連結。
- 只傳 bookId：輸出整本書的網頁閱讀器入口。
- 傳 `--help` 或 `-h`：顯示用法並以退出碼 0 結束。
- 引數為空：退出碼為 1，並列印用法。

## 示例

```bash
bun "${HOME}/.agents/skills/ljg-blind/Tools/WeReadWebUrl.ts" 573976 13
```

輸出：

```text
https://weread.qq.com/web/reader/b2632d7058c218b269e80c0kc51323901dc51ce410c121b
```
