from pathlib import Path
import json,re,html,os
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260924版本重編與V3';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
jobs=read(R/'jobs.json');registry=read(P/'version-registry.json');base='成品圖集/20260914暗色現代工業/'
style=(P/'電視牆統一.html').read_text(encoding='utf8').split('<style>',1)[1].split('</style>',1)[0]
out=['<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>版本重編與新增V3｜VN01</title><style>'+style+'</style><main>',
'<p><a href="提案/南牆電視與圓弧中島/index.html?uiRoom=island">新版V3互動3D</a> · <a href="AI寫實視角.html?version=v3&room=island&revision=vn01">新版V3五角度AI</a> · <a href="方案比較.html">目前六版比較</a></p>',
'<h1>版本重編與新增 V3</h1><p>VN01｜2026-09-24｜新版V2＝原V4、新版V4＝原V2、新版V5＝原V3。V0／V1不變；原V2仍維持停用，以新版V4收在歷史選單。舊版紀錄、素材檔名與圖像來源編號保留，現行選單及圖集均採新編號。</p>',
'<table><tr><th>新版</th><th>來源</th><th>配置</th></tr>']
for v in registry['versions']:
 basis='新增：原V4底＋V1中島' if v['id']=='v3' else '原'+v['legacy'].upper()
 out.append(f'<tr><td><a href="{v["path"]}">{v["id"].upper()}</a></td><td>{basis}</td><td>{v["name"]}</td></tr>')
out.extend(['</table><h2>V3 的設計差異</h2><p>保留原V4的固定灰石電視牆、靠窗沙發、AU01音響與開放收藏收納，將長中島換成V1圓弧中島，完整帶入頂天雙面玻璃櫃、外弧兩張圓凳與飲水小槽。整屋沿用霧黑天花、中灰牆、灰棕人字木地板。</p>',
'<table><tr><th>影響</th><th>V2（原V4）長中島</th><th>新增V3</th></tr><tr><td>視線與寬敞感</td><td>中島上方完全開放</td><td>玻璃櫃形成垂直分界，能透視但視覺較滿；中島南端留空增加</td></tr><tr><td>使用與收納</td><td>長直操作面、較大備餐槽</td><td>弧形吧檯、雙面展示；小槽只作飲水用途，展示不可抵算封閉雜物收納</td></tr><tr><td>工程費用來源</td><td>直線櫃與石材</td><td>弧形門板、檯面加工、頂天玻璃框架與固定，需另外估價</td></tr></table>',
'<p class="note">模型試配值：圓弧中島最左X404.8至最右X664.8，約260cm；最北Y498.1至最南Y658.3，外包深約160.2cm；檯面高95cm。玻璃櫃本體260×30×H275cm，含把手外包深34cm。不得視為施工核定尺寸；玻璃厚度、固定、開門取物、管線、防水及電器同時開啟仍需現場深化。</p>',
'<p>模型指定抽樣：60cm圓形通行包絡，入口至書房、入口至廚房及兩席使用／外移20cm時的路線通過。這是指定門片與家具狀態的幾何搜尋，不代表所有人體姿態或同時操作均已驗證。</p>',
'<p>全圖集增為360圖位：V0～V5各12空間、每區5角度。新增V3重製19張原生AI；另41張僅在來源模型像素完全相同時共用。</p><h2>新增V3：參考舊AI／來源模型／新AI</h2>'])
for j in jobs:
 out.append('<section><h3>'+html.escape(j['viewKey'])+'</h3><div class="row">')
 for folder,key,label in [('images',j['previousAI'],'修改前參考AI（歷史編號）'),('models',j['key'],'新增V3来源模型'),('images',j['key'],'新增V3原生AI（概念示意）')]:
  u=base+folder+'/'+key+'.webp';out.append(f'<figure><a href="{u}"><img loading="lazy" src="{u}" alt="{j["viewKey"]} {label}"></a><figcaption>{label}</figcaption></figure>')
 out.append('</div></section>')
out.append('<p class="note">AI示意不作尺寸與施工依據；相機、門窗與家具位置以VN01模型為準。圖像中的收藏品外觀為示意。</p></main></html>')
(P/'版本重編與V3.html').write_text(''.join(out).replace('来源','來源'),encoding='utf8',newline='\n')
mf=read(P/'.github/publish-files.json');site={'version-registry.js','version-registry.json','hybrid-arc-island.js','hybrid-arc-adjustments.js','版本重編與V3.html','提案/南牆電視與圓弧中島/index.html','提案/南牆電視與圓弧中島/layout-version.js'}
for j in jobs:
 for folder in ['images','models','thumbs']:site.add(base+folder+'/'+j['key']+'.webp')
assert all((P/x).exists() for x in site)
mf['site']=list(dict.fromkeys(mf['site']+sorted(site)));mf['repositoryOnly']=list(dict.fromkeys(mf['repositoryOnly']+[f'tools/{n}' for n in ['capture-hybrid-version.cjs','verify-hybrid-version.cjs','install-hybrid-version.py','publish-hybrid-version.py']]))
# Date-stamped historical articles retain old labels, but their links to the current album must target the corresponding new version.
historical=[s for s in mf['site'] if s.endswith('.html') and (s.startswith('調整紀錄/') or s in ['影音統一.html','電視牆統一.html','霧黑工業全屋.html','灰石全屋設計.html','全版本複核.html','提案/開放大中島/方案說明.html','提案/拆收藏室替代方案/index.html'])]
for name in historical:
 p=P/name;s=p.read_text(encoding='utf8')
 if 'data-vn01-history' in s:continue
 link=os.path.relpath(P/'版本重編與V3.html',p.parent).replace('\\','/')
 banner=f'<aside data-vn01-history style="padding:14px;background:#28383a;color:#eef4f1;font:14px/1.7 sans-serif">歷史紀錄：本頁使用2026-09-24重編前的版本編號。原V4→目前V2、原V2→目前V4、原V3→目前V5；目前V3為新增圓弧中島版。<a style="color:#c5dfd3" href="{link}">查看目前版本對照</a>。</aside>'
 s=re.sub(r'(<body[^>]*>)',lambda m:m[1]+banner,s,count=1) if '<body' in s else s.replace('<main>','<main>'+banner,1)
 s=re.sub(r'(AI寫實視角\.html\?[^"<>]*?version=)(v[234])',lambda m:m[1]+registry['legacyMap'][m[2]],s)
 p.write_text(s,encoding='utf8',newline='\n')
write(P/'.github/publish-files.json',mf);print(json.dumps({'newAI':len(jobs),'publicAdded':len(site),'historicalPages':len(historical)}))
