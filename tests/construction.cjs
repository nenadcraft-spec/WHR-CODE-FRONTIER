'use strict';
const assert=require('node:assert/strict');
const A=require('../script.js');
const {createGame,step,command,beginBuild,resumeBuild,cancelBuild,placement,supplyCap,purchase,pathfind,cellIndex,RULES}=A;
const live=()=>{const g=createGame();g.running=true;g.players[0].code=1000;return g;};
const run=(g,n)=>{for(let i=0;i<n;i++)step(g);};
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
function build(g,type='barracks',p={x:200,y:440}){const r=beginBuild(g,0,g.units[0].id,type,p);assert.equal(r.error,null);return r.building;}
test('valid build charges once, reserves footprint and requires travel before work',()=>{
 const g=live(),old=g.players[0].code,u=g.units[0],b=build(g);
 assert.equal(g.players[0].code,old-120);assert.equal(b.progress,0);assert.equal(b.completed,false);assert.equal(u.mode,'toBuild');
 assert.equal(g.blocked[cellIndex(b.x,b.y)],1);step(g);assert.equal(b.progress,0);
 assert.match(placement(g,0,'barracks',b,g.units[1].id).error,/Preklapanje/);
});
test('construction completes after 700 work ticks; worker resumes economy',()=>{
 const g=live(),b=build(g),u=g.units[0];let guard=0;while(b.progress===0&&guard++<2000)step(g);
 assert.equal(b.progress,1);run(g,698);assert.equal(b.completed,false);assert.equal(b.progress,699);
 step(g);assert.equal(b.completed,true);assert.equal(b.hp,800);assert.equal(u.jobId,null);assert.ok(['toNode','return'].includes(u.mode));
});
test('stop and pause freeze construction; right-click resume has no extra charge',()=>{
 const g=live(),b=build(g),u=g.units[0];run(g,300);assert.ok(b.progress>0);
 command(g,0,[u.id],'stop');const progress=b.progress,code=g.players[0].code;run(g,100);assert.equal(b.progress,progress);
 assert.equal(resumeBuild(g,0,u.id,b.id),true);assert.equal(g.players[0].code>=code,true);g.paused=true;const before=JSON.stringify(g);run(g,100);assert.equal(JSON.stringify(g),before);g.paused=false;run(g,100);assert.ok(b.progress>progress);
});
test('cancellation refunds 100% before work or 75% after work, only once',()=>{
 const g=live(),b=build(g);assert.equal(g.players[0].code,880);assert.equal(cancelBuild(g,0,b.id),true);assert.equal(g.players[0].code,1000);assert.equal(cancelBuild(g,0,b.id),false);assert.equal(g.blocked[cellIndex(b.x,b.y)],0);
 const c=build(g);run(g,300);assert.ok(c.progress>0);for(const u of g.units)command(g,u.owner,[u.id],'stop');const before=g.players[0].code;
 cancelBuild(g,0,c.id);assert.equal(g.players[0].code,before+90);
});
test('Relej increases capacity only on completion, never beyond T1 cap 20',()=>{
 const g=live(),b=build(g,'relay',{x:176,y:448});assert.equal(supplyCap(g,0),10);run(g,1000);assert.equal(b.completed,true);assert.equal(supplyCap(g,0),15);
 for(const x of [176,224])g.buildings.push({type:'relay',owner:0,completed:true,x,y:500});assert.equal(supplyCap(g,0),20);
});
test('new expansion Centrala accepts production but cannot bypass player worker limit',()=>{
 const g=live(),b=build(g,'base',{x:320,y:960});run(g,2400);assert.equal(b.completed,true);
 assert.equal(purchase(g,0,'worker','base0'),null);assert.equal(purchase(g,0,'worker',b.id),null);assert.match(purchase(g,0,'worker',b.id),/limit/);
 run(g,301);assert.equal(g.units.filter(u=>u.owner===0).length,5);
});
test('forbidden sites, hostile builder, paused state and insufficient funds are rejected without mutation',()=>{
 const g=live();assert.match(placement(g,0,'relay',{x:520,y:520},g.units[0].id).error,/rampu/);
 assert.ok(placement(g,0,'relay',g.nodes[0],g.units[0].id).error);
 assert.ok(placement(g,0,'relay',{x:2200,y:2200},g.units[0].id).error);
 assert.ok(beginBuild(g,1,g.units[3].id,'relay',{x:2200,y:440}).error);
 const before=g.buildings.length;g.players[0].code=0;assert.match(beginBuild(g,0,g.units[0].id,'barracks',{x:200,y:440}).error,/Nedovoljno/);assert.equal(g.buildings.length,before);
 g.paused=true;assert.ok(beginBuild(g,0,g.units[0].id,'relay',{x:200,y:440}).error);
});
test('navigation reroutes around a new foundation without walking into its footprint',()=>{
 const g=live(),mover=g.units[1];command(g,0,[mover.id],'move',{x:200,y:520});const b=build(g);
 run(g,1000);assert.ok(!mover.path.length);for(const u of g.units)assert.equal(g.blocked[cellIndex(u.x,u.y)],0);assert.equal(b.completed,true);
});
test('all twelve camp approaches and four expansions are reachable through map exits',()=>{
 const g=live();for(const c of g.map.camps){const path=pathfind(g.blocked,g.units[c.owner*3],c,true);assert.ok(path&&path.length,'camp '+c.id);}
 for(const e of g.map.expansions){assert.ok(pathfind(g.blocked,g.units[e.owner*3],e,true));}
});
test('four initial economies remain equal after 180 seconds on new geometry',()=>{
 const g=createGame();g.running=true;run(g,3600);assert.deepEqual(g.players.map(p=>p.code),[700,700,700,700]);
});
test('first expansion routes are equal for corresponding starting workers',()=>{
 const g=live(),lengths=g.map.expansions.map(e=>{const u=g.units[e.owner*3],target={x:e.x+(e.owner%2?-8:8),y:e.y+(e.owner<2?8:-8)},p=pathfind(g.blocked,u,target,true);let length=0,last=u;for(const q of p){length+=Math.hypot(q.x-last.x,q.y-last.y);last=q;}return length;});
 assert.ok(Math.max(...lengths)-Math.min(...lengths)<0.000001);
});
console.log(checks+' construction/map checks passed.');
