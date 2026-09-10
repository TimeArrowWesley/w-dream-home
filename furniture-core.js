'use strict';
// Shared data, budget and file-writing logic. No browser or network is required.
((scope)=>{
const PROJECT='w-dream-home-local';
const statuses=['待確認','待報價','已選型','已購買','已含工程','不採用','資料參考'];
const clone=o=>JSON.parse(JSON.stringify(o));
function text(v,label,max=50000){if(typeof v!=='string'||v.length>max)throw Error(label+'格式不正確');return v;}
function validate(d){
 if(!d||d.schemaVersion!==1||d.projectId!==PROJECT)throw Error('這不是 W夢想之家的家具清單檔。');
 if(!Array.isArray(d.rooms)||!d.rooms.length||d.rooms.length>50||!Array.isArray(d.items)||d.items.length>2000||!Array.isArray(d.pending)||d.pending.length>200)throw Error('清單結構不正確。');
 const ids=new Set(),rooms=new Set();
 for(const r of d.rooms){text(r.id,'區域',80);if(!/^[a-z0-9-]+$/.test(r.id)||rooms.has(r.id))throw Error('區域代號重複或不正確');rooms.add(r.id);text(r.name,'區域名稱',100);text(r.notes,'區域備註');text(r.sourceOverview,'匯入區域說明');text(r.modelRoom,'模型區域',80);}
 for(const i of d.items){text(i.id,'品項代號',100);if(ids.has(i.id)||!rooms.has(i.room))throw Error('品項代號重複或區域不存在');ids.add(i.id);for(const k of ['name','brand','specs','priceText','notes','currentNote'])text(i[k],k,k==='priceText'?200:50000);if(!i.name.trim()||!statuses.includes(i.status))throw Error('品項名稱或狀態不正確');for(const k of ['includeInBudget','archived','modelDirty'])if(typeof i[k]!=='boolean')throw Error('品項狀態格式不正確');for(const k of ['modelKeys','modelSearch'])if(!Array.isArray(i[k])||i[k].length>50||i[k].some(v=>typeof v!=='string'||v.length>150))throw Error('模型連結格式不正確');if(i.original!==null&&i.original!==undefined)for(const k of ['name','brand','specs','priceText'])text(i.original[k],'匯入原文');}
 for(const p of d.pending){text(p.id,'選購條件代號',100);if(ids.has(p.id))throw Error('選購條件代號重複');ids.add(p.id);text(p.name,'選購條件名稱',200);text(p.text,'選購條件');}
 text(d.revision,'版本',120);text(d.updatedAt,'更新時間',80);if(!Number.isFinite(Date.parse(d.updatedAt)))throw Error('更新時間不正確');
 if(!d.source||typeof d.source!=='object')throw Error('缺少來源紀錄');
 return clone(d);
}
function parsePrice(raw){
 let s=String(raw||'').trim();
 const lines=s.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(lines.length>1){const parts=lines.map(parsePrice);if(parts.some(p=>['invalid','pending','included'].includes(p.kind)))return {kind:'invalid',min:0,max:0};const min=parts.reduce((s,p)=>s+p.min,0),max=parts.reduce((s,p)=>s+p.max,0);return {kind:min!==max?'range':parts.some(p=>p.kind==='estimate')?'estimate':'recorded',min,max};}
 if(!s||/待|未定/.test(s))return {kind:'pending',min:0,max:0};
 if(/已含|已有|見\s*\d|另見/.test(s))return {kind:'included',min:0,max:0};
 if(/^[—–-]+$/.test(s))return {kind:'pending',min:0,max:0};
 const estimated=/約|估|~|～|–|至/.test(s);
 s=s.replace(/(?:NT\$|NTD|TWD|新[臺台]幣|元|約|估計|預估|含稅|未稅|整組|整列)/gi,'').replace(/[（(][^）)]*[）)]/g,'').replace(/[,，\s]/g,'');
 const number='[+-]?\\d+(?:\\.\\d+)?(?:萬)?',match=s.match(new RegExp('^('+number+')(?:([~～–—至/＋+]|(?<!^)-)('+number+'))?$'));
 if(!match)return {kind:'invalid',min:0,max:0};
 const amount=v=>Number(v.replace('萬',''))*(v.includes('萬')?10000:1),a=amount(match[1]),b=match[3]?amount(match[3]):a;
 if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>1e9||Math.abs(b)>1e9)return {kind:'invalid',min:0,max:0};
 if(match[2]&&'/＋+'.includes(match[2]))return {kind:estimated?'estimate':'recorded',min:a+b,max:a+b};
 return {kind:match[2]?'range':estimated?'estimate':'recorded',min:Math.min(a,b),max:Math.max(a,b)};
}
function budget(items){const b={min:0,max:0,pending:0,included:0,invalid:0,count:0};for(const i of items){if(i.archived||!i.includeInBudget||['不採用','資料參考'].includes(i.status))continue;const p=parsePrice(i.priceText);b.count++;if(p.kind==='pending')b.pending++;else if(p.kind==='included')b.included++;else if(p.kind==='invalid')b.invalid++;else{b.min+=p.min;b.max+=p.max;}}return b;}
function updateItem(data,id,changes){const d=clone(data),i=d.items.find(i=>i.id===id);if(!i)throw Error('找不到品項');const editable=['name','brand','specs','priceText','notes','status','room','includeInBudget','archived'];
 for(const k of editable)if(Object.prototype.hasOwnProperty.call(changes,k)){if(['name','brand','specs','room'].includes(k)&&changes[k]!==i[k]&&(i.modelKeys.length||i.modelSearch.length))i.modelDirty=true;i[k]=changes[k];}
 d.updatedAt=new Date().toISOString();return validate(d);
}
function script(data){return "'use strict';\nwindow.HOME_FURNITURE_DATA="+JSON.stringify(validate(data)).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n';}
function markdown(data){const d=validate(data),lines=['# W夢想之家家具與設備清單','',`更新：${d.updatedAt}`,'','金額為整列金額；原始報價與估價並存，未填項目不當成零元。'];for(const r of d.rooms){lines.push('',`## ${r.name}`,'',r.notes);for(const i of d.items.filter(i=>i.room===r.id&&!i.archived))lines.push('',`### ${i.name}`,`狀態：${i.status}｜金額：${i.priceText||'待填'}｜納入預算：${i.includeInBudget?'是':'否'}`,'',i.brand,'',i.specs,'',i.currentNote,'',i.notes,i.modelDirty?'模型同步：待核對':'');}lines.push('','## 選購條件');for(const p of d.pending)lines.push('',`### ${p.name}`,'',p.text);return lines.join('\n');}
async function readFile(dir,name){try{return await (await dir.getFileHandle(name)).getFile().then(f=>f.text());}catch(e){if(e.name==='NotFoundError')return null;throw e;}}
async function writeFile(dir,name,body){const h=await dir.getFileHandle(name,{create:true}),w=await h.createWritable();try{await w.write(body);await w.close();}catch(e){try{await w.abort();}catch(_){}throw e;}}
async function saveDirectory(dir,data,expectedRevision){
 const d=validate(data);for(const name of ['index.html','equipment-models.js'])if(await readFile(dir,name)===null)throw Error('請選擇同時放有 index.html 與 equipment-models.js 的 3D 專案資料夾。');
 const old=await readFile(dir,'家具清單.json');if(old){const disk=validate(JSON.parse(old));if(disk.revision!==expectedRevision)throw Error('專案清單已被其他視窗更新。請先載入專案檔核對；目前草稿仍保留。');await writeFile(dir,'家具清單.上次儲存.json',old);}
 d.revision='local-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);d.updatedAt=new Date().toISOString();
 // JSON is authoritative; the JS companion also works when opening index.html directly.
 await writeFile(dir,'furniture-data.js',script(d));
 const check=await readFile(dir,'家具清單.json');if(check!==old)throw Error('寫入期間專案清單有新變更，未覆蓋 JSON。草稿與上次儲存檔可用來核對。');
 await writeFile(dir,'家具清單.json',JSON.stringify(d,null,2));return d;
}
const api={PROJECT,statuses,clone,validate,parsePrice,budget,updateItem,script,markdown,readFile,saveDirectory};scope.HOME_FURNITURE_CORE=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
