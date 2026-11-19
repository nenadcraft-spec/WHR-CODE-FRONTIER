/* WHR CODE FRONTIER · 0.3 · HUD and camera-hotkey sandbox. */
(function (root) {
  'use strict';
  const RULES = Object.freeze({ hz: 20, cell: 16, cols: 160, rows: 160, workerCost: 50, scoutCost: 75,
    workerTicks: 300, scoutTicks: 400, harvestTicks: 60, workerSpeed: 48, scoutSpeed: 64,
    cargo: 5, workerLimit: 5, supply: 10, nodeStock: 1000 });
  const WIDTH = RULES.cols * RULES.cell, HEIGHT = RULES.rows * RULES.cell;
  const TEAMS = [{ name: 'CYAN', color: '#71e6e6', x: 320, y: 320 }, { name: 'VIOLET', color: '#c7a0ff', x: 2240, y: 320 },
    { name: 'AMBER', color: '#ecc477', x: 320, y: 2240 }, { name: 'CORAL', color: '#fa8e90', x: 2240, y: 2240 }];
  const BUILDINGS = Object.freeze({
    base: { name: 'WHR Centrala', cost: 300, ticks: 1200, w: 96, h: 96, hp: 1500 },
    barracks: { name: 'Kasarna', cost: 120, ticks: 700, w: 80, h: 64, hp: 800 },
    relay: { name: 'CODE Relej', cost: 60, ticks: 400, w: 32, h: 32, hp: 400 }
  });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const cellIndex = (x, y) => Math.floor(y / RULES.cell) * RULES.cols + Math.floor(x / RULES.cell);
  const cellPoint = i => ({ x: (i % RULES.cols + .5) * RULES.cell, y: (Math.floor(i / RULES.cols) + .5) * RULES.cell });
  const mirror = (p, owner) => ({ x: owner % 2 ? WIDTH - p.x : p.x, y: owner >= 2 ? HEIGHT - p.y : p.y });
  const inside = (p, r, margin = 0) => Math.abs(p.x - r.x) < r.w / 2 + margin && Math.abs(p.y - r.y) < r.h / 2 + margin;
  function footprint(type, p) {
    const d = BUILDINGS[type];
    return { x: Math.floor((p.x - d.w / 2) / 16) * 16 + d.w / 2, y: Math.floor((p.y - d.h / 2) / 16) * 16 + d.h / 2, w: d.w, h: d.h };
  }
  function rectCells(r) {
    const result = [];
    for (let y = Math.floor((r.y - r.h / 2) / 16); y < Math.ceil((r.y + r.h / 2) / 16); y++)
      for (let x = Math.floor((r.x - r.w / 2) / 16); x < Math.ceil((r.x + r.w / 2) / 16); x++)
        if (x >= 0 && y >= 0 && x < RULES.cols && y < RULES.rows) result.push(y * RULES.cols + x);
    return result;
  }
  function makeMap() {
    const terrain = new Uint8Array(RULES.cols * RULES.rows), forest = new Uint8Array(terrain.length), noBuild = new Uint8Array(terrain.length);
    const zones = [], ramps = [], camps = [], shops = [], expansions = [];
    TEAMS.forEach((t, owner) => {
      zones.push({ owner, kind: 'home', ...mirror({x:320,y:320}, owner), w:512,h:512 });
      const natural = mirror({x:320,y:960},owner);
      expansions.push({ owner, ...natural }); zones.push({ owner, kind:'expansion',...natural,w:320,h:320 });
      const localRamps = [{x:544,y:544,w:128,h:128,axis:'diagonal'}, {x:576,y:320,w:96,h:96,axis:'side'}];
      for (const r of localRamps) ramps.push({...r,...mirror(r,owner),owner});
      for(const [tier,p] of [[1,{x:720,y:720}],[2,{x:1040,y:720}],[3,{x:1040,y:1088}]]) camps.push({id:'camp'+owner+'-'+tier, tier, owner,...mirror(p,owner)});
      shops.push({id:'shop'+owner,owner,...mirror({x:720,y:1056},owner)});
    });
    const roads = [
      [[640,640],[1920,640],[1920,1920],[640,1920],[640,640]],
      [[640,1280],[1920,1280]], [[1280,640],[1280,1920]],
      ...TEAMS.map((t,i)=>[[t.x,t.y],[i%2?1920:640,i>=2?1920:640]])
    ];
    function nearSegment(p,a,b,width) {const dx=b[0]-a[0],dy=b[1]-a[1],v=clamp(((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a[0]-v*dx,p.y-a[1]-v*dy)<width;}
    for(let i=0;i<terrain.length;i++) {
      const p=cellPoint(i);
      let tree=false;
      for(let owner=0;owner<4;owner++) {
        const q=mirror(p,owner);
        if(q.x>656&&q.x<1200&&q.y>656&&q.y<1200) tree=true;
        // Plateau cliffs have two explicit navigable exits per corner.
        if(q.x>=64&&q.x<=576&&q.y>=64&&q.y<=576&& (q.x<80||q.x>560||q.y<80||q.y>560)) terrain[i]=1;
        if(inside(q,{x:320,y:192,w:240,h:176})) noBuild[i]=1; // Worker economy corridor.
      }
      const trail = camps.some(c=>distance(p,c)<90)||shops.some(s=>distance(p,s)<78)
        || TEAMS.some((t,owner)=>{const q=mirror(p,owner);return nearSegment(q,[640,960],[1200,960],32)||nearSegment(q,[880,640],[880,1200],32)
          || [[720,720],[1040,720],[1040,1088],[720,1056]].some(target=>nearSegment(q,[880,960],target,32));});
      if(tree&&!trail) forest[i]=terrain[i]=1;
      if(roads.some(route=>route.slice(1).some((b,j)=>nearSegment(p,route[j],b,58)))) noBuild[i]=1;
      if(distance(p,{x:1280,y:1280})<160) noBuild[i]=1;
      if(ramps.some(r=>inside(p,r))) {terrain[i]=forest[i]=0;noBuild[i]=1;}
    }
    return {terrain,forest,noBuild,zones,ramps,camps,shops,expansions,roads};
  }
  function freeCell(blocked,x,y) {
    const start=cellIndex(clamp(x,0,WIDTH-1),clamp(y,0,HEIGHT-1));
    if(!blocked[start])return start;
    const queue=[start],seen=new Set(queue);
    for(let j=0;j<queue.length;j++){const i=queue[j],cx=i%RULES.cols,cy=Math.floor(i/RULES.cols);
      for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=cx+dx,ny=cy+dy,n=ny*RULES.cols+nx;
        if(nx<0||ny<0||nx>=RULES.cols||ny>=RULES.rows||seen.has(n))continue;
        if(!blocked[n])return n;seen.add(n);queue.push(n);
      }
    }return -1;
  }
  function pathfind(blocked,from,to,strict=false) {
    if(!to||!Number.isFinite(to.x)||!Number.isFinite(to.y))return null;
    if(from.x<0||from.y<0||from.x>=WIDTH||from.y>=HEIGHT||strict&&(to.x<0||to.y<0||to.x>=WIDTH||to.y>=HEIGHT))return null;
    const start=cellIndex(from.x,from.y), end=strict?cellIndex(to.x,to.y):freeCell(blocked,to.x,to.y);
    if(start<0||start>=blocked.length||end<0||end>=blocked.length||blocked[start]||blocked[end])return null;
    const g=new Float64Array(blocked.length);g.fill(Infinity);g[start]=0;
    const prev=new Int32Array(blocked.length);prev.fill(-1);const closed=new Uint8Array(blocked.length),heap=[];
    const score=i=>g[i]+Math.hypot(i%RULES.cols-end%RULES.cols,Math.floor(i/RULES.cols)-Math.floor(end/RULES.cols));
    function push(i){let n=heap.length;const item={i,f:score(i)};heap.push(item);while(n>0){const p=(n-1)>>1;if(heap[p].f<=item.f)break;heap[n]=heap[p];n=p;}heap[n]=item;}
    function pop(){const top=heap[0],last=heap.pop();if(heap.length){let n=0;while(n*2+1<heap.length){let c=n*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[n]=heap[c];n=c;}heap[n]=last;}return top.i;}
    push(start);
    while(heap.length){const i=pop();if(closed[i])continue;if(i===end){const out=[];for(let c=end;c!==start;c=prev[c])out.push(cellPoint(c));out.reverse();
        const final=!blocked[cellIndex(clamp(to.x,0,WIDTH-1),clamp(to.y,0,HEIGHT-1))]?{x:clamp(to.x,1,WIDTH-1),y:clamp(to.y,1,HEIGHT-1)}:cellPoint(end);out.push(final);return out;}
      closed[i]=1;const x=i%RULES.cols,y=Math.floor(i/RULES.cols);
      for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=x+dx,ny=y+dy,n=ny*RULES.cols+nx;
        if(nx<0||ny<0||nx>=RULES.cols||ny>=RULES.rows||blocked[n]||closed[n])continue;
        if(dx&&dy&&(blocked[y*RULES.cols+nx]||blocked[ny*RULES.cols+x]))continue;
        const cost=g[i]+(dx&&dy?Math.SQRT2:1);if(cost<g[n]){g[n]=cost;prev[n]=i;push(n);}
      }
    }return null;
  }
  function rebuildNavigation(game){game.blocked=game.map.terrain.slice();for(const b of game.buildings)for(const i of rectCells(b))game.blocked[i]=1;
    for(const n of game.nodes)if(n.remaining>0)for(const i of rectCells({x:n.x,y:n.y,w:16,h:16}))game.blocked[i]=1;game.navRevision++;}
  function makeBuilding(id,owner,type,p,complete=false){const d=BUILDINGS[type];return{id,owner,type,...footprint(type,p),hp:complete?d.hp:1,completed:complete,progress:complete?d.ticks:0,duration:d.ticks,builderId:null,queue:[]};}
  function createGame(active=0){const map=makeMap();const game={tick:0,active,running:false,paused:false,map,blocked:map.terrain.slice(),navRevision:0,players:[],units:[],nodes:[],bases:[],buildings:[],nextId:1};
    TEAMS.forEach((t,owner)=>{const b=makeBuilding('base'+owner,owner,'base',t,true);game.bases.push(b);game.buildings.push(b);game.players.push({code:100,deliveries:[],queue:b.queue});
      const addField=(center,field)=>{for(let n=0;n<6;n++){const dx=(n%3-1)*48,dy=112+Math.floor(n/3)*48;
        game.nodes.push({id:'node'+owner+'-'+field+'-'+n,type:'node',owner,field,x:center.x+(owner%2?-dx:dx),y:center.y+(owner<2?-dy:dy),remaining:RULES.nodeStock,miner:null});}};
      addField(t,'home');addField(map.expansions[owner],'expansion');
    });rebuildNavigation(game);
    TEAMS.forEach((t,owner)=>{for(let n=0;n<3;n++)spawn(game,owner,'worker',game.bases[owner],n);});return game;}
  function exitPoints(b){const out=[];for(let x=b.x-b.w/2-8;x<=b.x+b.w/2+8;x+=16)out.push({x,y:b.y-b.h/2-8},{x,y:b.y+b.h/2+8});
    for(let y=b.y-b.h/2+8;y<=b.y+b.h/2-8;y+=16)out.push({x:b.x-b.w/2-8,y},{x:b.x+b.w/2+8,y});return out;}
  function availableExit(game,b){const toward={x:b.x,y:b.y+(b.owner<2?-112:112)};return exitPoints(b).filter(p=>p.x>0&&p.y>0&&p.x<WIDTH&&p.y<HEIGHT&&!game.blocked[cellIndex(p.x,p.y)]).sort((a,c)=>distance(a,toward)-distance(c,toward))
    .find(p=>!game.units.some(u=>distance(u,p)<14));}
  function spawn(game,owner,type,base=game.bases[owner],initial=-1){let p=initial>=0?{x:base.x+(owner%2?-1:1)*((initial-1)*32+8),y:base.y+(owner<2?-72:72)}:availableExit(game,base);
    if(!p)return null;const u={id:'u'+game.nextId++,type,owner,...p,hp:type==='worker'?80:100,cargo:0,mode:'idle',path:[],nodeId:null,work:0,jobId:null,dest:null,pathRevision:game.navRevision};game.units.push(u);
    if(type==='worker')assignGather(game,u,initial>=0?game.nodes.filter(n=>n.owner===owner&&n.field==='home')[initial]:null);return u;}
  function releaseNode(game,u){const n=game.nodes.find(n=>n.id===u.nodeId);if(n&&n.miner===u.id)n.miner=null;u.work=0;}
  function releaseJob(game,u){if(u.jobId){const b=game.buildings.find(b=>b.id===u.jobId);if(b&&b.builderId===u.id)b.builderId=null;u.jobId=null;}}
  function moveTo(game,u,p,mode,strict=false){const path=pathfind(game.blocked,u,p,strict);u.path=path||[];u.dest=p;u.pathRevision=game.navRevision;u.mode=path?mode:'blocked';u.resumeMode=mode;return !!path;}
  function pickNode(game,u){return game.nodes.filter(n=>n.owner===u.owner&&n.remaining>0).sort((a,b)=>(distance(a,u)+(a.miner?48:0))-(distance(b,u)+(b.miner?48:0)))[0];}
  function returnCargo(game,u){const bases=game.bases.filter(b=>b.owner===u.owner&&b.completed).sort((a,b)=>distance(a,u)-distance(b,u));
    for(const b of bases){const points=exitPoints(b).filter(p=>!game.blocked[cellIndex(p.x,p.y)]).sort((a,b)=>distance(a,u)-distance(b,u));
      for(const p of points){const path=pathfind(game.blocked,u,p,true);if(path){u.path=path;u.dest=p;u.mode='return';u.resumeMode='return';u.pathRevision=game.navRevision;return true;}}}
    u.path=[];u.mode='blocked';u.resumeMode='return';return false;}
  function assignGather(game,u,node=null){if(u.type!=='worker')return false;releaseNode(game,u);releaseJob(game,u);
    node=node&&game.nodes.includes(node)&&node.remaining>0?node:pickNode(game,u);u.nodeId=node?node.id:null;
    if(u.cargo)return returnCargo(game,u);if(!node){u.mode='idle';u.path=[];return false;}
    return moveTo(game,u,{x:node.x+(node.owner%2?-8:8),y:node.y+(node.owner<2?24:-24)},'toNode',true);}
  function command(game,owner,ids,action,target){if(!game.running||game.paused||owner!==game.active)return false;let changed=false;
    for(const u of game.units.filter(u=>u.owner===owner&&ids.includes(u.id))){
      if(action==='gather'&&u.type==='worker'){assignGather(game,u,target);changed=true;}
      if(action==='move'){releaseNode(game,u);releaseJob(game,u);u.nodeId=null;moveTo(game,u,target,'move');changed=true;}
      if(action==='stop'){releaseNode(game,u);releaseJob(game,u);u.path=[];u.dest=null;u.mode='idle';u.nodeId=null;changed=true;}
    }return changed;}
  const supplyCap=(game,owner)=>Math.min(20,10+5*game.buildings.filter(b=>b.owner===owner&&b.type==='relay'&&b.completed).length);
  const orders=(game,owner)=>game.bases.filter(b=>b.owner===owner).flatMap(b=>b.queue);
  function purchase(game,owner,type,baseId='base'+owner){if(!game.running||game.paused)return'Pokreni ili nastavi poligon.';
    if(owner!==game.active)return'Možeš proizvoditi samo u svojoj Centrali.';if(!['worker','scout'].includes(type))return'Nepoznata jedinica.';
    const b=game.bases.find(b=>b.id===baseId&&b.owner===owner&&b.completed);if(!b)return'Izaberi završenu sopstvenu Centralu.';
    const own=game.units.filter(u=>u.owner===owner),reserved=orders(game,owner),count=own.filter(u=>u.type===type).length+reserved.filter(j=>j.type===type).length;
    if(count>=(type==='worker'?5:1))return type==='worker'?'T1 limit: najviše 5 radnika, uključujući naručene.':'Scout je već prisutan ili naručen.';
    if(own.length+reserved.length>=supplyCap(game,owner))return'Nema slobodne populacije.';if(b.queue.length>=5)return'Proizvodni red je pun.';
    const cost=type==='worker'?50:75,duration=type==='worker'?300:400;if(game.players[owner].code<cost)return'Nedovoljno CODE-a.';
    game.players[owner].code-=cost;b.queue.push({type,remaining:duration,duration});return null;}
  function approaches(blocked,r,from){return exitPoints(r).filter(p=>p.x>=0&&p.y>=0&&p.x<WIDTH&&p.y<HEIGHT&&!blocked[cellIndex(p.x,p.y)])
    .sort((a,b)=>distance(a,from)-distance(b,from));}
  function placement(game,owner,type,p,workerId){const d=BUILDINGS[type];if(!d||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return{error:'Nevažeća građevina ili lokacija.'};
    const r=footprint(type,p),cells=rectCells(r);const fail=error=>({error,...r});
    if(r.x-r.w/2<16||r.y-r.h/2<16||r.x+r.w/2>WIDTH-16||r.y+r.h/2>HEIGHT-16)return fail('Van granica mape.');
    const zone=game.map.zones.find(z=>z.owner===owner&&inside({x:r.x-r.w/2,y:r.y-r.h/2},z)&&inside({x:r.x+r.w/2,y:r.y+r.h/2},z));
    if(!zone)return fail('Gradi u svojoj bazi ili označenom proširenju.');
    if(cells.some(i=>game.map.noBuild[i]))return fail('Sačuvaj rampu, glavni put i radnički prolaz.');
    if(cells.some(i=>game.blocked[i]))return fail('Preklapanje sa objektom, CODE-om ili neprohodnim terenom.');
    if(game.map.camps.some(c=>inside(c,r,90))||game.map.shops.some(s=>inside(s,r,65)))return fail('Neutralna lokacija mora ostati slobodna.');
    if(game.units.some(u=>inside(u,r,12)))return fail('Jedinica stoji na gradilištu.');
    const worker=game.units.find(u=>u.id===workerId&&u.owner===owner&&u.type==='worker');if(!worker)return fail('Izaberi svog radnika za gradnju.');
    const blocked=game.blocked.slice();for(const i of cells)blocked[i]=1;
    for(const point of approaches(blocked,r,worker)){const path=pathfind(blocked,worker,point,true);if(path)return{...r,error:null,point,path};}
    return fail('Radnik nema pristup gradilištu.');}
  function beginBuild(game,owner,workerId,type,p){if(!game.running||game.paused)return{error:'Pokreni ili nastavi poligon.'};if(owner!==game.active)return{error:'Nemaš kontrolu nad tom bazom.'};
    const check=placement(game,owner,type,p,workerId);if(check.error)return check;const d=BUILDINGS[type];if(game.players[owner].code<d.cost)return{error:'Nedovoljno CODE-a.'};
    const u=game.units.find(u=>u.id===workerId);releaseNode(game,u);releaseJob(game,u);const b=makeBuilding('building'+game.nextId++,owner,type,check);game.players[owner].code-=d.cost;
    game.buildings.push(b);if(type==='base')game.bases.push(b);b.builderId=u.id;u.jobId=b.id;rebuildNavigation(game);u.path=check.path;u.dest=check.point;u.mode='toBuild';u.pathRevision=game.navRevision;return{building:b,error:null};}
  function resumeBuild(game,owner,workerId,buildingId){if(!game.running||game.paused||owner!==game.active)return false;const u=game.units.find(u=>u.id===workerId&&u.owner===owner&&u.type==='worker'),b=game.buildings.find(b=>b.id===buildingId&&b.owner===owner&&!b.completed);
    if(!u||!b||(b.builderId&&b.builderId!==u.id))return false;
    for(const p of approaches(game.blocked,b,u)){const path=pathfind(game.blocked,u,p,true);if(!path)continue;releaseNode(game,u);releaseJob(game,u);b.builderId=u.id;u.jobId=b.id;u.path=path;u.dest=p;u.mode='toBuild';u.pathRevision=game.navRevision;return true;}return false;}
  function cancelBuild(game,owner,id){if(!game.running||game.paused||owner!==game.active)return false;const b=game.buildings.find(b=>b.id===id&&b.owner===owner&&!b.completed);if(!b)return false;
    const u=game.units.find(u=>u.id===b.builderId);game.players[owner].code+=Math.floor(BUILDINGS[b.type].cost*(b.progress?0.75:1));game.buildings=game.buildings.filter(x=>x!==b);game.bases=game.bases.filter(x=>x!==b);rebuildNavigation(game);
    if(u){u.jobId=null;assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));}return true;}
  function travel(u,speed){let remaining=speed/RULES.hz;while(u.path.length&&remaining>0){const p=u.path[0],d=distance(u,p);if(d<=remaining){u.x=p.x;u.y=p.y;u.path.shift();remaining-=d;}else{u.x+=(p.x-u.x)/d*remaining;u.y+=(p.y-u.y)/d*remaining;remaining=0;}}}
  function step(game){if(!game.running||game.paused)return;game.tick++;
    for(const u of game.units){
      if(u.path.length&&u.pathRevision!==game.navRevision){moveTo(game,u,u.dest,u.mode,true);}
      if(u.mode==='blocked'){if(game.tick%20===0){if(u.jobId)resumeBuild(game,u.owner,u.id,u.jobId);else if(u.cargo)returnCargo(game,u);else if(u.nodeId)assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));else if(u.dest)moveTo(game,u,u.dest,u.resumeMode);}continue;}
      if(u.path.length){travel(u,u.type==='worker'?48:64);continue;}
      if(u.mode==='move')u.mode='idle';
      else if(u.mode==='toBuild'||u.mode==='build'){const b=game.buildings.find(b=>b.id===u.jobId);if(!b||b.completed||b.builderId!==u.id){releaseJob(game,u);u.mode='idle';continue;}
        u.mode='build';b.progress++;b.hp=Math.max(1,Math.round(BUILDINGS[b.type].hp*b.progress/b.duration));if(b.progress>=b.duration){b.completed=true;b.builderId=null;u.jobId=null;assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));}}
      else if(u.mode==='toNode'||u.mode==='waiting'){const n=game.nodes.find(n=>n.id===u.nodeId);if(!n||n.remaining<=0){assignGather(game,u);continue;}if(!n.miner){n.miner=u.id;u.mode='harvest';u.work=0;}else u.mode='waiting';}
      else if(u.mode==='harvest'){const n=game.nodes.find(n=>n.id===u.nodeId);if(!n||n.miner!==u.id||n.remaining<=0){assignGather(game,u);continue;}
        if(++u.work>=60){u.cargo=Math.min(5,n.remaining);n.remaining-=u.cargo;n.miner=null;u.work=0;if(!n.remaining)rebuildNavigation(game);returnCargo(game,u);}}
      else if(u.mode==='return'){if(u.cargo){game.players[u.owner].code+=u.cargo;game.players[u.owner].deliveries.push({tick:game.tick,amount:u.cargo});u.cargo=0;}assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));}
    }
    for(const p of game.players)p.deliveries=p.deliveries.filter(d=>d.tick>game.tick-1200);
    for(const b of game.bases)if(b.completed&&b.queue.length){const j=b.queue[0];if(j.remaining>0)j.remaining--;if(j.remaining<=0&&spawn(game,b.owner,j.type,b))b.queue.shift();}
  }
  const API={RULES,WIDTH,HEIGHT,TEAMS,BUILDINGS,createGame,purchase,command,step,pathfind,assignGather,placement,beginBuild,resumeBuild,cancelBuild,supplyCap,cellIndex,cellPoint,footprint};
  if(typeof module!=='undefined'&&module.exports)module.exports=API;
  if(typeof document==='undefined')return;

  const $=id=>document.getElementById(id),canvas=$('battlefield'),mini=$('minimap'),mctx=mini.getContext('2d');
  let ctx=canvas.getContext('2d'),game=createGame(),selected=['base0'],started=false,camera={x:WIDTH/2,y:HEIGHT/2,scale:1},view={width:1,height:1};
  let pointer=null,mouse={x:0,y:0},orderMarker=null,noticeTimer,lastTime=0,accumulator=0,buildMode=null,preview=null,previewKey='',terrainCache=null;
  const bindings=new Map();let draftKey=null,cameraHistory=[],lastIdle=null;
  const keys=new Set(),modes={idle:'Nezaposlen',move:'Kretanje',toNode:'Ide po CODE',waiting:'Čeka nalazište',harvest:'Skuplja CODE',return:'Nosi CODE',toBuild:'Ide do gradilišta',build:'Gradi',blocked:'Čeka slobodan prolaz'};
  function notify(text){$('notice').textContent=text;$('notice').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('show'),3600);}
  function rememberCamera(){cameraHistory.push({...camera});if(cameraHistory.length>24)cameraHistory.shift();}
  function jumpCamera(target){rememberCamera();camera.x=clamp(target.x,0,WIDTH);camera.y=clamp(target.y,0,HEIGHT);if(target.scale)camera.scale=clamp(target.scale,Math.min(view.width/(WIDTH+80),view.height/(HEIGHT+80)),2);pointer=null;keys.clear();previewKey='';}
  function fit(){rememberCamera();camera.scale=Math.min(view.width/(WIDTH+80),view.height/(HEIGHT+80));camera.x=WIDTH/2;camera.y=HEIGHT/2;}
  function home(){rememberCamera();const b=game.bases[game.active];camera.scale=Math.min(1.5,view.width/900,view.height/760);camera.x=b.x+(b.x<1280?130:-130);camera.y=b.y+(b.y<1280?90:-90);}
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);view.width=r.width;view.height=r.height;canvas.width=r.width*dpr;canvas.height=r.height*dpr;if(!started)fit();}
  function world(x,y){return{x:(x-view.width/2)/camera.scale+camera.x,y:(y-view.height/2)/camera.scale+camera.y};}
  function pos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function zoom(f,p={x:view.width/2,y:view.height/2}){const before=world(p.x,p.y);camera.scale=clamp(camera.scale*f,Math.min(view.width/(WIDTH+80),view.height/(HEIGHT+80)),2);const after=world(p.x,p.y);camera.x+=before.x-after.x;camera.y+=before.y-after.y;}
  function hit(p){return game.units.filter(u=>distance(u,p)<18).sort((a,b)=>distance(a,p)-distance(b,p))[0]||game.buildings.find(b=>inside(p,b))||game.nodes.find(n=>distance(n,p)<21);}
  function endPlacement(){buildMode=null;preview=null;previewKey='';$('build-status').hidden=true;canvas.classList.remove('placing');}
  function chooseBuild(type){const u=game.units.find(u=>selected.includes(u.id)&&u.owner===game.active&&u.type==='worker');if(!started||game.paused||!u)return notify('Izaberi svog radnika i nastavi poligon.');
    buildMode={type,workerId:u.id};previewKey='';canvas.classList.add('placing');notify(BUILDINGS[type].name+': levi klik postavlja, desni klik ili Escape odustaje.');updatePreview();}
  function updatePreview(){if(!buildMode)return;const p=world(mouse.x,mouse.y),r=footprint(buildMode.type,p),key=[r.x,r.y,game.navRevision,Math.floor(game.tick/5),buildMode.workerId].join(':');
    if(key===previewKey)return;previewKey=key;preview=placement(game,game.active,buildMode.type,p,buildMode.workerId);
    const cost=BUILDINGS[buildMode.type].cost;if(!preview.error&&game.players[game.active].code<cost)preview={...preview,error:'Nedovoljno CODE-a.'};
    $('build-status').hidden=false;$('build-status').classList.toggle('invalid',!!preview.error);$('build-status').textContent=BUILDINGS[buildMode.type].name+' · '+cost+' CODE — '+(preview.error||'Lokacija dostupna. Levi klik za gradnju.');}
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{canvas.focus();mouse=pos(e);const p=world(mouse.x,mouse.y);
    if(buildMode){if(e.button===2){endPlacement();return;}if(e.button===0){const result=beginBuild(game,game.active,buildMode.workerId,buildMode.type,p);if(result.error){notify(result.error);previewKey='';return;}selected=[result.building.id];notify(BUILDINGS[result.building.type].name+' naručena. Radnik putuje na gradilište.');endPlacement();updateHUD();}return;}
    if(e.button===2){if(!started||game.paused)return;const object=hit(p),units=game.units.filter(u=>selected.includes(u.id)&&u.owner===game.active);
      if(object&&BUILDINGS[object.type]&&!object.completed){const u=units.find(u=>u.type==='worker');if(!u||!resumeBuild(game,game.active,u.id,object.id))notify('Izaberi svog slobodnog radnika za nastavak gradnje.');else notify('Radnik nastavlja gradnju.');return;}
      units.forEach((u,i)=>{if(object&&object.type==='node'&&u.type==='worker')command(game,game.active,[u.id],'gather',object);else command(game,game.active,[u.id],'move',{x:p.x+(units.length>1?(i%3-1)*20:0),y:p.y+(units.length>1?Math.floor(i/3)*20:0)});});
      if(units.length)orderMarker={...p,until:performance.now()+900};else notify('Izaberi svoju jedinicu za kretanje.');return;}
    if(e.button===0){pointer={start:mouse,end:mouse,shift:e.shiftKey};canvas.setPointerCapture(e.pointerId);}
  });
  canvas.addEventListener('pointermove',e=>{mouse=pos(e);if(pointer)pointer.end=mouse;if(buildMode)updatePreview();});
  canvas.addEventListener('pointerup',e=>{if(!pointer||e.button!==0)return;const a=world(pointer.start.x,pointer.start.y),b=world(pointer.end.x,pointer.end.y);let ids;
    if(distance(pointer.start,pointer.end)>5)ids=game.units.filter(u=>u.owner===game.active&&u.x>=Math.min(a.x,b.x)&&u.x<=Math.max(a.x,b.x)&&u.y>=Math.min(a.y,b.y)&&u.y<=Math.max(a.y,b.y)).map(u=>u.id);
    else{const object=hit(b);ids=object?[object.id]:[];}selected=pointer.shift?[...new Set([...selected,...ids])]:ids;pointer=null;updateHUD();});
  canvas.addEventListener('pointercancel',()=>{pointer=null;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12,pos(e));previewKey='';},{passive:false});
  mini.addEventListener('pointerdown',e=>{const r=mini.getBoundingClientRect();jumpCamera({x:(e.clientX-r.left)/r.width*WIDTH,y:(e.clientY-r.top)/r.height*HEIGHT});canvas.focus();});
  $('home').onclick=home;$('fit').onclick=fit;$('zoom-in').onclick=()=>zoom(1.3);$('zoom-out').onclick=()=>zoom(1/1.3);
  function reset(){endPlacement();bindings.clear();cameraHistory=[];lastIdle=null;game=createGame(Number($('player').value));selected=['base'+game.active];started=false;terrainCache=null;$('welcome').hidden=false;$('pause').disabled=true;$('pause').textContent='Pauza';keys.clear();accumulator=0;orderMarker=null;fit();updateHUD();}
  $('restart').onclick=reset;$('player').onchange=reset;
  $('start').onclick=()=>{game.running=true;started=true;$('welcome').hidden=true;$('pause').disabled=false;home();canvas.focus();notify('Izaberi radnika, pa B za Kasarnu ili R za Relej. Cela mapa je dostupna za test.');updateHUD();};
  function pause(){if(!started)return;game.paused=!game.paused;$('pause').textContent=game.paused?'Nastavi':'Pauza';accumulator=0;endPlacement();updateHUD();}
  $('pause').onclick=pause;
  function train(type){const b=game.bases.find(b=>selected.includes(b.id)&&b.owner===game.active);if(!b)return notify('Izaberi svoju završenu Centralu.');const error=purchase(game,game.active,type,b.id);notify(error||((type==='worker'?'Radnik':'Scout')+' dodat u red.'));updateHUD();}
  $('train-worker').onclick=()=>train('worker');$('train-scout').onclick=()=>train('scout');$('gather').onclick=()=>{command(game,game.active,selected,'gather');updateHUD();};$('stop').onclick=()=>{command(game,game.active,selected,'stop');updateHUD();};
  for(const type of ['base','barracks','relay'])$('build-'+type).onclick=()=>chooseBuild(type);
  $('cancel-build').onclick=()=>{const id=selected.find(id=>game.buildings.some(b=>b.id===id&&!b.completed&&b.owner===game.active));if(id&&cancelBuild(game,game.active,id)){selected=[];notify('Gradnja otkazana. CODE vraćen prema napretku.');updateHUD();}};
  const defaults={Space:'Pauza',KeyW:'Radnik',KeyS:'Scout',KeyG:'Skupljaj',KeyH:'Zaustavi',KeyB:'Kasarna',KeyR:'Relej',KeyC:'Centrala',KeyX:'Otkaži gradnju'};
  const dialog=$('hotkeys-dialog');
  function keyName(code){return code.replace(/^Digit/,'').replace(/^Key/,'').replace(/^Numpad/,'Num ').replace('Space','Space');}
  function bindingName(b){if(b.kind==='location')return 'Lokacija '+Math.round(b.x/16)+', '+Math.round(b.y/16);return b.ids.length>1?'Grupa · '+b.ids.length:b.label;}
  function targetObjects(){return [...game.units,...game.buildings].filter(o=>selected.includes(o.id)&&o.owner===game.active);}
  function refreshBindingEditor(){
    const objects=targetObjects(),isLocation=$('binding-target').value==='location';
    $('binding-target-name').textContent=isLocation?'Sačuvaće se trenutni položaj i zoom kamere.':objects.length?objects.map(o=>BUILDINGS[o.type]?.name||(o.type==='worker'?'Radnik':'Scout')).join(' + '):'Izaberi sopstvenu jedinicu ili zgradu na mapi, pa otvori Hotkeys.';
    const conflict=draftKey&&(bindings.has(draftKey)||defaults[draftKey]);
    $('binding-conflict').textContent=!draftKey?'':conflict?'Zauzeto: '+(bindings.has(draftKey)?bindingName(bindings.get(draftKey)):defaults[draftKey])+'. Potvrdi zamenu.':'Slobodan taster: '+keyName(draftKey);
    $('binding-replace-row').hidden=!conflict;
    $('binding-save').disabled=!draftKey||(!isLocation&&!objects.length)||(!!conflict&&!$('binding-replace').checked);
    $('binding-list').replaceChildren();
    for(const [code,b] of bindings){const li=document.createElement('li'),text=document.createElement('span'),remove=document.createElement('button');text.textContent=keyName(code)+' → '+bindingName(b);remove.type='button';remove.textContent='Ukloni';remove.setAttribute('aria-label','Ukloni '+keyName(code));remove.onclick=()=>{bindings.delete(code);$('binding-replace').checked=false;refreshBindingEditor();updateHUD();};li.append(text,remove);$('binding-list').append(li);}
  }
  $('hotkeys-open').onclick=()=>{if(!started)return;keys.clear();pointer=null;draftKey=null;$('binding-key').value='';$('binding-replace').checked=false;dialog.showModal();refreshBindingEditor();};
  function closeHotkeys(){dialog.close();keys.clear();accumulator=0;lastTime=0;canvas.focus();}
  $('hotkeys-close').onclick=closeHotkeys;
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeHotkeys();});
  $('binding-target').onchange=refreshBindingEditor;$('binding-replace').onchange=refreshBindingEditor;
  $('binding-key').addEventListener('keydown',e=>{if(e.code==='Tab'||e.code==='Escape')return;e.preventDefault();e.stopPropagation();
    if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||!(/^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F([1-9]|1[0-2])|Space|Backspace|Enter|Home|End|PageUp|PageDown|Insert|Delete|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/.test(e.code))){draftKey=null;$('binding-key').value='';$('binding-save').disabled=true;$('binding-replace-row').hidden=true;$('binding-conflict').textContent='Izaberi jedan taster bez modifikatora. Escape, Tab i strelice služe navigaciji.';return;}
    draftKey=e.code;$('binding-key').value=keyName(draftKey);$('binding-replace').checked=false;refreshBindingEditor();});
  $('hotkeys-form').onsubmit=e=>{e.preventDefault();if($('binding-save').disabled)return;const objects=targetObjects();const b=$('binding-target').value==='location'?{kind:'location',x:camera.x,y:camera.y,scale:camera.scale}:{kind:'entities',ids:objects.map(o=>o.id),label:objects.length===1?(BUILDINGS[objects[0].type]?.name||(objects[0].type==='worker'?'Radnik':'Scout')):'Grupa'};
    bindings.set(draftKey,b);notify(keyName(draftKey)+' → '+bindingName(b));closeHotkeys();updateHUD();};
  $('camera-back').onclick=()=>{const previous=cameraHistory.pop();if(previous){Object.assign(camera,previous);pointer=null;keys.clear();previewKey='';}else notify('Nema prethodnog kadra.');canvas.focus();};
  $('idle-worker').onclick=()=>{const idle=game.units.filter(u=>u.owner===game.active&&u.type==='worker'&&u.mode==='idle');if(!idle.length)return;const i=idle.findIndex(u=>u.id===lastIdle),u=idle[(i+1)%idle.length];lastIdle=u.id;selected=[u.id];jumpCamera(u);updateHUD();canvas.focus();};
  function activateBinding(code){const b=bindings.get(code);if(!b)return false;if(b.kind==='location')jumpCamera(b);else{const target=b.ids.map(id=>[...game.units,...game.buildings].find(o=>o.id===id&&o.owner===game.active)).find(Boolean);if(target)jumpCamera(target);else notify('Mapirani objekat više nije dostupan.');}return true;}
  window.addEventListener('keydown',e=>{
    if(dialog.open)return;
    if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.code==='Escape'){e.preventDefault();if(buildMode)endPlacement();else selected=[];updateHUD();return;}
    if(started&&bindings.has(e.code)){e.preventDefault();if(!e.repeat)activateBinding(e.code);return;}
    if(['BUTTON','SUMMARY','A'].includes(document.activeElement.tagName))return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;
    if(e.code==='Space')pause();if(e.code==='KeyW')train('worker');if(e.code==='KeyS')train('scout');if(e.code==='KeyG')$('gather').click();if(e.code==='KeyH')$('stop').click();
    if(e.code==='KeyB')chooseBuild('barracks');if(e.code==='KeyR')chooseBuild('relay');if(e.code==='KeyC')chooseBuild('base');if(e.code==='KeyX')$('cancel-build').click();
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
  function text(id,value){if($(id).textContent!==String(value))$(id).textContent=value;}
  let queueSignature='';
  function updateHUD(){const p=game.players[game.active],own=game.units.filter(u=>u.owner===game.active),units=game.units.filter(u=>selected.includes(u.id)),pending=orders(game,game.active);
    text('code',p.code);text('workers',own.filter(u=>u.type==='worker').length+' / 5');text('supply',own.length+' / '+supplyCap(game,game.active)+(pending.length?' (+'+pending.length+')':''));
    const seconds=Math.floor(game.tick/20);text('clock',String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'));
    text('income','+'+p.deliveries.reduce((s,d)=>s+d.amount,0)+(seconds<60?' / '+seconds+' s':' / min'));text('player-label','P'+(game.active+1)+' / '+TEAMS[game.active].name);text('selected-count',selected.length+' OBJEKATA');
    const b=game.buildings.find(b=>selected.includes(b.id)),n=game.nodes.find(n=>selected.includes(n.id));let title='Ništa nije izabrano',desc='Klikni objekat ili prevuci preko svojih jedinica.',meta='B / R / C: gradnja izabranim radnikom.',portrait='◇',ratio=0;
    if(b){title=BUILDINGS[b.type].name;desc=!b.completed?(b.builderId?'Gradilište · radnik putuje ili gradi':'Gradilište miruje · desni klik radnikom'):b.type==='base'?'Tier 1 · proizvodnja i isporuka CODE-a':b.type==='relay'?'Završen Relej · +5 kapaciteta, T1 najviše 20':'Završena Kasarna · vojska u sledećoj verziji';
      meta=b.hp+' / '+BUILDINGS[b.type].hp+' HP'+(!b.completed?' · '+Math.floor(b.progress/b.duration*100)+'% · '+Math.ceil((b.duration-b.progress)/20)+' s rada':'');portrait=b.type==='base'?'⌂':b.type==='relay'?'◆':'⚑';ratio=b.hp/BUILDINGS[b.type].hp;}
    else if(units.length){const u=units[0];title=units.length>1?units.length+' jedinica':u.type==='worker'?'WHR Radnik':'Scout';desc=units.length>1?'Desni klik za grupno kretanje.':modes[u.mode];meta=u.hp+' HP · '+(u.type==='worker'?u.cargo+'/5 CODE · graditelj':'Izviđač · bez napada');portrait=u.type==='worker'?'⚒':'➤';ratio=1;}
    else if(n){title='CODE · '+(n.field==='home'?'početno polje':'proširenje');desc='Jedno aktivno mesto za skupljanje.';meta=n.remaining+' / 1.000 CODE · teret 5 · rad 3 s';portrait='◆';}
    text('selection-name',title);text('selection-description',desc);text('selection-meta',meta);text('portrait',portrait);$('health').hidden=!ratio;$('health').firstElementChild.style.width=(ratio*100)+'%';
    const can=started&&!game.paused,base=!!b&&b.type==='base'&&b.owner===game.active&&b.completed,worker=units.some(u=>u.owner===game.active&&u.type==='worker');
    $('train-worker').disabled=!can||!base;$('train-scout').disabled=!can||!base;$('gather').disabled=!can||!worker;$('stop').disabled=!can||!units.some(u=>u.owner===game.active);
    for(const type of ['base','barracks','relay']){$('build-'+type).disabled=!can||!worker;$('build-'+type).classList.toggle('active',!!buildMode&&buildMode.type===type);}
    $('cancel-build').disabled=!can||!b||b.owner!==game.active||b.completed;
    const ownUnit=units.some(u=>u.owner===game.active),site=!!b&&b.owner===game.active&&!b.completed;
    const visible={'train-worker':base,'train-scout':base,gather:worker,stop:ownUnit,'build-barracks':worker,'build-relay':worker,'build-base':worker,'cancel-build':site};
    for(const [id,show] of Object.entries(visible))$(id).hidden=!show;
    document.querySelector('.actions-panel').hidden=!Object.values(visible).some(Boolean);
    document.querySelector('.selection-panel').hidden=!started||!selected.length;
    const idle=own.filter(u=>u.type==='worker'&&u.mode==='idle');$('idle-worker').hidden=!started||!idle.length;$('idle-worker').textContent='Neaktivni: '+idle.length;
    const status=(id,reason)=>{$(id).disabled=!!reason;$(id).title=[$(id).textContent.trim(),reason].filter(Boolean).join(' — ');};
    const queued=type=>pending.filter(j=>j.type===type).length,has=type=>own.filter(u=>u.type===type).length;
    for(const type of ['worker','scout']){const cost=type==='worker'?50:75,limit=type==='worker'?5:1;status('train-'+type,!can?'Poligon je pauziran / nije pokrenut.':!base?'Izaberi svoju Centralu.':has(type)+queued(type)>=limit?'Globalni limit '+limit:own.length+pending.length>=supplyCap(game,game.active)?'Nema slobodne populacije.':p.code<cost?'Potrebno '+cost+' CODE; dostupno '+p.code+'.':'');}
    for(const type of ['base','barracks','relay'])status('build-'+type,!can?'Poligon je pauziran / nije pokrenut.':!worker?'Izaberi radnika.':p.code<BUILDINGS[type].cost?'Potrebno '+BUILDINGS[type].cost+' CODE; dostupno '+p.code+'.':'');
    for(const [id,code] of [['train-worker','KeyW'],['train-scout','KeyS'],['gather','KeyG'],['stop','KeyH'],['build-barracks','KeyB'],['build-relay','KeyR'],['build-base','KeyC'],['cancel-build','KeyX']])$(id).querySelector('kbd').textContent=bindings.has(code)?'':keyName(code);
    $('pause').title=bindings.has('Space')?'Space je dodeljen kameri.':'Space: pauza / nastavak';
    $('hotkeys-open').disabled=!started;
    const jobs=base?b.queue:[],signature=JSON.stringify(jobs.map(j=>[j.type,j.remaining]));if(signature!==queueSignature){queueSignature=signature;$('queue').replaceChildren();jobs.forEach((j,i)=>{const el=document.createElement('span');el.className='job';el.textContent=(j.type==='worker'?'Radnik':'Scout')+' · '+(i?'čeka':j.remaining?Math.ceil(j.remaining/20)+' s':'čeka izlaz');el.style.setProperty('--progress',((1-j.remaining/j.duration)*100)+'%');$('queue').append(el);});}
    text('action-hint',game.paused?'Pauza · svi radovi miruju.':buildMode?'Levi klik potvrđuje. Desni klik / Escape odustaje.':worker?'B Kasarna · R Relej · C Centrala. Desni klik na gradilište nastavlja rad.':'Izaberi Centralu za proizvodnju ili radnika za gradnju.');
  }
  function line(points,color,width){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function circle(x,y,r,fill,stroke=null,width=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function label(t,x,y,color='#c2d0b9',size=12){ctx.fillStyle=color;ctx.font='600 '+size+'px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.fillText(t,x,y);}
  function bunny(x,y,s,color){ctx.fillStyle=color;for(const sign of [-1,1]){ctx.beginPath();ctx.ellipse(x+sign*s*.35,y-s*.8,s*.19,s*.7,sign*.2,0,Math.PI*2);ctx.fill();}circle(x,y,s*.55,color);circle(x-s*.2,y-s*.05,s*.07,'#142327');circle(x+s*.2,y-s*.05,s*.07,'#142327');}
  function crystal(x,y,s,depleted=false){ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*.6,y-s*.2);ctx.lineTo(x+s*.4,y+s*.5);ctx.lineTo(x-s*.45,y+s*.5);ctx.lineTo(x-s*.65,y-s*.2);ctx.closePath();ctx.fillStyle=depleted?'#344d4a':'#55cce1';ctx.fill();ctx.strokeStyle=depleted?'#45625b':'#b4f5ed';ctx.lineWidth=1.5;ctx.stroke();line([[x,y-s],[x-s*.1,y+s*.5]],depleted?'#45625b':'#d5fff5',1);}
  function terrain(){if(terrainCache)return terrainCache;terrainCache=document.createElement('canvas');terrainCache.width=WIDTH;terrainCache.height=HEIGHT;const actual=ctx;ctx=terrainCache.getContext('2d');
    ctx.fillStyle='#243e32';ctx.fillRect(0,0,WIDTH,HEIGHT);for(let i=0;i<3500;i++)circle((i*173+41)%WIDTH,(i*227+13)%HEIGHT,1+i%3,i%2?'#2b4938':'#20382d');ctx.lineJoin='round';ctx.lineCap='round';
    for(const road of game.map.roads){line(road,'#18372c',148);line(road,'#62684d',128);line(road,'#8c8b70',100);line(road,'#b1a17c',2);}
    for(const z of game.map.zones){ctx.fillStyle=z.kind==='home'?'#34483c':'#354531';ctx.fillRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);ctx.strokeStyle=z.kind==='home'?'#66775b':'#7a7955';ctx.lineWidth=2;ctx.strokeRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);
      if(z.kind==='home'){for(let x=z.x-z.w/2+32;x<z.x+z.w/2;x+=32)line([[x,z.y-z.h/2],[x,z.y+z.h/2]],'#3d5142',1);for(let y=z.y-z.h/2+32;y<z.y+z.h/2;y+=32)line([[z.x-z.w/2,y],[z.x+z.w/2,y]],'#3d5142',1);label('P'+(z.owner+1)+' · PROSTOR ZA BAZU',z.x,z.y+220,TEAMS[z.owner].color,14);}
      else label('CODE PROŠIRENJE',z.x,z.y+125,'#c8ba84',15);
    }
    for(let owner=0;owner<4;owner++){const transform=p=>{const q=mirror({x:p[0],y:p[1]},owner);return[q.x,q.y];},hub=transform([880,960]);
      for(const route of [[[640,960],[1200,960]],[[880,640],[880,1200]],...[[720,720],[1040,720],[1040,1088],[720,1056]].map(p=>[[880,960],p])])line(route.map(transform),'#8b7750',42);
      const z=mirror({x:880,y:920},owner);label('JUNGLA '+(owner+1),z.x,z.y,'#c9ccab',23);
    }
    for(let i=0;i<game.map.terrain.length;i++){const p=cellPoint(i);if(game.map.forest[i]){if(i%2||Math.floor(i/160)%2)continue;circle(p.x,p.y+5,20,'#142e24');circle(p.x-6,p.y-4,16,'#315a38');circle(p.x+6,p.y-7,15,'#426a3e');circle(p.x,p.y-14,12,'#527845');}
      else if(game.map.terrain[i]){ctx.fillStyle='#58695a';ctx.fillRect(p.x-8,p.y-8,16,16);line([[p.x-7,p.y-6],[p.x+6,p.y-6]],'#8b9778',2);}}
    for(const ramp of game.map.ramps){const dx=ramp.owner%2?-1:1,dy=ramp.owner>=2?-1:1,angle=ramp.axis==='diagonal'?Math.atan2(dy,dx):Math.atan2(0,dx);ctx.save();ctx.translate(ramp.x,ramp.y);ctx.rotate(angle);ctx.fillStyle='#8b9176';ctx.fillRect(-48,-40,96,80);for(let j=-3;j<=3;j++)line([[j*12,-36],[j*12,36]],'#bec1a1',3);ctx.restore();label('RAMPA',ramp.x,ramp.y+5,'#344a3b',10);}
    game.map.camps.forEach(c=>{circle(c.x,c.y,64,'#515b3c','#81906a',2);circle(c.x,c.y,25,'#717d61','#a7b08a',2);label('T'+c.tier+' KAMP',c.x,c.y-76,['','#b3d49c','#ead08a','#e8a395'][c.tier],16);label('planirano',c.x,c.y+48,'#a6b497',10);});
    game.map.shops.forEach(s=>{ctx.fillStyle='#4f4632';ctx.fillRect(s.x-32,s.y-12,64,42);ctx.fillStyle='#ba8c50';ctx.beginPath();ctx.moveTo(s.x-41,s.y-12);ctx.lineTo(s.x,s.y-44);ctx.lineTo(s.x+41,s.y-12);ctx.closePath();ctx.fill();label('SHOP · planirano',s.x,s.y+50,'#d5bf8d',13);});
    circle(1280,1280,145,'#42574c','#a5a285',4);circle(1280,1280,110,'#354449','#899f94',2);circle(1280,1280,72,'#4e4564','#b0a0d3',2);crystal(1280,1280,48);bunny(1280,1280,22,'#e7ddff');label('CENTRALNO JEZGRO',1280,1395,'#cfc2e1',17);
    ctx.strokeStyle='#6c805e';ctx.lineWidth=8;ctx.strokeRect(0,0,WIDTH,HEIGHT);ctx=actual;return terrainCache;
  }
  function drawBuilding(b){const color=TEAMS[b.owner].color,d=BUILDINGS[b.type];ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle=b.completed?'#253d3c':'#3b3d30';ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);ctx.strokeStyle=selected.includes(b.id)?'#c3ffb4':color;ctx.lineWidth=selected.includes(b.id)?3:2;ctx.strokeRect(-b.w/2,-b.h/2,b.w,b.h);
    if(!b.completed){ctx.strokeStyle='#c7af72';ctx.lineWidth=2;for(let x=-b.w/2;x<b.w/2;x+=16)line([[x,-b.h/2],[x,b.h/2]],'#786e49',1);line([[-b.w/2,-b.h/2],[b.w/2,b.h/2]],'#b3a36c',2);line([[b.w/2,-b.h/2],[-b.w/2,b.h/2]],'#b3a36c',2);label(Math.floor(b.progress/b.duration*100)+'%',0,5,'#fff1bd',14);}
    else if(b.type==='base'){ctx.fillStyle='#49676b';ctx.fillRect(-32,-28,64,50);bunny(0,-17,22,color);circle(0,28,9,color);}
    else if(b.type==='relay'){crystal(0,0,14);}
    else{ctx.fillStyle='#5f736a';ctx.fillRect(-28,-20,56,40);ctx.fillStyle='#14282c';ctx.fillRect(-12,0,24,20);line([[-33,-20],[0,-34],[33,-20]],color,4);}
    label(d.name,0,b.h/2+19,color,b.type==='relay'?10:13);
    if(!b.completed){ctx.fillStyle='#142727';ctx.fillRect(-b.w/2,b.h/2+26,b.w,5);ctx.fillStyle='#d6bd7b';ctx.fillRect(-b.w/2,b.h/2+26,b.w*b.progress/b.duration,5);}
    ctx.restore();}
  function render(now){const dpr=canvas.width/view.width;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#10271f';ctx.fillRect(0,0,view.width,view.height);ctx.save();ctx.translate(view.width/2,view.height/2);ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);ctx.drawImage(terrain(),0,0);
    if(buildMode){for(const z of game.map.zones.filter(z=>z.owner===game.active)){ctx.fillStyle='#75d8a514';ctx.fillRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);ctx.setLineDash([8,8]);ctx.strokeStyle='#8bddb6';ctx.lineWidth=2;ctx.strokeRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);ctx.setLineDash([]);}}
    game.nodes.forEach(n=>{if(selected.includes(n.id))circle(n.x,n.y,21,null,'#baffb4',2);crystal(n.x,n.y,13,!n.remaining);crystal(n.x+9,n.y+5,8,!n.remaining);});game.buildings.forEach(drawBuilding);
    for(const u of game.units){const color=TEAMS[u.owner].color;if(selected.includes(u.id)){circle(u.x,u.y+5,17,null,'#b9ffa6',2);if(u.path.length)line([[u.x,u.y],...u.path.map(p=>[p.x,p.y])],'#a2dc9b66',1);}
      circle(u.x,u.y+7,11,'#0c1e1f88');if(u.type==='scout'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(u.x,u.y-18);ctx.lineTo(u.x+12,u.y+13);ctx.lineTo(u.x-12,u.y+13);ctx.closePath();ctx.fill();bunny(u.x,u.y-3,8,'#e5ebdb');}
      else{circle(u.x,u.y+3,9,'#c79753',color,2);bunny(u.x,u.y-6,8,'#ede8cf');if(u.cargo)crystal(u.x+9,u.y,6);}
      if(u.mode==='harvest'){ctx.fillStyle='#142927';ctx.fillRect(u.x-12,u.y-26,24,3);ctx.fillStyle='#71e2d4';ctx.fillRect(u.x-12,u.y-26,24*u.work/60,3);}
      if(u.mode==='build')label('⚒',u.x+15,u.y-10,'#f4d28f',15);
    }
    if(buildMode&&preview){ctx.fillStyle=preview.error?'#e7686344':'#8febad44';ctx.strokeStyle=preview.error?'#ff9e98':'#b0ffd0';ctx.lineWidth=2;ctx.fillRect(preview.x-preview.w/2,preview.y-preview.h/2,preview.w,preview.h);ctx.strokeRect(preview.x-preview.w/2,preview.y-preview.h/2,preview.w,preview.h);}
    if(orderMarker&&now<orderMarker.until)circle(orderMarker.x,orderMarker.y,12+(orderMarker.until-now)/55,null,'#c6efad',2);ctx.restore();
    if(pointer&&distance(pointer.start,pointer.end)>5){ctx.fillStyle='#81e5b922';ctx.strokeStyle='#a6efc5';ctx.lineWidth=1;ctx.fillRect(pointer.start.x,pointer.start.y,pointer.end.x-pointer.start.x,pointer.end.y-pointer.start.y);ctx.strokeRect(pointer.start.x,pointer.start.y,pointer.end.x-pointer.start.x,pointer.end.y-pointer.start.y);}
    mctx.drawImage(terrain(),0,0,mini.width,mini.height);const sx=mini.width/WIDTH,sy=mini.height/HEIGHT;for(const b of game.buildings){mctx.fillStyle=TEAMS[b.owner].color;mctx.fillRect(b.x*sx-3,b.y*sy-3,6,6);}for(const u of game.units){mctx.fillStyle=TEAMS[u.owner].color;mctx.fillRect(u.x*sx-1,u.y*sy-1,2,2);}mctx.strokeStyle='#dcf6d9';mctx.lineWidth=1;mctx.strokeRect((camera.x-view.width/camera.scale/2)*sx,(camera.y-view.height/camera.scale/2)*sy,view.width/camera.scale*sx,view.height/camera.scale*sy);
  }
  function frame(time){const elapsed=lastTime?Math.max(0,time-lastTime):0;lastTime=time;if(!document.hidden&&started&&!game.paused&&!dialog.open){accumulator+=Math.min(elapsed,1000);let count=0;while(accumulator>=50&&count++<20){step(game);accumulator-=50;}}else accumulator=0;
    const movement=dialog.open?0:Math.min(elapsed,100)*.6/camera.scale;if(keys.has('ArrowLeft'))camera.x-=movement;if(keys.has('ArrowRight'))camera.x+=movement;if(keys.has('ArrowUp'))camera.y-=movement;if(keys.has('ArrowDown'))camera.y+=movement;camera.x=clamp(camera.x,0,WIDTH);camera.y=clamp(camera.y,0,HEIGHT);if(buildMode)updatePreview();render(time);updateHUD();requestAnimationFrame(frame);}
  document.addEventListener('visibilitychange',()=>{lastTime=0;accumulator=0;keys.clear();if(document.hidden&&started&&!game.paused)pause();});window.addEventListener('resize',resize);resize();updateHUD();requestAnimationFrame(frame);
  root.WHR=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({tick:game.tick,active:game.active,running:game.running,paused:game.paused,players:game.players,units:game.units,nodes:game.nodes,buildings:game.buildings,selected,camera,view,bindings:[...bindings].map(([key,target])=>({key,...target})),cameraHistoryDepth:cameraHistory.length,buildMode,preview:preview?{x:preview.x,y:preview.y,w:preview.w,h:preview.h,error:preview.error}:null,world:{width:WIDTH,height:HEIGHT},zones:game.map.zones}))});
})(typeof window!=='undefined'?window:globalThis);
