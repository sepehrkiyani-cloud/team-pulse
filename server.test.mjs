import {test} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {newDb} from 'pg-mem';
const db=newDb();pg.Pool=db.adapters.createPg().Pool;process.env.NODE_ENV='test';
const {handle,init,passwordHash,passwordValid}=await import('./server.mjs');
const pool=new pg.Pool();await init();
await pool.query('INSERT INTO users(id,username,name,password_hash,role) VALUES($1,$2,$3,$4,$5)',['11111111-1111-4111-8111-111111111111','admin','مدیر',passwordHash('test-password-123'),'admin']);
async function call(path,method='GET',body,cookie='',origin='https://team.test'){return handle(new Request('https://team.test'+path,{method,headers:{origin,cookie},...(body?{body:JSON.stringify(body)}:{})}),'local')}
test('password hash uses independent salt and rejects wrong passwords',()=>{const h=passwordHash('correct-password');assert.ok(passwordValid('correct-password',h));assert.ok(!passwordValid('wrong-password',h));assert.notEqual(h,passwordHash('correct-password'))});
test('login, member restrictions, shared tasks, conflicts, password change and logout',async()=>{
assert.equal((await call('/api/tasks')).status,401);
assert.equal((await call('/auth/login','POST',{username:'admin',password:'wrong'})).status,401);
assert.equal((await call('/auth/login','POST',{username:'admin',password:'test-password-123'},'','https://evil.test')).status,403);
const login=await call('/auth/login','POST',{username:'admin',password:'test-password-123'});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.ok(login.headers.get('set-cookie').includes('HttpOnly; Secure; SameSite=Lax'));
assert.equal((await call('/api/users','POST',{username:'member',name:'علی',password:'member-password-123'},cookie)).status,201);
const memberLogin=await call('/auth/login','POST',{username:'member',password:'member-password-123'});const memberCookie=memberLogin.headers.get('set-cookie').split(';')[0];
assert.equal((await call('/api/users','POST',{username:'other',name:'دیگر',password:'test-password-123'},memberCookie)).status,403);
const t=await (await call('/api/tasks','POST',{title:'تسک مشترک',assignee:'علی',followUpOwner:'رضا',projectManager:'مریم',description:'شرح اولیه'},cookie)).json();assert.ok(t.id);
const tasks=await (await call('/api/tasks','GET',null,memberCookie)).json();assert.equal(tasks.tasks.length,1);assert.equal(tasks.tasks[0].followUpOwner,'رضا');assert.equal(tasks.tasks[0].projectManager,'مریم');assert.equal(tasks.user.name,'علی');
const etag=tasks.tasks[0].etag;
assert.equal((await call('/api/tasks/'+t.id,'PATCH',{status:'done',note:'انجام شد',etag},memberCookie)).status,200);
assert.equal((await call('/api/tasks/'+t.id,'PATCH',{status:'blocked',etag},cookie)).status,409);
const updated=await (await call('/api/tasks','GET',null,cookie)).json();assert.equal(updated.tasks[0].status,'done');assert.equal(updated.tasks[0].history[0].by,'علی');assert.equal(updated.tasks[0].description,'شرح اولیه');
assert.equal((await call('/api/tasks/'+t.id,'PATCH',{description:'توضیحات جداگانه\nجزئیات بیشتر',etag:updated.tasks[0].etag},memberCookie)).status,200);
const described=await (await call('/api/tasks','GET',null,cookie)).json();assert.equal(described.tasks[0].description,'توضیحات جداگانه\nجزئیات بیشتر');assert.equal(described.tasks[0].note,'انجام شد');assert.equal(described.tasks[0].status,'done');assert.equal(described.tasks[0].history.length,1);assert.equal(described.tasks[0].descriptions.length,2);assert.equal(described.tasks[0].descriptions[1].text,'شرح اولیه');assert.equal(described.tasks[0].descriptions[0].by,'علی');
assert.equal((await call('/api/tasks/'+t.id,'PATCH',{description:'آخرین توضیح',etag:described.tasks[0].etag},cookie)).status,200);
const listed=await (await call('/api/tasks','GET',null,memberCookie)).json();assert.equal(listed.tasks[0].descriptions.length,3);assert.equal(listed.tasks[0].descriptions[0].text,'آخرین توضیح');assert.equal(listed.tasks[0].note,'انجام شد');
assert.equal((await call('/api/tasks/'+t.id,'PATCH',{description:'   ',etag:listed.tasks[0].etag},cookie)).status,400);
const beforeEdit=await (await call('/api/tasks','GET',null,cookie)).json();
assert.equal((await call('/api/tasks/'+t.id,'PATCH',{title:'تسک ویرایش شده',assignee:'سارا',followUpOwner:'کیان',projectManager:'بهار',etag:beforeEdit.tasks[0].etag},memberCookie)).status,200);
const edited=await (await call('/api/tasks','GET',null,cookie)).json();assert.equal(edited.tasks[0].title,'تسک ویرایش شده');assert.equal(edited.tasks[0].assignee,'سارا');assert.equal(edited.tasks[0].followUpOwner,'کیان');assert.equal(edited.tasks[0].projectManager,'بهار');assert.equal(edited.tasks[0].descriptions.length,3);assert.equal(edited.tasks[0].status,'done');assert.equal((await call('/api/tasks/'+t.id,'PATCH',{title:' ',etag:edited.tasks[0].etag},cookie)).status,400);
const actionAt='2026-11-14T08:30:00.000Z';assert.equal((await call('/api/tasks/'+t.id,'PATCH',{status:'doing',note:'اقدام جدید',actionAt,etag:edited.tasks[0].etag},memberCookie)).status,200);
const timed=await (await call('/api/tasks','GET',null,cookie)).json();assert.equal(timed.tasks[0].actionAt,actionAt);assert.equal(timed.tasks[0].history[0].actionAt,actionAt);assert.equal(timed.tasks[0].descriptions.length,3);assert.equal((await call('/api/tasks/'+t.id,'PATCH',{actionAt:'not-a-date',etag:timed.tasks[0].etag},cookie)).status,400);
assert.equal((await call('/auth/password','POST',{current:'wrong',password:'new-password-123'},memberCookie)).status,403);
assert.equal((await call('/auth/password','POST',{current:'member-password-123',password:'new-password-123'},memberCookie)).status,200);
assert.equal((await call('/auth/logout','POST',{},cookie)).status,200);
assert.equal((await call('/api/tasks','GET',null,cookie)).status,401);
});
test('PWA manifest, icons and service worker are accessible before sign-in',async()=>{
 const r=await call('/manifest.webmanifest');assert.equal(r.status,200);const manifest=await r.json();assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/');for(const icon of manifest.icons){const image=await call(icon.src);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),icon.type);assert.ok((await image.arrayBuffer()).byteLength>100)}
 const sw=await call('/sw.js');assert.equal(sw.headers.get('cache-control'),'no-cache');const text=await sw.text();new Function(text);assert.ok(!text.includes('cache.put'));assert.equal((await call('/api/tasks')).status,401);
});
