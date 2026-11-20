'use strict';
const assert=require('node:assert/strict'),A=require('../script.js');
function scene(){const g=A.createGame();g.running=true;g.units=[];g.neutrals=[];g.nodes=[];g.buildings=[];g.bases=[];g.map.camps=[];g.blocked=new Uint8Array(25600).fill(1);
// Two rooms joined by a single-cell passage, with a side pocket in the middle.
for(let y=22;y<=38;y++)for(let x=12;x<=23;x++)g.blocked[y*160+x]=0;
for(let y=22;y<=38;y++)for(let x=38;x<=50;x++)g.blocked[y*160+x]=0;
for(let x=24;x<38;x++)g.blocked[30*160+x]=0;
for(let y=27;y<30;y++)for(let x=29;x<=31;x++)g.blocked[y*160+x]=0;
return g;}
function unit(g,id,x){const u={id,owner:0,type:'guard',x,y:488,hp:180,mode:'idle',path:[],cargo:0,inventory:[],lastDamage:-10000,level:1,abilityReady:[0,0],cooldown:0,pathRevision:g.navRevision};g.units.push(u);return u;}
const g=scene();for(let y=27;y<30;y++)for(let x=29;x<=31;x++)g.blocked[y*160+x]=1;const a=unit(g,'a',408),b=unit(g,'b',568);A.command(g,0,[a.id],'move',{x:712,y:488});A.command(g,0,[b.id],'move',{x:312,y:488});
for(let i=0;i<1200;i++){A.step(g);for(const u of g.units)assert.ok(A.diskClear(g.blocked,u,A.unitRadius(u)));assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=14.4-1e-6);}
assert.ok(a.x>700&&b.x<324,JSON.stringify(g.units.map(u=>({id:u.id,x:u.x,y:u.y,wait:u.trafficWait}))));console.log('PASS traffic V7: opposite allied orders cross one-cell passage by retreating into a room without overlap or lost goals');
const paused=scene(),pa=unit(paused,'a',408),pb=unit(paused,'b',568);for(let y=27;y<30;y++)for(let x=29;x<=31;x++)paused.blocked[y*160+x]=1;paused.bases=[{owner:0}];A.command(paused,0,[pa.id],'move',{x:712,y:488});A.command(paused,0,[pb.id],'move',{x:312,y:488});for(let i=0;i<80;i++)A.step(paused);assert.ok(pb.trafficYield);paused.paused=true;const before=JSON.stringify(paused);for(let i=0;i<20;i++)A.step(paused);assert.equal(JSON.stringify(paused),before);paused.paused=false;A.command(paused,0,[pb.id],'stop');assert.equal(pb.trafficYield,null);assert.equal(pb.path.length,0);console.log('PASS traffic V7: pause freezes temporary yield, Stop clears it without losing control');
const hostile=scene(),ha=unit(hostile,'a',408),hb=unit(hostile,'b',568);hb.owner=3;A.command(hostile,0,[ha.id],'move',{x:712,y:488});hb.dest={x:312,y:488};hb.path=A.unitPath(hostile,hb,hb.dest,true);hb.mode='move';for(let i=0;i<100;i++)A.step(hostile);assert.ok(!ha.trafficYield&&!hb.trafficYield);console.log('PASS traffic V7: opposing ownership never receives allied yielding privilege');

const idle=scene(),walker=unit(idle,'a',408),blocker=unit(idle,'b',488);idle.bases=[{owner:0}];for(let y=27;y<30;y++)for(let x=29;x<=31;x++)idle.blocked[y*160+x]=1;A.command(idle,0,[walker.id],'move',{x:712,y:488});for(let i=0;i<1200;i++)A.step(idle);assert.ok(walker.x>700);console.log('PASS traffic V7: idle ally yields a passage without moving a Hold unit or stealing its goal');
