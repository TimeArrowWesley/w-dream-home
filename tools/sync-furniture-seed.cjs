'use strict';
const fs=require('fs'),path=require('path'),C=require('../furniture-core.js');
const root=path.resolve(__dirname,'..'),data=C.validate(JSON.parse(fs.readFileSync(path.join(root,'家具清單.json'),'utf8')));
fs.writeFileSync(path.join(root,'furniture-data.js'),C.script(data));
console.log(`Synchronized ${data.items.length} catalog items and ${data.pending.length} selection notes from 家具清單.json.`);
