'use strict';
const assert = require('node:assert/strict');
const {createGame, step, purchase, command, RULES, pathfind} = require('../script.js');
function live(){const g=createGame();g.running=true;return g;}
function run(g,ticks){for(let i=0;i<ticks;i++)step(g);}
function total(g){return g.players.reduce((s,p)=>s+p.code,0)+g.nodes.reduce((s,n)=>s+n.remaining,0)+g.units.reduce((s,u)=>s+u.cargo,0);}
let checks=0;
function test(name,f){f();checks++;console.log('PASS '+name);}
test('initial state: four equal economies, three workers, finite stock',()=>{
 const g=createGame();assert.equal(g.units.length,12);assert.equal(g.nodes.length,48);
 for(let owner=0;owner<4;owner++){assert.equal(g.players[owner].code,100);assert.equal(g.units.filter(u=>u.owner===owner).length,3);}
 step(g);assert.equal(g.tick,0);
});
test('transport creates income only on delivery and conserves total CODE',()=>{
 const g=live(), before=total(g);run(g,60);assert.equal(g.players[0].code,100);
 run(g,600);assert.ok(g.players[0].code>100);assert.equal(total(g),before);
 for(const n of g.nodes)assert.ok(n.remaining>=0);
});
test('production reserves T1 limit and is sequential; payment exactly once',()=>{
 const g=live();assert.equal(purchase(g,0,'worker'),null);assert.equal(purchase(g,0,'worker'),null);
 assert.match(purchase(g,0,'worker'),/limit/);assert.equal(g.players[0].code,0);
 run(g,299);assert.equal(g.units.filter(u=>u.owner===0).length,3);
 run(g,1);assert.equal(g.units.filter(u=>u.owner===0).length,4);
 run(g,300);assert.equal(g.units.filter(u=>u.owner===0).length,5);
 assert.equal(g.players[0].queue.length,0);assert.match(purchase(g,0,'worker'),/limit/);
});
test('one Scout including reserved production; ownership validation',()=>{
 const g=live();assert.equal(purchase(g,0,'scout'),null);assert.match(purchase(g,0,'scout'),/već/);
 assert.match(purchase(g,1,'worker'),/svojoj/);run(g,400);
 assert.equal(g.units.filter(u=>u.owner===0&&u.type==='scout').length,1);
 assert.match(purchase(g,0,'scout'),/već/);
});
test('pause freezes jobs, harvesting and simulation time',()=>{
 const g=live();purchase(g,0,'worker');run(g,100);g.paused=true;
 const before=JSON.stringify(g);run(g,1200);assert.equal(JSON.stringify(g),before);
 assert.match(purchase(g,0,'worker'),/nastavi/);
});
test('partial final load never creates negative stock or duplicate income',()=>{
 const g=live();const owner=0;
 for(const u of g.units.filter(u=>u.owner===owner))command(g,owner,[u.id],'stop');
 for(const n of g.nodes.filter(n=>n.owner===owner))n.remaining=0;
 const n=g.nodes[0];n.remaining=3;
 command(g,owner,[g.units[0].id],'gather',n);const before=total(g);
 run(g,2000);assert.equal(g.players[0].code,103);assert.equal(n.remaining,0);assert.equal(total(g),before);
});
test('stop preserves cargo and releases mining slot, then gather deposits once',()=>{
 const g=live(),u=g.units[0];while(!u.cargo&&g.tick<1000)step(g);assert.ok(u.cargo>0);
 command(g,0,[u.id],'stop');const cargo=u.cargo;run(g,50);assert.equal(u.cargo,cargo);
 command(g,0,[u.id],'gather');run(g,600);assert.equal(u.cargo<=5,true);
 const miners=g.nodes.filter(n=>n.miner===u.id);assert.ok(miners.length<=1);
});
test('pathfinding avoids blocked cells and normalizes forest destination',()=>{
 const g=live();const blocked=g.blocked.findIndex((v,i)=>v&&i>RULES.cols*40);const target={x:(blocked%RULES.cols)*RULES.cell+8,y:Math.floor(blocked/RULES.cols)*RULES.cell+8};
 const path=pathfind(g.blocked,g.units[0],target);assert.ok(path.length>0);
 for(const p of path)assert.equal(g.blocked[Math.floor(p.y/RULES.cell)*RULES.cols+Math.floor(p.x/RULES.cell)],0);
});
test('same tick and command sequence is reproducible',()=>{
 const a=live(),b=live();for(const g of[a,b]){purchase(g,0,'worker');run(g,1000);command(g,0,[g.units[0].id],'stop');run(g,200);}
 assert.equal(JSON.stringify(a),JSON.stringify(b));
});
console.log(checks+' economy/navigation checks passed; tick rate '+RULES.hz+' Hz.');
