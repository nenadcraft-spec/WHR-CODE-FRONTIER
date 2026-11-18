const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const output = process.env.WHR_TEST_OUTPUT || path.join(os.tmpdir(), 'whr-frontier-browser');
fs.mkdirSync(output, {recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.WHR_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://whr.local/**',route=>{
   const file=new URL(route.request().url()).pathname;
   const names={'/':'index.html','/index.html':'index.html','/script.js':'script.js','/style.css':'style.css'};
   const name=names[file]; if(!name)return route.fulfill({status:404,body:'Not found'});
   return route.fulfill({status:200,contentType:name.endsWith('js')?'text/javascript':name.endsWith('css')?'text/css':'text/html',body:fs.readFileSync(path.join(__dirname,'..',name))});
 });
 await page.goto('http://whr.local/');
 await page.locator('#welcome').waitFor();await page.screenshot({path:path.join(output,'WHR_RTS_PROTOTYPE_01_WELCOME.png')});
 await page.click('#start');assert.equal(await page.locator('#welcome').isVisible(),false);
 await page.click('#train-worker');assert.ok((await page.locator('#queue').innerText()).includes('Radnik'));
 await page.click('#pause');const before=await page.evaluate(()=>window.WHR.snapshot().tick);
 await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.WHR.snapshot().tick),before);
 assert.equal(await page.locator('#train-worker').isDisabled(),true);
 await page.click('#pause');await page.locator('#battlefield').focus();
 await page.keyboard.press('KeyW');assert.equal(await page.evaluate(()=>window.WHR.snapshot().players[0].queue.length),2);
 await page.keyboard.press('KeyW');assert.ok((await page.locator('#notice').innerText()).includes('limit'));
 await page.waitForTimeout(8000);
 assert.ok(await page.evaluate(()=>window.WHR.snapshot().players[0].code>0));
 // Select a worker on the actual canvas and issue a movement command.
 const view=await page.locator('#battlefield').boundingBox();
 const u=await page.evaluate(()=>window.WHR.snapshot().units[0]);
 const scale=Math.min(view.width/1700,view.height/1220);
 const point=(x,y)=>({x:view.x+view.width/2+(x-800)*scale,y:view.y+view.height/2+(y-560)*scale});
 const at=point(u.x,u.y);await page.mouse.click(at.x,at.y);
 assert.ok((await page.evaluate(()=>window.WHR.snapshot().selected)).includes(u.id));
 const dest=point(800,560);await page.mouse.click(dest.x,dest.y,{button:'right'});
 await page.waitForTimeout(200);
 assert.equal(await page.evaluate(id=>window.WHR.snapshot().units.find(u=>u.id===id).mode,u.id),'move');
 await page.keyboard.press('KeyG');
 assert.ok(['toNode','return','harvest','waiting'].includes(await page.evaluate(id=>window.WHR.snapshot().units.find(u=>u.id===id).mode,u.id)));
 await page.screenshot({path:path.join(output,'WHR_RTS_PROTOTYPE_01_DESKTOP.png')});
 await page.click('#restart');await page.selectOption('#player','3');await page.click('#start');
 assert.equal(await page.evaluate(()=>window.WHR.snapshot().active),3);assert.equal(await page.locator('#code').innerText(),'100');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:path.join(output,'WHR_RTS_PROTOTYPE_01_MOBILE.png'),fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS browser: startup, production, pause, shortcuts, limit notice, reset, player selection, mobile width, no page errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
