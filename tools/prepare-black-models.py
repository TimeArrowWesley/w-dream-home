from pathlib import Path
import re
P=Path(__file__).resolve().parents[1]
for file in ['index.html','提案/原始格局/index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html']:
 p=P/file;s=p.read_text(encoding='utf8')
 if 'black-industrial-design.js' not in s:s=s.replace('</body>','<script src="black-industrial-design.js?v=20260923-bi01"></script></body>')
 for asset in ['viewer-ui.js','assets/ai-interiors/catalog.js','ai-views.js']:s=re.sub(re.escape(asset)+r'(?:\?[^"\s]*)?(?=")',asset+'?v=20260923-bi01',s)
 p.write_text(s,encoding='utf8')
for file in ['AGENTS.md','DESIGN_DECISIONS.md']:
 p=P/file;s=p.read_text(encoding='utf8').replace('旧AI','舊AI').replace('旧圖','舊圖');p.write_text(s,encoding='utf8')
print('BI01 loaded after all prior model finish layers in five entries.')
