/* KP02: ordered kitchen drawing reconstruction. Unmarked window dimensions remain provisional. */
(()=>{
 const V=window.HOME_VIEWER,T=window.THREE;if(!V||window.HOME_KITCHEN_PLAN)return;
 const M=V.finishContext.materials,finishes=[],removed=[];
 const mat=(hex,metalness=.05,roughness=.65)=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),metalness,roughness});
 const materials={black:mat('#272b2d',.12,.68),silver:mat('#acb1b3',.6,.4),stone:mat('#202224',.05,.83),frame:mat('#42494c',.6,.42),wall:mat('#858986',0,.94)};
 materials.black.envMapIntensity=.16;materials.silver.envMapIntensity=.45;materials.stone.envMapIntensity=.2;
 const root=new T.Group();root.name='KP02 廚具圖校正';V.fittings.add(root);
 function bounds(o){const b=new T.Box3().setFromObject(o);return {x:b.min.x+482.5,y:b.min.z+480,z:b.min.y,w:b.max.x-b.min.x,d:b.max.z-b.min.z,h:b.max.y-b.min.y};}
 function chain(o){let s='';for(let p=o;p;p=p.parent)s+='|'+(p.userData.name||p.name||'');return s;}
 function device(o){for(let p=o;p;p=p.parent)if(p.userData.equipment)return p.userData.equipment.key;return null;}
 function assign(o,m,role){finishes.push([o,m]);o.userData.kp02Role=role;}
 function box(name,x,y,w,d,z,h,m,parent=root){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.copy(V.pos(x+w/2,y+d/2,z+h/2));o.name=name;o.userData={name,kp02:true,desc:'KP02依廚具圖與業主半嵌選型還原；尺寸／五金待生產圖核定。'};o.castShadow=o.receiveShadow=true;parent.add(o);assign(o,m,name);V.registerObject?.(o);return o;}
 V.scene.updateMatrixWorld(true);
 // Remove the old full-height glazed proxy; its extra width/height was never a confirmed site measurement.
 for(let i=V.wallParts.length-1;i>=0;i--){const p=V.wallParts[i],b=bounds(p.m);if(b.x>=-8.1&&b.x+b.w<=.1&&b.y>=641.9&&b.y+b.d<=897.1){removed.push({name:p.m.userData.name||p.m.name,b});V.unregisterObject?.(p.m);p.m.parent.remove(p.m);V.wallParts.splice(i,1);}}
 function wall(name,y,d,z,h,m=materials.wall){const o=box(name,-8,y,8,d,z,h,m,V.architecture);V.wallParts.push({m:o,z,h});return o;}
 wall('KP02 窗側實牆・圖面推估',642,88,0,275);wall('KP02 窗下實牆・圖面推估',730,85,0,122);wall('KP02 窗上實牆・圖面推估',730,85,218,57);wall('KP02 爐後實牆・圖面推估',815,82,0,275);
 for(const [y,d,z,h] of [[730,3,122,96],[812,3,122,96],[733,79,122,3],[733,79,215,3]])wall('KP02 廚房窗框・未標尺寸推估',y,d,z,h,materials.frame);
 const glass=mat('#c5d0d1',.03,.2);glass.transparent=true;glass.opacity=.35;glass.side=T.DoubleSide;glass.depthWrite=false;
 box('KP02 廚房窗玻璃・未標尺寸推估',-5,733,1,79,125,90,glass,V.architecture);
 box('KP02 備餐開放層架銀灰背板',208.4,813.15,1.2,141.85,141.7,36,materials.silver);
 // Water-curtain hood lower body, independent of the short backsplash plate.
 box('KP02 水幕煙機下方集煙背板',1.6,833.15,1.4,90,102.4,59.6,materials.silver);
 for(const z of [126,132,138,144,150,156])box('KP02 水幕背板接縫',3.02,834,.04,88,z,.35,materials.frame);
 for(const z of [80,88]){const h=box('KP02 冰箱48.8cm橫把示意',146.7,756.85,2.3,48.8,z,1.5,materials.silver);let door;V.fittings.traverse(o=>{if((o.userData.name||o.name)==='ICNh5123 外覆門板分割'){const b=bounds(o);if(z>=b.z&&z+1.5<=b.z+b.h)door=o;}});V.scene.updateMatrixWorld(true);door?.attach(h);}
 const items=[];V.fittings.traverse(o=>{if(o.isMesh&&!o.userData.kp02)items.push(o);});
 for(const o of items){const b=bounds(o),n=o.userData.name||o.name||'',c=chain(o),key=device(o);if(b.x<-.1||b.x+b.w>210.2||b.y<492.8||b.y+b.d>955.2)continue;
  if(key){if(key==='dishwasher'&&n==='KP02 半嵌洗碗機外露面板')assign(o,materials.silver,'semi-integrated-fascia');continue;}
  if(o.userData.swingFront)o.userData.swingFront.noPull=true;
  if(o.material.transparent)continue;
  const thin=b.h<3;
  if(/A區308.7cm石材檯面|B區141.85cm檯面/.test(n)||(b.x>=208.8&&b.z>=86.3&&b.z+b.h<=142&&b.d>100))assign(o,materials.stone,'black-laminam');
  else if(/水槽中空|主水槽|78cm雙層水槽/.test(c))assign(o,materials.silver,'sink');
  else if(b.x<66&&b.y>=646&&(b.z+b.h<85||/烘碗機上方/.test(c)))assign(o,materials.black,'A-black');
  else if(b.x>=147&&b.y>=811&&b.z+b.h<=84.1)assign(o,materials.black,'B-base-black');
  else if((b.x>=146.5&&b.y>=751&&b.z>=12)||(/C區/.test(c)&&b.z>=12))assign(o,materials.silver,'BC-silver');
  else if(/BELEGA水幕式|煙機/.test(c)||(b.x<43&&b.y>=833&&b.y+b.d<=924&&b.z>=102))assign(o,materials.silver,'hood');
  if(/Best G-931503 電器收納門/.test(n)){
   assign(o,materials.silver,'appliance-garage');
   box('KP02 電器收納黑操作帶',b.x,b.y+b.d+.06,b.w,.12,b.z+b.h-5,4.5,materials.frame);
   box('KP02 電器收納橫把',b.x+4,b.y+b.d+.15,b.w-8,1.8,b.z+5,1.2,materials.silver);
  }
 }
 // Appliance doors keep their original interactive pivots. Finish overrides follow them.
 function apply(){for(const [o,m] of finishes)o.material=m;V.scene.userData.kitchenKP02={revision:'20261002-kp02',dishwasher:'SMI8ZCS00X semi-integrated',window:'PDF outline estimate, not site-confirmed',aisle:83.5,pdfAisle:85};window.HOME_REALISM?.registerMaterials?.();window.HOME_REALISM?.invalidate?.();}
 window.HOME_KITCHEN_PLAN={root,finishes,materials,removed,apply,bounds,window:{x:-8,y:730,w:8,d:85,z:122,h:96,status:'drawing-proportion estimate'},limits:'No new site measurement; original walls outside the inaccurate kitchen window proxy, room doors, fridge air path and counter front-edge coordinates preserved.'};apply();
})();
