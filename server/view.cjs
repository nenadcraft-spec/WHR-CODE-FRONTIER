'use strict';
const A=require('../script.js');
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o[k]!==undefined).map(k=>[k,structuredClone(o[k])]));
function fog(mask){const bytes=Buffer.alloc(3200);for(let i=0;i<25600;i++)if(mask[i])bytes[i>>3]|=1<<(i&7);return bytes.toString('base64');}
const common=['id','owner','type','x','y','hp','w','h','completed','techLevel','maxHp','campId','returning','recoverUntil','flying','revealedUntil'];
const unitPrivate=['cargo','mode','path','nodeId','work','jobId','dest','pathRevision','inventory','targetId','lastDamage','cooldown','abilityReady','level','xp','shield','shieldUntil','slowUntil','activeOrder','orderQueue','deliveredLoads','orderError','teleportReady','teleportJob','transportedBy','boardingId','trafficWait'];
const buildingPrivate=['queue','progress','duration','builderId','rally','rallyInvalid','detector','detectorJob'];
function view(g,owner,memory=new Map()){
 const can=e=>e.owner===owner||A.visibleTo(g,owner,e),entity=(e,building=false)=>{
  const own=e.owner===owner,v=pick(e,common);v.viewMaxHp=A.maxHp(g,e);
  Object.assign(v,own?pick(e,building?buildingPrivate:unitPrivate):building?{queue:[],progress:e.completed?e.duration:0,duration:e.duration}: {path:[],mode:'idle',inventory:[],abilityReady:[0,0],level:1,xp:0,cargo:0});return v;
 };
 const player=g.players[owner],players=g.players.map((p,o)=>o===owner?{...pick(p,['code','reservedCode','deliveries','tier','research','researchJob','upgrade','hero','heroJob','defeated']),queue:[],visible:fog(p.visible),explored:fog(p.explored)}:{code:0,deliveries:[],queue:[],tier:1,research:{},researchJob:null,upgrade:null,hero:null,heroJob:null,defeated:!!p.defeated,visible:'',explored:''});
 const units=g.units.filter(can).map(u=>entity(u)),buildings=g.buildings.filter(can).map(b=>entity(b,true));
 const nodes=[];for(const n of g.nodes){if(A.visibleTo(g,owner,n)){const v=pick(n,['id','type','owner','field','x','y','remaining']);v.miner=n.owner===owner?n.miner:null;memory.set(n.id,v);}if(memory.has(n.id))nodes.push(structuredClone(memory.get(n.id)));}
 return {tick:g.tick,active:owner,running:g.running,paused:g.paused,players,units,buildings,nodes,neutrals:g.neutrals.filter(can).map(n=>entity(n)),loot:g.loot.filter(can).map(l=>pick(l,['id','type','x','y','owner','unlockAt','items'])),
 camps:g.map.camps.map(c=>({...pick(c,['id','tier','owner','x','y']),seen:c.seen[owner]?{[owner]:structuredClone(c.seen[owner])}:{}})),
 shops:g.map.shops.map(s=>({...pick(s,['id','type','owner','x','y']),stock:A.visibleTo(g,owner,s)?structuredClone(s.stock):{},pending:[]})),
 events:g.events.filter(e=>e.owner===owner).map(e=>pick(e,['tick','type','owner','id','tier','key'])),auras:(g.auras||[]).filter(can).map(a=>pick(a,['owner','x','y','until'])),slowFields:(g.slowFields||[]).filter(can).map(a=>pick(a,['owner','x','y','until'])),match:structuredClone(g.match),controllers:g.controllers.slice(),navRevision:g.navRevision};
}
module.exports={view};
