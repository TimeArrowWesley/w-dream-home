# W 夢想之家

A1–14F 全屋互動設計：四個可操作配置版本、即時 3D、室內步行、設備控制，以及可編輯的家具規格清單。

[開啟線上設計](https://timearrowwesley.github.io/w-dream-home/) · [版本比較](方案比較.html) · [家具清單](家具清單.html)

## 目前版本

| 版本 | 中央配置 | 玄關 |
| --- | --- | --- |
| V1（原 V2） | 圓弧中島酒吧 | 玄關矮櫃 |
| V2（原 V3） | 旋轉電視+小中島 | 玄關高矮櫃 |
| V3 | 旋轉電視+大中島 300×95×H95 | 90cm玄關矮櫃、側板掛衣 |
| A | 南牆電視+開放長中島 280×110×H95 | 90cm玄關矮櫃、側板掛衣 |

新 V1：`index.html?layout=v1`。新 V2：`提案/旋轉電視與直線中島/index.html?layout=v2`。每個入口只載入自己的保留配置；舊 query 不會切回被移除的玄關形式。`HOME_LAYOUT.isV2` 是舊程式的「矮櫃」幾何旗標，不是現在的公開版本編號。

[V3 旋轉電視+大中島 3D](提案/開放大中島/index.html?layout=v3)沿用 V2 共用功能，另載入小型 `open-island-model.js` 與由圖面產生的 `layout-spec.js`，沒有再複製完整模型與素材。拆除收藏室隔間、保留結構柱與廚房牆；整合中島分艙、玄關掛衣、玻璃展示、影音聲道與共用81品項家具清單。[尺寸說明](提案/開放大中島/方案說明.html) · [模型檢視](提案/開放大中島/模型檢視.html)。

9/11修正：三版步行平面圖解除舊樣式強制隱藏；V3單槽改外框55×45、內槽50×40、深20cm。濕區增加底板、3mm門縫及檯下支撐，展示玻璃門依櫃身高度生成，鞋子落在層板。產品型號尚未指定，清單原品項及V1/V2幾何保留。

驗證：`node tools/verify-open-island.cjs` 比對原 V1/V2 全部網格雜湊，並測試 V3 實際幾何、門片、設備和通道。`node tools/verify-viewer-ui.cjs` 驗證四版 DOM 操作。附圖為 CPU 幾何檢查，不含 GPU 材質與燈光；不代表現場聲學、施工或瀏覽器效能測試。

## A 的3D與 B 的2D方向

[A 南牆電視＋開放長中島／B 展示電視屏風＋橫向中島](提案/拆收藏室替代方案/index.html)。兩案均有全屋及公共區 PNG／SVG、尺寸與平面路線檢查資料，已接至各版的「設計資料」與版本比較頁。A 已建置3D；B仍為討論稿。V1／V2／V3保留。

[A 南牆電視+開放長中島 3D](提案/南牆電視與開放中島/index.html?layout=a)共用既有外殼、私領域、設備與材質，只新增 A 的中島、沙發、固定電視及互動配置。西向酒櫃／掃地機／IH／濕區各自分艙，55×45×深20備餐槽；東側約33×205cm留膝，兩张活動椅預設收起。南端至柱120.1cm，TV中心H100、主座約347cm。A沿用省電按需渲染，不載入中央旋轉電視。

[A 模型檢視](提案/南牆電視與開放中島/模型檢視.html)。`node tools/verify-plan-a.cjs` 比對發布前 V1–V3 網格雜湊，檢查24設備、真開孔、門片、6窗簾、RGB、三條實際步行路線與可收起座椅。書房門外開，路線繞過門片；關門118cm淨距不能當作開門後全程淨距。

重新繪圖：`python -X utf8 tools/build-collection-alternatives.py`。A 中島280×110、柱前120.1；B 中島300×95、柱前90.1。平面尺寸來自現有模型，家具門片開啟、機電及聲學待選案深化。

## 使用

下載後直接開啟 `index.html`，不需安裝套件。首頁預設全戶鳥瞰。

- **空間設計**：左側選房間或平面圖，中央切換 3D、步行與 AI 參考。
- **設備控制**：依房間顯示電視、電動門、收納操作；燈光、RGB 與窗簾統一管理。
- **顯示設定**：視角、剖牆、天花、標籤、日夜與亮度。
- **家具設備**：各版共用清單，編輯規格、價格與備註，定位對應模型。
- **設計資料**：版本差異、材質搭配、修正對照與模型檢查。

步行操作為 WASD 移動、拖曳轉頭、E 開關門、Shift 慢走。AI 圖是設備更新前的材質參考；過時的正反向導覽圖已移除，最新配置以即時模型為準。模型是設計提案，尺寸、承重、機電及設備安裝仍須施工圖與供應商核定。

3D 檢視亦可按住 WASD 連續移動，預設採省電畫質（操作時最多30幀、110萬渲染像素）；右側「顯示設定」可切流暢或精細。三種模式靜止時皆停止繪圖，背景分頁暫停動畫。室內平開門可開到 90 度，遇人暫停後會繼續完成開啟。[本次喇叭動線、中島與開門修正對照](調整紀錄/20260910動線與模型修正/修正對照.html)。

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
| `提案/旋轉電視與直線中島/` | 現V2配置及V3共用模型與旋轉電視 |
| `viewer-ui.js`、`viewer-ui.css` | 各版共用導覽、控制面板及版面 |
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
node tools/verify-navigation-island.cjs
node tools/verify-furniture-catalog.cjs
```

介面 DOM 測試另需 `linkedom` 及其相依套件，透過 `HOME_UI_TEST_MODULES` 指向其 `node_modules` 後執行 `node tools/verify-viewer-ui.cjs`。目前已完成兩版幾何、互動、清單與 DOM 操作檢查；尚未完成真實瀏覽器的外觀及 GPU 渲染驗收。

主浴淋浴組已按業主原平面圖移到浴缸左側南牆（y483、中心x180），混合龍頭、固定座、立桿與頂噴相接；安裝高度為提案。

歷史檢視報告中的 V1–V4 指當時編號，請以目前版本列及本 README 對照。新增圖面以 `python tools/build-open-island-plan.py` 產生，需要 Pillow 與 Microsoft JhengHei 字型。

效能驗證：`node tools/verify-render-performance.cjs` 使用實際場景與動畫迴圈、計數渲染器核對靜止、移動、門片、窗簾、RGB、電視及背景暫停。10秒靜止由600次繪圖降至0，省電移動由600次降至300；這是60Hz模擬下的繪圖呼叫數，不是實機GPU使用率或噪音測量。陰影僅在模型／燈光需要時更新，省電模式略過區域反射探針及全畫面後製。
