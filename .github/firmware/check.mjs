import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {releases,validateManifest,verifyBytes} from '../../ev-revival-local/integrity.mjs';
const approved=JSON.parse(fs.readFileSync('ev-revival-local/approved-releases.json'));
assert.deepEqual(approved,releases);
for(const release of approved){
 validateManifest(release);
 for(const part of release.parts){
  const b=fs.readFileSync('ev-revival-local/'+part.path);
  await verifyBytes(part,b);assert.equal(part.offset,0);
  assert.equal(b.readUInt16LE(0x8000),0x50aa,'partition table missing');
  const partitionHash=createHash('sha256').update(b.subarray(0x8000,0x9000)).digest('hex');
  console.log(release.version,part.path,'size',b.length,'SHA-256',part.sha256,'partition table SHA-256',partitionHash);
 }
}
console.log('Approved release bytes match reviewed pins. No release was created or published.');

const pinned=new Set(approved.flatMap(r=>r.parts.map(p=>p.path)));
for(const filename of fs.readdirSync('ev-revival-local/firmware')) {
 if(filename.endsWith('.bin'))assert(pinned.has('firmware/'+filename),'Unapproved firmware file: '+filename);
}
for(const filename of fs.readdirSync('ev-revival-local/downloads'))assert(!/\.(zip|bin|part\d+)$/i.test(filename),'Public release archive is forbidden');
const previous=process.env.FIRMWARE_BASE_REF;
if(previous && !/^0+$/.test(previous)){
 const changed=execFileSync('git',['diff','--name-status',previous,'--','ev-revival-local/firmware'],{encoding:'utf8'});
 for(const line of changed.trim().split('\n').filter(Boolean)) {
  const [status,file]=line.split('\t');
  if(file.endsWith('.bin'))assert(status==='A','Published firmware must never be replaced or deleted: '+line);
 }
}
