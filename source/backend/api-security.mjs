import assert from 'node:assert/strict';
const base='https://kcmctjcksfcmiccijhdu.supabase.co/rest/v1',headers={apikey:'sb_publishable_u8YA-Er4i4yqrWQhp0Xpcw_giVdAgMg','Content-Type':'application/json'};
async function rpc(n,b){const r=await fetch(`${base}/rpc/${n}`,{method:'POST',headers,body:JSON.stringify(b)});return {status:r.status,data:await r.text().then(t=>t?JSON.parse(t):null)}}
let a=await rpc('rakeeza_auth',{action:'login',phone:'0599999911',password:'integration-local-only'});assert.equal(a.status,200);const token=a.data.token;
let b=await rpc('rakeeza_auth',{action:'login',phone:'0599999912',password:'integration-local-only',profile:{companyName:'شركة اختبار عزل ثانية',crNumber:'9988776656',adminName:'اختبار عزل'}});assert.equal(b.status,200);assert.ok(b.data.token);
const sa=await rpc('rakeeza_snapshot',{token}),sb=await rpc('rakeeza_snapshot',{token:b.data.token});assert.notEqual(sa.data.company.id,sb.data.company.id);assert.ok(sa.data.data.projects.length);assert.equal(sb.data.data.projects,undefined);
const attack=await rpc('rakeeza_save',{token:b.data.token,expected_revision:0,data:sa.data.data,profile:null});assert.notEqual(attack.status,200);
for(const name of ['accounts','companies','sessions','versions']){const r=await fetch(`${base}/${name}?select=*`,{headers});assert.notEqual(r.status,200)}
let r=await fetch(`${base}/accounts?select=*`,{headers:{...headers,'Accept-Profile':'rakeeza_private'}});assert.notEqual(r.status,200);
assert.notEqual((await rpc('rakeeza_snapshot',{token:'forged'})).status,200);
assert.notEqual((await rpc('rakeeza_auth',{action:'register',phone:'0599999913',password:'integration-local-only',profile:{}})).status,200);
assert.notEqual((await rpc('rakeeza_save',{token,expected_revision:null,data:sa.data.data,profile:null})).status,200);
await rpc('rakeeza_logout',{token:b.data.token});assert.notEqual((await rpc('rakeeza_snapshot',{token:b.data.token})).status,200);
console.log('PASS live anon API: isolated companies, cross-company write denied, private tables unavailable, forged/logout token denied, missing profile and null revision denied');
