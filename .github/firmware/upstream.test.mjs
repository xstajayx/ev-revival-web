import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {prepare,releases} from '../../ev-revival-local/integrity.mjs';
const r=releases[0],p=r.parts[0],good=fs.readFileSync('ev-revival-local/'+p.path);
const mock=`export class Transport{constructor(port){this.device={setSignals:async()=>{}}}async disconnect(){}}export class ESPLoader{constructor(){this.chip={CHIP_NAME:window.fixture.chip}}async main(){}async flashId(){}async eraseFlash(){window.fixture.erases++}async writeFlash(options){window.fixture.writes.push(options)}}`;
const result=await build({entryPoints:['.github/firmware/node_modules/esp-web-tools/dist/flash.js'],bundle:true,format:'esm',write:false,plugins:[{name:'mock-serial',setup(b){b.onResolve({filter:/^esptool-js$/},()=>({path:'serial',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:mock,loader:'js'}));}}]});
const {flash}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
for(const scenario of [
 {name:'valid bytes written exactly, no erase by default'},
 {name:'explicit erase only after validation',erase:true},
 {name:'presentation error cannot bypass verification',bad:true,erase:true,statusThrows:true},
 {name:'modified bytes never erased or written',bad:true,erase:true},
 {name:'wrong capacity never erased or written',capacity:2097152,erase:true},
 {name:'wrong chip never erased or written',chip:'ESP32-S3',erase:true},
 {name:'update never erased or written',mode:'update',erase:true}
])test(scenario.name,async()=>{
 const fixture={chip:scenario.chip||'ESP32',erases:0,writes:[]};globalThis.window={fixture,evRevivalPolicy:{status:()=>{if(scenario.statusThrows)throw Error('UI failed')},prepare:async()=>prepare(r,fixture.chip,scenario.capacity||4194304,scenario.mode||'install',true,'https://ev.jworldcreations.com/ev-revival-local/manifest.json',async()=>({ok:true,arrayBuffer:async()=>{const b=Buffer.from(good);if(scenario.bad)b[0]^=1;return b}}))}};
 const states=[];await flash(s=>states.push(s),{},'',{version:r.version,builds:[{chipFamily:'ESP32',parts:r.parts.map(p=>({path:p.path,offset:p.offset}))}]},!!scenario.erase);
 const fails=scenario.bad||scenario.capacity||scenario.chip||scenario.mode;
 assert.equal(fixture.writes.length,fails?0:1);assert.equal(fixture.erases,!fails&&scenario.erase?1:0);
 if(!fails)assert.deepEqual(Buffer.from(fixture.writes[0].fileArray[0].data,'binary'),good);
 else assert.equal(states.at(-1).state,'error');
});
