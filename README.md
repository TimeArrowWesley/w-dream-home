# W 夢想之家

A1–14F 全屋互動設計：四個配置版本、即時 3D、室內步行、設備控制，以及可編輯的家具規格清單。

[開啟線上設計](https://timearrowwesley.github.io/w-dream-home/) · [版本比較](方案比較.html) · [家具清單](家具清單.html)

## 四個版本

| 版本 | 中央配置 | 玄關 |
| --- | --- | --- |
| V1 | 圓弧中島與雙面玻璃展示櫃 | 高矮櫃 |
| V2 | 圓弧中島與雙面玻璃展示櫃 | 矮櫃 |
| V3 | 旋轉電視與直線中島 | 高矮櫃 |
| V4 | 旋轉電視與直線中島 | 矮櫃 |

V1／V2 由根目錄 `index.html?layout=v1`、`index.html?layout=v2` 開啟。V3／V4 由 `提案/旋轉電視與直線中島/index.html?layout=v1`、`index.html?layout=v2` 開啟。介面左上可直接切換版本，並保留目前空間。

## 使用

下載後直接開啟 `index.html`，不需安裝套件。首頁預設全戶鳥瞰。

- **空間設計**：左側選房間或平面圖，中央切換 3D、步行與 AI 參考。
- **設備控制**：依房間顯示電視、電動門、收納操作；燈光、RGB 與窗簾統一管理。
- **顯示設定**：視角、剖牆、天花、標籤、日夜與亮度。
- **家具設備**：四版共用清單，編輯規格、價格與備註，定位對應模型。
- **設計資料**：版本差異、材質搭配、修正對照與模型檢查。

步行操作為 WASD 移動、拖曳轉頭、E 開關門、Shift 慢走。AI 圖與歷史正反向圖是設備更新前參考，最新配置以即時模型為準。模型是設計提案，尺寸、承重、機電及設備安裝仍須施工圖與供應商核定。

## 家具資料與儲存

`家具清單.json` 是家具資料主檔；`furniture-data.js` 是可供離線網頁直接載入的同內容資料。在清單按「儲存到專案」，選取本機專案資料夾，會同時寫回兩個檔案並留下本機備份。瀏覽器草稿不等於 GitHub 已更新；上傳後線上頁面才會取得新版本。

不支援資料夾寫入的瀏覽器，可從「匯入／匯出」下載 JSON 備份。直接編輯 JSON 後請執行：

```sh
node tools/sync-furniture-seed.cjs
```

變更清單規格會標記「模型待同步」，不會自動改變 3D 幾何。

## 程式結構

| 檔案 | 用途 |
| --- | --- |
| `design.js`、`model-data.js` | 原版配置與幾何資料 |
| `提案/旋轉電視與直線中島/` | V3／V4 配置與旋轉電視 |
| `viewer-ui.js`、`viewer-ui.css` | 四版共用導覽、控制面板及版面 |
| `equipment-models.js`、`equipment-controls.js` | 設備尺寸、分艙及互動 |
| `realism.js`、`flooring.js` | 材質、木地板與玄關六角磚 |
| `walk.js`、`interaction.js` | 步行、門片、可開啟櫃門 |
| `rgb-lighting.js`、`curtains.js` | 燈光及窗簾 |
| `furniture-*` | 家具清單與存取 |

## 精簡發布

GitHub 只納入 `.github/publish-files.json` 列出的檔案：網站使用中的程式、圖片與設計資料，以及可重用的編輯／驗證工具。PDF、交接截圖、整理備份、AI 生成底圖、重複材質 PNG、暫存及舊 360 環景均不納入。目前材質 PNG 已完整內嵌在使用中的材質 JS，網站及離線功能皆可使用。

新增公開檔案時，將網站需要的檔案加入 `site`；只供開發的檔案加入 `repositoryOnly`，然後更新忽略規則與檢查：

```sh
python tools/build-site.py --sync-ignore
python tools/build-site.py --check
```

`.gitignore` 由此清單產生，不應直接加入忽略例外。HTML 相對連結會在發布前核對，避免刪除仍被引用的圖面。推送 `main` 會由 GitHub Actions 建立 `_site` 並部署 GitHub Pages；開發工具不放進網站部署包。

## 驗證

```sh
node tools/verify-equipment-revision.cjs
node tools/verify-home-model.cjs
node tools/verify-furniture-catalog.cjs
```

介面 DOM 測試另需 `linkedom` 及其相依套件，透過 `HOME_UI_TEST_MODULES` 指向其 `node_modules` 後執行 `node tools/verify-viewer-ui.cjs`。目前已完成四版幾何、互動、清單與 DOM 操作檢查；尚未完成真實瀏覽器的外觀及 GPU 渲染驗收。
