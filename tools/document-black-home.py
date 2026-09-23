from pathlib import Path
import json
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923全版本霧黑工業';A=P/'成品圖集/20260914暗色現代工業'
q=json.loads((R/'quality-progress.json').read_text(encoding='utf8'));jobs=json.loads((R/'jobs.json').read_text(encoding='utf8'))
assert set(q['approved'])=={j['key'] for j in jobs} and not q['pendingFixes']
p=A/'index.html';s=p.read_text(encoding='utf8')
s=s.replace('灰石、灰棕木與光','霧黑天花、灰石與灰棕木')
s=s.replace('細肌理灰石、石墨櫃框，與降低紅棕感的人字木地板。','霧黑天花、中灰牆與石墨櫃面，搭配灰石及低紅棕的人字木地板。')
s=s.replace('2026-09-23：V4沿用R02格局，更新GI01石墨櫃面、槍灰金屬與分區燈光；30張AI重製、30張保留。V2已停止深化，僅保留歷史圖像。','2026-09-23 BI01：五版全屋同步霧黑工業配色，300圖位全部替換為211張獨立原生AI新圖；每區五角度。V4沿用R02格局，V2仍為停止深化的歷史版本。')
s=s.replace('<p class="hint"><a href="../../灰石全屋設計.html">','<p class="hint"><a href="../../霧黑工業全屋.html">BI01 霧黑工業全屋與更新前後對照 ↗</a></p>\n <p class="hint"><a href="../../灰石全屋設計.html">')
s=s.replace('album-data.js?v=20260923-v4gi01','album-data.js?v=20260923-bi01')
p.write_text(s,encoding='utf8')
p=A/'使用說明.md';s=p.read_text(encoding='utf8');first,rest=s.split('## 開啟與瀏覽',1)
history=first[first.index('2026-09-23 GI01:'):] if '2026-09-23 GI01:' in first else first[first.index('2026-09-23 GI01：'):]
history=history[:history.index('更新日期：')]
s='# W 夢想之家｜BI01 霧黑工業・全屋五視角圖集\n\n更新日期：2026-09-23；來源模型與AI圖片修訂BI01。五版300圖位全部使用本輪211張新原生AI；僅來源像素相同共用。V2仍為停用歷史配置。\n\n## 開啟與瀏覽'+rest
s=s.replace('208 張獨立 AI 成品','211 張獨立 AI 成品').replace('## 灰石全屋設計','## 霧黑現代工業設計')
s=s.replace('以淺灰牆、石墨框及灰棕木區分層次','以霧黑天花與樑、中灰牆、深灰門框帶、石墨櫃面及灰棕木區分層次')
s=s.replace('完整說明見網站「灰石全屋設計」','完整說明及本輪前後對照見網站「霧黑工業全屋」')
s=s.replace('GR06 實際模型','BI01 實際模型').replace('所有獨立 AI 均使用內建 image_gen 對相應模型視角逐張製作','所有獨立 AI 均使用內建 image_gen，以上版寫實图與本輪同相機材質模型作雙參照逐張重製'.replace('图','圖'))
s=s.replace('本輪以 GR06 300 圖位為準','本輪以 BI01 300 圖位為準')
s=s.replace('## 以下為歷史更新紀錄','## 以下為歷史更新紀錄\n\n'+history.strip()+'\n')
p.write_text(s,encoding='utf8')
section='''\n\n## 2026-09-23 BI01｜全版本霧黑現代工業（本機完成）

依業主採用黑天花試案的指示，V0～V4全屋採霧黑天花及樑、中灰牆、深灰門框帶與指定石墨櫃面。保留灰石既有位置、低紅棕灰棕人字木地板、各版格局、門窗、收納與設備；V4保留R02配置，V2仍為停止深化的歷史版本。

[BI01設計與300圖位前後對照](霧黑工業全屋.html) · [V4互動3D](提案/南牆電視與開放中島/index.html?uiRoom=living) · [全屋AI圖集](AI寫實視角.html?version=v4&room=living&revision=bi01)

300個來源角度保存，211張獨立原生AI逐張核對並替換全部圖位，僅來源像素完全相同可共用。大圖、縮圖、模型對照及生成修正鏈同步；Git與Pages發布證據另記於本輪發布紀錄。黑天花降低反射光、白色原廠面網更突出，實品色票、照度、配光及工程須現場專業深化。AI不是尺寸或施工證明。以下GI01、R02及GR06內容保留作歷史。
'''
for name in ['README.md','專案交接.md','設計方向.md']:
 p=P/name;s=p.read_text(encoding='utf8');head,tail=s.split('\n',1)
 if name=='設計方向.md':head='# 霧黑天花、灰石與灰棕木｜2026-09-23 BI01'
 p.write_text(head+section+'\n'+tail,encoding='utf8')
note='\n\n2026-09-23 BI01本機完成：五版幾何、設備、灰石及地坪保留核對通過；300來源角度、211張獨立原生AI逐張檢查並同步全300圖位。少數錯誤材質與新增物件已局部重製；V2保持歷史。原圖、提示、逐次修正與對應關係見`調整紀錄/20260923全版本霧黑工業/產圖紀錄.json`。本段不代表Git或Pages已完成，發布證據另記。\n'
for name in ['AGENTS.md','DESIGN_BRIEF.md','DESIGN_DECISIONS.md']:
 p=P/name;s=p.read_text(encoding='utf8');p.write_text(s+note,encoding='utf8')
print('BI01 documents updated after full image review')
