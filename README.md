# W 夢想之家

目前六版模型、全屋 AI 圖集與家具設備清單的共用專案。舊版逐次修改對照已依業主要求清理；目前配置摘要見[設計現況](設計現況.html)。

- [空間設計](index.html)：3D、室內步行、設備操作及每區五張 AI 圖。
- [六版格局比較](方案比較.html)：現行配置與各版模型入口。
- [全屋 AI 圖集](AI寫實視角.html)：360 圖位、230 張獨立成品，可對照模型取景。
- [家具與設備](家具清單.html)：共用資料與依空間分區的預算圓餅圖。

| 版本 | 配置 | 狀態 |
| --- | --- | --- |
| V0 | 原始格局 | 原案比較 |
| V1 | 圓弧中島、頂天玻璃櫃、獨立收藏室 | 保留候選 |
| V2 | 固定電視、大中島、開放收藏區 | 保留候選 |
| V3 | 固定電視、圓弧中島與頂天玻璃櫃、開放收藏區 | 保留候選 |
| V4 | 旋轉電視、小中島 | 已停用，仍可查看 |
| V5 | 旋轉電視、大中島 | 已停用，仍可查看 |

現行名稱與路徑以 `version-registry.json` 為準。內部 legacy 代號與來源素材舊檔名不可全域改名。首頁預設不代表施工主案已選定。

模型沿用 BI01 霧黑天花／中灰牆、AU01 影音、TW01 無上櫃主牆及 IR01 中島修復；所有工程尺寸、材質產品與五金仍須現場核定。AI 為概念圖，不能當作尺寸證據。

## 本機預覽與維護

在此目錄執行 `python -m http.server 8873 --bind 127.0.0.1`，開啟 `http://127.0.0.1:8873/`。使用其他可用 Python 路徑亦可。停止伺服器後才清理其使用中的 log。

唯一編輯來源為根目錄。家具資料主檔是 `家具清單.json`，修改後執行 `node tools/sync-furniture-seed.cjs`。現行原生 AI、模型 PNG、提示與公開 WebP 位於 `成品圖集/20260914暗色現代工業/`，以 `album-manifest.json` 對照。離線 ZIP 可由 `tools/finalize-home-album.py` 重製，不另保存多版副本。

PF01：材質改為像素一致的 WebP，移除未使用的載入；六版依序延後執行腳本，完成模型與材質初始化後才繪製。靜止、背景及看 AI 圖時沿用停止 3D 繪製機制。

發布由 `.github/publish-files.json` 白名單控制；執行 `python tools/build-site.py --sync-ignore --check` 驗證相依。原始 PDF、私人需求、原生 PNG 與工作檔不發布。Git 提交與 Pages 成功是不同狀態。

常用驗證：`verify-viewer-ui.cjs`、`verify-home-album.cjs`、`verify-budget-chart.cjs`、`verify-render-performance.cjs`、`verify-island-repairs.cjs`（均在 `tools/`）。透過 `HOME_TEST_REPORT_DIR` 將新報告存到本輪資料夾；離線測試不能取代瀏覽器 WebGL 檢視。
