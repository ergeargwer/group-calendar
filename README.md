# 朋友揪團日曆

共用可用日期規劃 app，讓朋友輕鬆標示有空的日期。無需登入，開啟網頁就能用。

## 直接在 GitHub 上使用

網站已部署到 GitHub Pages：

**https://ergeargwer.github.io/group-calendar/**

把這個網址傳給朋友即可一起填。點日期切換自己有沒有空，日曆會自動同步。

- 第一次進入時輸入暱稱
- 點日期標示／取消有空
- 右上角「分享」可複製連結
- 若要開另一團，用 `?g=團名`，例如  
  `https://ergeargwer.github.io/group-calendar/?g=weekend`

## 本機開發

需要 Node.js 與 pnpm。

```bash
pnpm install
cd artifacts/group-calendar
PORT=5173 BASE_PATH=/ pnpm dev
```

瀏覽器開啟 http://localhost:5173/

## 技術說明

前端是 React + Vite 靜態網站，不再需要 Express 或 PostgreSQL。

資料會立刻存在瀏覽器，並同步到共用日曆；GitHub Actions 會把前端建置並發佈到 GitHub Pages。
