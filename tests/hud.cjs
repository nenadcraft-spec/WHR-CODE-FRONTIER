const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=process.env.WHR_TEST_OUTPUT||'/tmp/whr-frontier-v03';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.WHR_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
  await page.route('http://whr.local/**',r=>{const name=new URL(r.request().url()).pathname.slice(1)||'index.html';if(!['index.html','script.js','style.css'].includes(name))return r.fulfill({status:404,body:''});return r.fulfill({contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join(__dirname,'..',name))});});
  await page.goto('http://whr.local/');await page.clock.runFor(50);await page.click('#start');await page.clock.runFor(50);
  const snap=()=>page.evaluate(()=>WHR.snapshot());
  async function clickWorld(x,y,button='left'){const s=await snap();await page.mouse.click(s.view.width/2+(x-s.camera.x)*s.camera.scale,s.view.height/2+(y-s.camera.y)*s.camera.scale,{button});}
  async function selectWorker(){const s=await snap(),w=s.units.find(u=>u.owner===s.active&&u.type==='worker');await clickWorld(w.x,w.y);return w.id;}
  async function open(){await page.click('#hotkeys-open');assert.equal(await page.locator('#hotkeys-dialog').isVisible(),true);}
  async function capture(key){await page.locator('#binding-key').focus();await page.keyboard.press(key);}
  async function bind(key,kind='selection',replace=false){await open();await page.selectOption('#binding-target',kind);await capture(key);if(replace)await page.check('#binding-replace');await page.click('#binding-save');}
  let s=await snap();assert.equal(await page.locator('#battlefield').evaluate(e=>e.getBoundingClientRect().height),1080);assert.ok((await page.locator('.topbar').boundingBox()).height<=40);
  assert.equal(await page.locator('#train-worker').isVisible(),true);assert.equal(await page.locator('#build-relay').isVisible(),false);
  const workerId=await selectWorker();assert.equal(await page.locator('#train-worker').isVisible(),false);assert.equal(await page.locator('#build-relay').isVisible(),true);
  const hudRects=await page.locator('.topbar,.view-controls,.minimap-wrap,.selection-panel,.actions-panel,.helpbar').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
  // These blocks are disjoint at this reference viewport: a sum is a conservative area bound.
  const hudArea=hudRects.reduce((sum,r)=>sum+r.w*r.h,0)/(1920*1080);assert.ok(hudArea<0.2);fs.writeFileSync(path.join(output,'HUD_LAYOUT.json'),JSON.stringify({viewport:{width:1920,height:1080},hudAreaUpperBoundPercent:hudArea*100,rectangles:hudRects},null,2));
  await page.screenshot({path:path.join(output,'WHR_V03_HUD_WORKER.png')});
  // Freeze the simulation, then bind using actual dialog inputs. Editing must never issue a world order.
  await page.locator('#battlefield').focus();await page.keyboard.press('Space');
  s=await snap();const unitBefore=JSON.stringify(s.units),money=s.players[0].code,tick=s.tick;
  await open();await page.clock.runFor(1000);assert.equal((await snap()).tick,tick);await capture('F1');await page.click('#binding-save');
  await page.click('#fit');await page.locator('#battlefield').focus();await page.keyboard.press('F1');s=await snap();let w=s.units.find(u=>u.id===workerId);assert.equal(s.camera.x,w.x);assert.equal(s.camera.y,w.y);assert.deepEqual(s.selected,[workerId]);assert.equal(JSON.stringify(s.units),unitBefore);assert.equal(s.players[0].code,money);
  // A live moving target is looked up on every press, rather than storing its old coordinates.
  await page.keyboard.press('Space');await clickWorld(w.x+90,w.y+30,'right');await page.clock.runFor(1000);await page.keyboard.press('Space');const moving=await snap();w=moving.units.find(u=>u.id===workerId);assert.notEqual(w.x,s.units.find(u=>u.id===workerId).x);
  await page.click('#fit');await page.locator('#battlefield').focus();await page.keyboard.press('F1');s=await snap();assert.equal(s.camera.x,w.x);assert.equal(s.camera.y,w.y);assert.deepEqual(s.units,moving.units);
  // Groups select live members and focus their center.
  await page.click('#home');await selectWorker();s=await snap();const other=s.units.filter(u=>u.owner===0&&u.type==='worker')[1];await page.keyboard.down('Shift');await clickWorld(other.x,other.y);await page.keyboard.up('Shift');const group=(await snap()).selected;assert.equal(group.length,2);await bind('KeyJ','selection',true);await page.click('#fit');await page.keyboard.press('KeyJ');s=await snap();assert.deepEqual(s.selected,group);assert.equal(s.camera.x,group.reduce((n,id)=>n+s.units.find(u=>u.id===id).x,0)/group.length);
  await open();await page.getByRole('button',{name:'Ukloni J',exact:true}).click();await page.click('#hotkeys-close');
  // Location and building targets share freely chosen keys; all requested digit/function keys work once.
  const requested=['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','F2','F3','F4'];
  for(const key of requested){await page.click('#home');const loc=(await snap()).camera;await bind(key,'location');await page.click('#fit');await page.locator('#battlefield').focus();await page.keyboard.press(key);const got=(await snap()).camera;assert.deepEqual(got,loc);}
  assert.equal((await snap()).bindings.length,14);
  await page.click('#home');s=await snap();const b=s.buildings.find(b=>b.id==='base0');await clickWorld(b.x,b.y);
  await open();await page.selectOption('#binding-target','selection');await capture('Digit0');assert.equal(await page.locator('#binding-save').isDisabled(),true);assert.equal(await page.locator('#binding-replace-row').isVisible(),true);await page.check('#binding-replace');await page.click('#binding-save');
  await page.click('#fit');await page.locator('#battlefield').focus();await page.keyboard.press('Digit0');assert.equal((await snap()).camera.x,b.x);
  // Replacing a default command requires confirmation, then must not also produce a unit.
  await bind('KeyW','selection',true);const beforeCommand=await snap();await page.keyboard.press('KeyW');const afterCommand=await snap();assert.equal(afterCommand.players[0].code,beforeCommand.players[0].code);assert.deepEqual(afterCommand.buildings,beforeCommand.buildings);assert.equal(await page.locator('#train-worker kbd').textContent(),'');
  // Input focus captures F1 as a draft without executing the binding; Escape leaves the binding unchanged.
  await open();const beforeFocus=(await snap()).camera;await capture('F1');assert.deepEqual((await snap()).camera,beforeFocus);await page.keyboard.press('Escape');assert.equal(await page.locator('#hotkeys-dialog').isVisible(),false);
  // Remove restores its default accelerator. Reset clears old entity IDs and all camera history bindings.
  await open();await page.getByRole('button',{name:'Ukloni W',exact:true}).click();await page.click('#hotkeys-close');assert.equal(await page.locator('#train-worker kbd').textContent(),'W');
  await page.click('#fit');const fitCamera=(await snap()).camera;await page.locator('#battlefield').focus();await page.keyboard.press('F1');await page.click('#camera-back');assert.deepEqual((await snap()).camera,fitCamera);
  await page.click('#home');await page.screenshot({path:path.join(output,'WHR_V03_HUD_BASE.png')});await open();await capture('Digit5');await capture('ArrowLeft');assert.equal(await page.locator('#binding-save').isDisabled(),true);await page.screenshot({path:path.join(output,'WHR_V03_HOTKEYS.png')});await page.click('#hotkeys-close');
  await page.locator('#battlefield').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('.selection-panel').isVisible(),false);assert.equal(await page.locator('.actions-panel').isVisible(),false);
  await page.click('#fit');await page.screenshot({path:path.join(output,'WHR_V03_MAP.png')});
  for(const size of [{width:1366,height:768},{width:1280,height:720},{width:390,height:844}]){await page.setViewportSize(size);await page.clock.runFor(50);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const rects=await page.locator('.topbar,.view-controls,.minimap-wrap').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));for(const r of rects){assert.ok(r.x>=0&&r.y>=0&&r.right<=size.width&&r.bottom<=size.height);} }
  await page.click('#restart');assert.deepEqual((await snap()).bindings,[]);await page.setViewportSize({width:1440,height:1000});await page.click('#start');await page.clock.runFor(50);assert.equal((await snap()).active,0);
  // A cancelled building cannot resolve to a stale position or another entity.
  await selectWorker();await page.click('#build-relay');await clickWorld(176,448);await bind('KeyQ');await page.click('#cancel-build');const noTargetCamera=(await snap()).camera;await page.locator('#battlefield').focus();await page.keyboard.press('KeyQ');assert.deepEqual((await snap()).camera,noTargetCamera);assert.ok((await page.locator('#notice').textContent()).includes('prazna'));
  // Idle cycling intentionally selects a worker; unlike a camera binding it is a selection action.
  await page.click('#home');const idleId=await selectWorker();await page.locator('#battlefield').focus();await page.keyboard.press('KeyH');await page.click('#idle-worker');s=await snap();assert.deepEqual(s.selected,[idleId]);assert.equal(s.camera.x,s.units.find(u=>u.id===idleId).x);assert.deepEqual(errors,[]);
  console.log('PASS HUD: context, compact full viewport, dialog tick freeze, moving F1 target, all 1–0/F1–F4 keys, location zoom, building rebinding, conflict confirmation, default override/removal, input focus, previous camera, location selection preservation, object selection on recall, no simulation mutation on jump, reset, viewport bounds, no JS errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
