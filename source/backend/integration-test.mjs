import {chromium} from 'playwright';import {spawn,spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
spawnSync('/tmp/pg-local/usr/lib/postgresql/14/bin/pg_ctl',['-D','/tmp/pg-local/data','-o','-p 55432 -k /tmp','-l','/tmp/pg-local/server.log','start']);
spawnSync('psql',['-h','/tmp','-p','55432','-U','sandbox','postgres','-c','truncate rakeeza_private.sessions,rakeeza_private.accounts,rakeeza_private.companies,rakeeza_private.throttle,rakeeza_private.versions cascade']);
const srv=spawn('python3',['/tmp/rakeeza-serve.py']),api=spawn('node',['backend/local-adapter.mjs']);const browser=await chromium.launch({headless:true});
try{
const c1=await browser.newContext(),c2=await browser.newContext({viewport:{width:390,height:844}});let errors=[];
for(const c of [c1,c2]){await c.route('https://kcmctjcksfcmiccijhdu.supabase.co/rest/v1/rpc/*',async route=>{const req=route.request();const out=await fetch('http://127.0.0.1:3092'+new URL(req.url()).pathname,{method:req.method(),headers:{'Content-Type':'application/json'},body:req.postData()});await route.fulfill({status:out.status,contentType:'application/json',body:await out.text()})});c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)))}
await fetch('http://127.0.0.1:3092/not-ready').catch(()=>{});
const p1=await c1.newPage(),p2=await c2.newPage();await p1.goto('http://127.0.0.1:3091');await p1.getByRole('button',{name:'إنشاء حساب شركة'}).click();await p1.getByLabel('اسم الشركة',{exact:true}).fill('شركة اختبار المزامنة');await p1.getByLabel('السجل التجاري (١٠ أرقام)',{exact:true}).fill('9988776655');await p1.getByLabel('اسم المدير',{exact:true}).fill('مدير الاختبار');await p1.getByLabel('رقم الجوال',{exact:true}).fill('0599999911');await p1.getByLabel('كلمة المرور',{exact:true}).fill('integration-local-only');await p1.getByRole('button',{name:'تسجيل الشركة',exact:true}).click();await p1.getByText('متصل بالخادم',{exact:true}).waitFor();
await p1.screenshot({path:'/downloads/rakeeza-local-connected-desktop.png',fullPage:true});
await p2.goto('http://127.0.0.1:3091');await p2.getByLabel('رقم الجوال',{exact:true}).fill('0599999911');await p2.getByLabel('كلمة المرور',{exact:true}).fill('integration-local-only');await p2.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();await p2.getByText('متصل بالخادم',{exact:true}).waitFor();await p2.screenshot({path:'/downloads/rakeeza-local-connected-mobile.png',fullPage:true});
await p1.evaluate(()=>{location.hash='boq'});await p1.waitForTimeout(100);
await p1.getByRole('button',{name:'مشروع جديد',exact:true}).click();
const modal=p1.getByRole('dialog');
console.log('dialog',await modal.innerText());
await modal.locator('input').nth(0).fill('مشروع اختبار جهازين');await modal.locator('input').nth(1).fill('SYNC');await modal.locator('input').nth(2).fill('الرياض');await modal.locator('input').nth(3).fill('مالك الاختبار');await modal.locator('input').nth(4).fill('استشاري الاختبار');await modal.locator('input').nth(5).fill('2026-10-31');await modal.locator('input').nth(6).fill('2027-10-31');await modal.getByRole('button',{name:'إنشاء',exact:true}).click();
await p1.getByRole('status').filter({hasText:'حُفظ على الخادم'}).waitFor();
await p2.getByRole('button',{name:'تحديث من الخادم'}).click();await p2.getByRole('combobox',{name:'اختيار المشروع'}).waitFor();assert.match(await p2.getByRole('combobox',{name:'اختيار المشروع'}).innerText(),/مشروع اختبار جهازين/);
await p1.reload();await p1.getByRole('combobox',{name:'اختيار المشروع'}).first().waitFor();assert.match(await p1.getByRole('combobox',{name:'اختيار المشروع'}).first().innerText(),/مشروع اختبار جهازين/);
assert.equal(await p1.evaluate(()=>Object.keys(localStorage).some(k=>k.includes('accounts:')||k.includes('db:v2'))),false);
await p1.screenshot({path:'/downloads/rakeeza-local-project-desktop.png',fullPage:true});await p2.screenshot({path:'/downloads/rakeeza-local-project-mobile.png',fullPage:false});

console.log('PASS create project on device 1, server save, device 2 sees project, refresh persistence, no local account registry');
// Device 2 still has the old revision. Change company name on device 1, then try a new write on device 2.
await p1.evaluate(()=>{location.hash='company'});await p1.getByRole('heading',{name:/هوية/}).first().waitFor();
await p1.locator('fieldset input').nth(0).fill('شركة اسم جديد');await p1.getByRole('button',{name:'حفظ وتطبيق الهوية'}).click();await p1.getByRole('status').filter({hasText:'حُفظ على الخادم'}).waitFor();
await p2.evaluate(()=>{location.hash='company'});await p2.locator('fieldset input').nth(0).fill('اسم متعارض من جهاز ثان');await p2.getByRole('button',{name:'حفظ وتطبيق الهوية'}).click();await p2.getByRole('heading',{name:'تعذر تأكيد الحفظ'}).waitFor();assert.match(await p2.getByRole('alert').innerText(),/تعارض/);await p2.screenshot({path:'/downloads/rakeeza-local-conflict-mobile.png',fullPage:false});
const downloaded=p2.waitForEvent('download');await p2.getByRole('button',{name:'حفظ نسخة محلية وتحميل الأحدث'}).click();assert.equal((await downloaded).suggestedFilename(),'rakeeza-unsaved.json');await p2.getByRole('heading',{name:'تعذر تأكيد الحفظ'}).waitFor({state:'hidden'});await p2.waitForFunction(()=>document.querySelector('fieldset input')?.value==='شركة اسم جديد');assert.equal(await p2.locator('fieldset input').nth(0).inputValue(),'شركة اسم جديد');
console.log('PASS two-device conflict blocks overwrite, unsaved backup downloads, newest company name recovered');



assert.deepEqual(errors,[]);console.log('PASS company registration and second device login, no JavaScript errors');
}finally{await browser.close();srv.kill();api.kill();spawnSync('/tmp/pg-local/usr/lib/postgresql/14/bin/pg_ctl',['-D','/tmp/pg-local/data','stop'])}
