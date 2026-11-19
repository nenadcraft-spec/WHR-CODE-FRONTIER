const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const output=process.env.WHR_TEST_OUTPUT||path.join(os.tmpdir(),'whr-frontier-browser');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.WHR_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  await page.route('http://whr.local/**',route=>{const name={'/':'index.html','/index.html':'index.html','/script.js':'script.js','/style.css':'style.css'}[new URL(route.request().url()).pathname];if(!name)return route.fulfill({status:404,body:'Not found'});
   return route.fulfill({status:200,contentType:name.endsWith('js')?'text/javascript':name.endsWith('css')?'text/css':'text/html',body:fs.readFileSync(path.join(__dirname,'..',name))});});
  await page.goto('http://whr.local/');await page.clock.runFor(50);
  const snapshot=()=>page.evaluate(()=>window.WHR.snapshot());
  async function screen(x,y){const s=await snapshot(),r=await page.locator('#battlefield').boundingBox();return{x:r.x+r.width/2+(x-s.camera.x)*s.camera.scale,y:r.y+r.height/2+(y-s.camera.y)*s.camera.scale};}
  async function clickWorld(x,y,button='left'){const p=await screen(x,y);await page.mouse.click(p.x,p.y,{button});}
  async function chooseWorker(){const s=await snapshot(),u=s.units.find(u=>u.owner===s.active&&u.type==='worker');await clickWorld(u.x,u.y);return u.id;}
  await page.click('#start');await page.clock.runFor(50);assert.equal(await page.locator('#welcome').isVisible(),false);
  let s=await snapshot();assert.ok(s.camera.scale>Math.min(s.view.width/(s.world.width+80),s.view.height/(s.world.height+80)));
  await page.click('#train-worker');await page.click('#pause');const before=(await snapshot()).tick;await page.clock.runFor(1000);assert.equal((await snapshot()).tick,before);assert.equal(await page.locator('#train-worker').isDisabled(),true);
  await page.click('#pause');await page.locator('#battlefield').focus();await page.keyboard.press('KeyW');await page.clock.runFor(50);assert.equal((await snapshot()).players[0].queue.length,2);
  await page.keyboard.press('KeyW');assert.ok((await page.locator('#notice').innerText()).includes('limit'));
  await page.click('#restart');await page.click('#start');await page.clock.runFor(50);
  const workerId=await chooseWorker();await page.click('#build-relay');await page.keyboard.press('Escape');assert.equal((await snapshot()).buildMode,null);await page.click('#build-relay');const p=await screen(176,448);await page.mouse.move(p.x,p.y);await page.clock.runFor(50);
  assert.equal((await snapshot()).preview.error,null);await page.mouse.click(p.x,p.y);await page.clock.runFor(50);
  s=await snapshot();let relay=s.buildings.find(b=>b.type==='relay');assert.ok(relay);assert.equal(s.players[0].code,40);assert.equal(s.units.find(u=>u.id===workerId).mode,'toBuild');
  await page.clock.runFor(12000);s=await snapshot();relay=s.buildings.find(b=>b.type==='relay');assert.ok(relay.progress>0&&!relay.completed);
  await page.click('#pause');const progress=(await snapshot()).buildings.find(b=>b.id===relay.id).progress;await page.clock.runFor(1000);assert.equal((await snapshot()).buildings.find(b=>b.id===relay.id).progress,progress);
  await page.click('#pause');await chooseWorker();await page.locator('#battlefield').focus();await page.keyboard.press('KeyH');const stopped=(await snapshot()).buildings.find(b=>b.id===relay.id).progress;await page.clock.runFor(500);assert.equal((await snapshot()).buildings.find(b=>b.id===relay.id).progress,stopped);
  await clickWorld(relay.x,relay.y,'right');await page.clock.runFor(30000);assert.equal((await snapshot()).buildings.find(b=>b.id===relay.id).completed,true);assert.ok((await page.locator('#supply').innerText()).includes('/ 15'));
  await chooseWorker();await page.click('#build-barracks');const bad=await screen(520,520);await page.mouse.move(bad.x,bad.y);await page.clock.runFor(50);assert.ok((await snapshot()).preview.error);
  const money=(await snapshot()).players[0].code;await page.mouse.click(bad.x,bad.y);assert.equal((await snapshot()).players[0].code,money);
  const good=await screen(200,360);await page.mouse.move(good.x,good.y);await page.clock.runFor(50);assert.equal((await snapshot()).preview.error,null);await page.mouse.click(good.x,good.y);await page.clock.runFor(6000);
  assert.ok((await snapshot()).buildings.find(b=>b.type==='barracks'));
  await page.screenshot({path:path.join(output,'WHR_RTS_PROTOTYPE_02_BASE.png')});
  await page.click('#cancel-build');await page.clock.runFor(50);assert.equal((await snapshot()).buildings.some(b=>b.type==='barracks'),false);
  await page.click('#fit');await page.clock.runFor(50);s=await snapshot();assert.equal(s.camera.x,s.world.width/2);assert.equal(s.camera.y,s.world.height/2);await page.screenshot({path:path.join(output,'WHR_RTS_PROTOTYPE_02_MAP.png')});
  await page.click('#restart');await page.selectOption('#player','3');await page.click('#start');await page.clock.runFor(50);assert.equal((await snapshot()).active,3);
  await page.setViewportSize({width:390,height:844});await page.clock.runFor(50);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(output,'WHR_RTS_PROTOTYPE_02_MOBILE.png'),fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS browser: production, pause, home camera, real placement, invalid-site rejection, build progress, stop/resume, completion, capacity, cancellation, full map, reset/P4, mobile width, no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
