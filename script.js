/* WHR CODE FRONTIER · 0.7.0 · T1/T2/T3 local simulation candidate. */
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
    relay: { name: 'CODE Relej', cost: 60, ticks: 400, w: 32, h: 32, hp: 400 },
    tower:{name:'Stražarska kula',cost:100,ticks:600,w:32,h:32,hp:600},
    academy:{name:'Akademija',cost:180,ticks:900,w:64,h:64,hp:900,tier:2},
    support:{name:'Stanica podrške',cost:150,ticks:800,w:64,h:48,hp:700,tier:2},
    workshop:{name:'Radionica',cost:220,ticks:1000,w:80,h:64,hp:1000,tier:2},
    airfield:{name:'Vazdušna luka',cost:250,ticks:1100,w:80,h:64,hp:900,tier:3},
    cloakCenter:{name:'Centar prikrivanja',cost:200,ticks:900,w:64,h:64,hp:700,tier:3},
    anchor:{name:'Teleport sidro',cost:150,ticks:700,w:32,h:32,hp:500,tier:3},
    altar:{name:'WHR Oltar',cost:150,ticks:700,w:48,h:48,hp:800,tier:2}
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
  // Navigation geometry belongs to the simulation; render scale never changes it.
  const navMasks=new WeakMap();
  function unitRadius(u){if(u.type==='carrier')return 16;if(u.type==='skyguard')return 12;return u.type==='breaker'?19.2:u.type==='worker'||u.type==='scout'?5.6:7.2;}
  function diskClear(blocked,p,r){
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x-r<0||p.y-r<0||p.x+r>WIDTH||p.y+r>HEIGHT)return false;
    for(let y=Math.max(0,Math.floor((p.y-r)/16));y<=Math.min(159,Math.floor((p.y+r)/16));y++)for(let x=Math.max(0,Math.floor((p.x-r)/16));x<=Math.min(159,Math.floor((p.x+r)/16));x++)if(blocked[y*160+x]){
      const qx=clamp(p.x,x*16,x*16+16),qy=clamp(p.y,y*16,y*16+16);if((p.x-qx)**2+(p.y-qy)**2<r*r-1e-8)return false;
    }return true;
  }
  function clearanceMask(blocked,r){let cache=navMasks.get(blocked);if(!cache){cache=new Map();navMasks.set(blocked,cache);}if(cache.has(r))return cache.get(r);
    const mask=new Uint8Array(blocked.length);for(let i=0;i<mask.length;i++)mask[i]=diskClear(blocked,cellPoint(i),r)?0:1;cache.set(r,mask);return mask;
  }
  function staticSegment(blocked,a,b,r){
    if(!diskClear(blocked,a,r)||!diskClear(blocked,b,r))return false;
    for(let y=Math.max(0,Math.floor((Math.min(a.y,b.y)-r)/16));y<=Math.min(159,Math.floor((Math.max(a.y,b.y)+r)/16));y++)for(let x=Math.max(0,Math.floor((Math.min(a.x,b.x)-r)/16));x<=Math.min(159,Math.floor((Math.max(a.x,b.x)+r)/16));x++)if(blocked[y*160+x]){
      const lo={x:x*16,y:y*16},hi={x:x*16+16,y:y*16+16};let enter=0,leave=1,intersects=true;
      for(const axis of ['x','y']){const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-12){if(a[axis]<lo[axis]||a[axis]>hi[axis])intersects=false;}else{const t1=(lo[axis]-a[axis])/delta,t2=(hi[axis]-a[axis])/delta;enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));}}
      if(intersects&&enter<=leave)return false;
      const endpoint=p=>Math.hypot(p.x-clamp(p.x,lo.x,hi.x),p.y-clamp(p.y,lo.y,hi.y));
      const d=Math.min(endpoint(a),endpoint(b),...[[lo.x,lo.y],[lo.x,hi.y],[hi.x,lo.y],[hi.x,hi.y]].map(([x,y])=>segmentDistance({x,y},a,b)));
      if(d<r-1e-7)return false;
    }return true;
  }
  function unitPath(g,u,to,strict=false,blocked=g.blocked){
    const r=unitRadius(u);if(UNIT[u.type]?.flying){if(!to||!Number.isFinite(to.x)||!Number.isFinite(to.y)||to.x<r||to.y<r||to.x>WIDTH-r||to.y>HEIGHT-r)return null;return[{x:to.x,y:to.y}];}const mask=clearanceMask(blocked,r);if(!to||!Number.isFinite(to.x)||!Number.isFinite(to.y)||!diskClear(blocked,u,r))return null;
    if(strict&&!diskClear(blocked,to,r))return null;
    const path=pathfind(mask,u,to,strict);if(!path)return null;
    // A* nodes are safe cell centers. Exact start and final offsets need their own check.
    const start=cellPoint(cellIndex(u.x,u.y));if(distance(u,start)>1e-6)path.unshift(start);
    if(path.length&&!diskClear(blocked,path.at(-1),r))path[path.length-1]=cellPoint(cellIndex(path.at(-1).x,path.at(-1).y));
    let prev=u;for(const p of path){if(!staticSegment(blocked,prev,p,r))return null;prev=p;}return path;
  }
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  function motionClear(g,u,p){const r=unitRadius(u);if(UNIT[u.type]?.flying){if(p.x<r||p.y<r||p.x>WIDTH-r||p.y>HEIGHT-r)return false;}else if(!staticSegment(g.blocked,u,p,r))return false;
    for(const v of [...g.units,...(g.neutrals||[])]){if(v===u||v.transportedBy||v.hp<=0||v.flying!==u.flying&&(v.flying||u.flying))continue;const limit=r+unitRadius(v),before=distance(u,v);
      if(before<limit-1e-6){if(distance(p,v)<=before+1e-7)return false;}
      else if(segmentDistance(v,u,p)<limit-1e-6)return false;
    }return true;
  }
  function freeArrival(g,u,p,reserved=[]){return (UNIT[u.type]?.flying?p.x>=unitRadius(u)&&p.y>=unitRadius(u)&&p.x<=WIDTH-unitRadius(u)&&p.y<=HEIGHT-unitRadius(u):diskClear(g.blocked,p,unitRadius(u)))&&![...g.units,...(g.neutrals||[]),...reserved].some(v=>v!==u&&!v.transportedBy&&!!UNIT[v.type]?.flying===!!UNIT[u.type]?.flying&&distance(v,p)<unitRadius(u)+unitRadius(v)+0.25);}
  function formationTargets(g,units,target){const slots=new Map(),reserved=[];
    for(const u of [...units].sort((a,b)=>unitRadius(b)-unitRadius(a)||(a.id<b.id?-1:a.id>b.id?1:0))){let attempts=0,found=false;
      for(let ring=0;ring<=16&&!found;ring++)for(let dy=-ring;dy<=ring&&!found;dy++)for(let dx=-ring;dx<=ring&&!found;dx++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;const p={x:clamp(target.x,1,WIDTH-1)+dx*16,y:clamp(target.y,1,HEIGHT-1)+dy*16};
        if(!freeArrival(g,u,p,reserved)||reserved.some(v=>distance(v,p)<unitRadius(u)+unitRadius(v)+12))continue;if(++attempts>32)break;
        if(!unitPath(g,u,p,true))continue;slots.set(u.id,p);reserved.push({...p,type:u.type});found=true;
      }
    }return slots;
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
  function makeBuilding(id,owner,type,p,complete=false){const d=BUILDINGS[type];return{id,owner,type,...footprint(type,p),hp:complete?d.hp:1,completed:complete,progress:complete?d.ticks:0,duration:d.ticks,builderId:null,queue:[],techLevel:1};}
  function createGame(active=0){const map=makeMap();const game={tick:0,active,running:false,paused:false,map,blocked:map.terrain.slice(),navRevision:0,players:[],units:[],nodes:[],bases:[],buildings:[],nextId:1};
    TEAMS.forEach((t,owner)=>{const b=makeBuilding('base'+owner,owner,'base',t,true);game.bases.push(b);game.buildings.push(b);game.players.push({code:100,deliveries:[],queue:b.queue});
      const addField=(center,field)=>{for(let n=0;n<6;n++){const dx=(n%3-1)*48,dy=112+Math.floor(n/3)*48;
        game.nodes.push({id:'node'+owner+'-'+field+'-'+n,type:'node',owner,field,x:center.x+(owner%2?-dx:dx),y:center.y+(owner<2?-dy:dy),remaining:RULES.nodeStock,miner:null});}};
      addField(t,'home');addField(map.expansions[owner],'expansion');
    });rebuildNavigation(game);
    TEAMS.forEach((t,owner)=>{for(let n=0;n<3;n++)spawn(game,owner,'worker',game.bases[owner],n);});armyInit(game);controllerInit(game);return game;}
  function exitPoints(b,margin=8){const out=[];for(let x=b.x-b.w/2-margin;x<=b.x+b.w/2+margin;x+=16)out.push({x,y:b.y-b.h/2-margin},{x,y:b.y+b.h/2+margin});
    for(let y=b.y-b.h/2+margin;y<=b.y+b.h/2-margin;y+=16)out.push({x:b.x-b.w/2-margin,y},{x:b.x+b.w/2+margin,y});return out;}
  function availableExit(game,b,type='worker'){const u={type},margin=Math.max(8,Math.ceil((unitRadius(u)-8)/16)*16+8),toward={x:b.x,y:b.y+(b.owner<2?-112:112)};
    return exitPoints(b,margin).filter(p=>freeArrival(game,u,p)).sort((a,c)=>distance(a,toward)-distance(c,toward))[0];}
  function spawn(game,owner,type,base=game.bases.find(b=>b.owner===owner),initial=-1){let p=initial>=0?{x:base.x+(owner%2?-1:1)*((initial-1)*32+8),y:base.y+(owner<2?-72:72)}:availableExit(game,base,type);
    if(!p)return null;const u={id:'u'+game.nextId++,type,owner,...p,hp:UNIT[type]?.hp||100,cargo:0,mode:'idle',path:[],nodeId:null,work:0,jobId:null,dest:null,pathRevision:game.navRevision};unitExtras(u);u.flying=!!UNIT[type]?.flying;if(type==='guard'&&game.players[owner]?.research?.guards)u.hp=210;game.units.push(u);
    if(initial<0&&base.rally&&applyRally(game,u,base))return u;
    u.flying=!!UNIT[type]?.flying;if(type==='worker')assignGather(game,u,initial>=0?game.nodes.filter(n=>n.owner===owner&&n.field==='home')[initial]:null);return u;}
  function releaseNode(game,u){const n=game.nodes.find(n=>n.id===u.nodeId);if(n&&n.miner===u.id)n.miner=null;u.work=0;}
  function releaseJob(game,u){if(u.jobId){const b=game.buildings.find(b=>b.id===u.jobId);if(b&&b.builderId===u.id)b.builderId=null;u.jobId=null;}}
  function moveTo(game,u,p,mode,strict=false){const path=unitPath(game,u,p,strict);u.path=path||[];u.dest={x:p.x,y:p.y};u.pathRevision=game.navRevision;u.mode=path?mode:'blocked';u.resumeMode=mode;return !!path;}
  function pickNode(game,u){return game.nodes.filter(n=>n.owner===u.owner&&n.remaining>0).sort((a,b)=>(distance(a,u)+(a.miner?48:0))-(distance(b,u)+(b.miner?48:0)))[0];}
  function returnCargo(game,u){const bases=game.bases.filter(b=>b.owner===u.owner&&b.completed).sort((a,b)=>distance(a,u)-distance(b,u));
    for(const b of bases){const points=exitPoints(b).filter(p=>freeArrival(game,u,p)&&!game.units.some(v=>v!==u&&v.mode==='return'&&v.dest&&distance(v.dest,p)<12)).sort((a,b)=>distance(a,u)-distance(b,u));
      for(const p of points){const path=unitPath(game,u,p,true);if(path){u.path=path;u.dest={x:p.x,y:p.y};u.mode='return';u.resumeMode='return';u.pathRevision=game.navRevision;return true;}}}
    u.path=[];u.mode='blocked';u.resumeMode='return';return false;}
  function assignGather(game,u,node=null){if(u.type!=='worker')return false;releaseNode(game,u);releaseJob(game,u);
    node=node&&game.nodes.includes(node)&&node.remaining>0?node:pickNode(game,u);u.nodeId=node?node.id:null;
    if(u.cargo)return returnCargo(game,u);if(!node){u.mode='idle';u.path=[];return false;}
    const offsets=[[8,24],[-8,24],[24,8],[-24,8],[24,-8],[-24,-8],[8,-24],[-8,-24]],points=offsets.map(([x,y])=>({x:node.x+(node.owner%2?-x:x),y:node.y+(node.owner<2?y:-y)}));
    for(const p of points)if(freeArrival(game,u,p)&&!game.units.some(v=>v!==u&&v.nodeId===node.id&&v.dest&&['toNode','waiting','harvest'].includes(v.mode)&&distance(v.dest,p)<12)&&moveTo(game,u,p,'toNode',true))return true;
    u.path=[];u.mode='blocked';u.resumeMode='toNode';return false;}
  function commandNow(game,owner,ids,action,target){if(!game.running||game.paused||!mayControl(game,owner)||game.players[owner].defeated)return false;if(action==='attack')return attackCommand(game,owner,ids,target);let changed=false;const movers=game.units.filter(u=>u.owner===owner&&!u.transportedBy&&ids.includes(u.id)),slots=action==='move'&&movers.length>1&&target&&Number.isFinite(target.x)&&Number.isFinite(target.y)?formationTargets(game,movers,target):null;
    for(const u of game.units.filter(u=>u.owner===owner&&!u.transportedBy&&ids.includes(u.id))){
      if(action==='gather'&&u.type==='worker'){u.targetId=null;u.channel=null;assignGather(game,u,target);changed=true;}
      if(action==='move'){if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))continue;u.targetId=null;u.channel=null;releaseNode(game,u);releaseJob(game,u);u.nodeId=null;const goal=slots?slots.get(u.id):target;if(goal)moveTo(game,u,goal,'move');else{u.path=[];u.dest={x:target.x,y:target.y};u.mode='blocked';u.resumeMode='move';}changed=true;}
      if(action==='stop'){u.targetId=null;u.channel=null;releaseNode(game,u);releaseJob(game,u);u.path=[];u.dest=null;u.mode='idle';u.nodeId=null;changed=true;}
    }return changed;}
  const supplyCap=(game,owner)=>Math.min(tierOf(game,owner)>=3?60:tierOf(game,owner)>=2?40:20,10+5*game.buildings.filter(b=>b.owner===owner&&b.type==='relay'&&b.completed).length);
  const orders=(game,owner)=>game.buildings.filter(b=>b.owner===owner).flatMap(b=>b.queue);
  function purchase(game,owner,type,baseId='base'+owner){const reason=productionReason(game,owner,type,baseId);if(reason)return reason;const d=UNIT[type],b=game.buildings.find(b=>b.id===baseId);game.players[owner].code-=d.cost;b.queue.push({type,remaining:d.ticks,duration:d.ticks});return null;}
  function approaches(blocked,r,from){return exitPoints(r,Math.max(8,Math.ceil((unitRadius(from)-8)/16)*16+8)).filter(p=>p.x>=0&&p.y>=0&&p.x<WIDTH&&p.y<HEIGHT&&!blocked[cellIndex(p.x,p.y)])
    .sort((a,b)=>distance(a,from)-distance(b,from));}
  function placement(game,owner,type,p,workerId,planning=false,replaceUnitId=null){const d=BUILDINGS[type];if(!d||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return{error:'Nevažeća građevina ili lokacija.'};
    if(d.tier&&tierOf(game,owner)<d.tier)return{error:'Potreban T'+d.tier+'.'};if(type==='anchor'&&game.buildings.filter(b=>b.owner===owner&&b.type==='anchor').length+game.units.filter(u=>u.owner===owner&&u.id!==replaceUnitId).flatMap(u=>[u.activeOrder,...(u.orderQueue||[])]).filter(q=>q?.type==='build'&&q.buildType==='anchor'&&!q.buildingId&&q.reservation>0).length>=2)return{error:'Limit dva sidra.'};if(type==='tower'&&game.buildings.filter(b=>b.owner===owner&&b.type==='tower').length+plannedTowers(game,owner,replaceUnitId)>=2)return{error:'Limit dve kule.'};
    const r=footprint(type,p),cells=rectCells(r);const fail=error=>({error,...r});
    if(r.x-r.w/2<16||r.y-r.h/2<16||r.x+r.w/2>WIDTH-16||r.y+r.h/2>HEIGHT-16)return fail('Van granica mape.');
    const zone=game.map.zones.find(z=>z.owner===owner&&inside({x:r.x-r.w/2,y:r.y-r.h/2},z)&&inside({x:r.x+r.w/2,y:r.y+r.h/2},z));
    if(!zone)return fail('Gradi u svojoj bazi ili označenom proširenju.');
    if(cells.some(i=>game.map.noBuild[i]))return fail('Sačuvaj rampu, glavni put i radnički prolaz.');
    if(cells.some(i=>game.blocked[i]))return fail('Preklapanje sa objektom, CODE-om ili neprohodnim terenom.');
    if(game.map.camps.some(c=>inside(c,r,90))||game.map.shops.some(s=>inside(s,r,65)))return fail('Neutralna lokacija mora ostati slobodna.');

    const worker=game.units.find(u=>u.id===workerId&&u.owner===owner&&u.type==='worker');if(!worker)return fail('Izaberi svog radnika za gradnju.');
    if(planning)return{...r,error:null};
    if(game.units.some(u=>{if(u.transportedBy||UNIT[u.type]?.flying)return false;const dx=u.x-clamp(u.x,r.x-r.w/2,r.x+r.w/2),dy=u.y-clamp(u.y,r.y-r.h/2,r.y+r.h/2);return dx*dx+dy*dy<unitRadius(u)**2;}))return fail('Jedinica stoji na gradilištu.');
    const blocked=game.blocked.slice();for(const i of cells)blocked[i]=1;
    for(const point of approaches(blocked,r,worker).filter(p=>freeArrival(game,worker,p))){const path=unitPath(game,worker,point,true,blocked);if(path)return{...r,error:null,point,path};}
    return fail('Radnik nema pristup gradilištu.');}
  function beginBuildNow(game,owner,workerId,type,p){if(!game.running||game.paused)return{error:'Pokreni ili nastavi poligon.'};if(!mayControl(game,owner)||game.players[owner].defeated)return{error:'Nemaš kontrolu nad tom bazom.'};
    const check=placement(game,owner,type,p,workerId);if(check.error)return check;const d=BUILDINGS[type];if(availableCode(game,owner)<d.cost)return{error:'Nedovoljno CODE-a.'};
    const u=game.units.find(u=>u.id===workerId);u.targetId=null;u.channel=null;releaseNode(game,u);releaseJob(game,u);const b=makeBuilding('building'+game.nextId++,owner,type,check);game.players[owner].code-=d.cost;
    game.buildings.push(b);if(type==='base')game.bases.push(b);b.builderId=u.id;u.jobId=b.id;rebuildNavigation(game);u.path=check.path;u.dest={x:check.point.x,y:check.point.y};u.mode='toBuild';u.pathRevision=game.navRevision;return{building:b,error:null};}
  function resumeBuildNow(game,owner,workerId,buildingId){if(!game.running||game.paused||!mayControl(game,owner))return false;const u=game.units.find(u=>u.id===workerId&&u.owner===owner&&u.type==='worker'),b=game.buildings.find(b=>b.id===buildingId&&b.owner===owner&&!b.completed);
    if(!u||!b||(b.builderId&&b.builderId!==u.id))return false;
    for(const p of approaches(game.blocked,b,u).filter(p=>freeArrival(game,u,p))){const path=unitPath(game,u,p,true);if(!path)continue;releaseNode(game,u);releaseJob(game,u);b.builderId=u.id;u.jobId=b.id;u.path=path;u.dest={x:p.x,y:p.y};u.mode='toBuild';u.pathRevision=game.navRevision;return true;}return false;}
  function cancelBuildNow(game,owner,id){if(!game.running||game.paused||!mayControl(game,owner))return false;const b=game.buildings.find(b=>b.id===id&&b.owner===owner&&!b.completed);if(!b)return false;
    const u=game.units.find(u=>u.id===b.builderId);game.players[owner].code+=Math.floor(BUILDINGS[b.type].cost*(b.progress?0.75:1));game.buildings=game.buildings.filter(x=>x!==b);game.bases=game.bases.filter(x=>x!==b);rebuildNavigation(game);
    if(u){u.jobId=null;assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));}return true;}
  function allied(g,a,b){return a>=0&&b>=0&&(a===b||g.match.teams&&g.match.teams[a]===g.match.teams[b]);}
  // Temporary yielding is a movement overlay, never a replacement gameplay order.
  function trafficStep(g){if(g.tick%20)return;let assigned=0;
    for(const u of [...g.units].sort((a,b)=>a.id.localeCompare(b.id))){
      if(assigned>=4)break;if(u.trafficYield)continue;const moving=u.trafficWait>=20&&u.path.length&&['move','toNode','return','toBuild'].includes(u.mode);
      const v=moving?g.units.find(v=>v!==u&&!v.trafficYield&&v.path.length&&v.trafficWait>=20&&allied(g,u.owner,v.owner)&&distance(u,v)<unitRadius(u)+unitRadius(v)+8&&u.id>v.id):u.mode==='idle'&&!u.path.length?g.units.find(v=>v!==u&&v.trafficWait>=40&&v.path.length&&v.dest&&allied(g,u.owner,v.owner)&&distance(u,v)<unitRadius(u)+unitRadius(v)+8&&distance(v.dest,u)>unitRadius(u)+unitRadius(v)+4):null;
      if(!v)continue;const goal=v.dest||v.path.at(-1),dx=goal.x-v.x,dy=goal.y-v.y,len=Math.hypot(dx,dy)||1;let chosen=null,examined=0,pathAttempts=0;
      // Retreat into a room or pocket outside the winner's travel line.
      for(let ring=1;ring<=24&&!chosen&&examined<1024&&pathAttempts<8;ring++)for(let y=-ring;y<=ring&&!chosen&&examined<1024&&pathAttempts<8;y++)for(let x=-ring;x<=ring&&!chosen&&examined<1024&&pathAttempts<8;x++){
        if(Math.max(Math.abs(x),Math.abs(y))!==ring)continue;examined++;const q={x:u.x+x*16,y:u.y+y*16};
        if((q.x-v.x)*dx+(q.y-v.y)*dy<0||Math.abs((q.x-v.x)*dy-(q.y-v.y)*dx)/len<unitRadius(u)+unitRadius(v)+4||!freeArrival(g,u,q))continue;
        pathAttempts++;const path=unitPath(g,u,q,true);if(path&&path.length)chosen={path,until:g.tick+300,point:q,winner:v.id};
      }
      if(chosen){assigned++;u.trafficYield=chosen;u.trafficWait=0;u.orderError='Propušta savezničku jedinicu.';}
    }
  }
  function travel(game,u,speed){let remaining=speed/RULES.hz,moved=false;
    while(u.path.length&&remaining>1e-6){while(u.path.length>1&&distance(u,u.path[1])<96&&staticSegment(game.blocked,u,u.path[1],unitRadius(u)))u.path.shift();const goal=u.path[0],d=distance(u,goal);if(d<1e-5){u.path.shift();continue;}const length=Math.min(remaining,d,2),angle=Math.atan2(goal.y-u.y,goal.x-u.x),side=u.avoidSide||((u.owner===1||u.owner===2)?-1:1);
      let next=null;for(const turn of [0,side*Math.PI/4,-side*Math.PI/4,side*Math.PI/2,-side*Math.PI/2]){const p={x:u.x+Math.cos(angle+turn)*length,y:u.y+Math.sin(angle+turn)*length};if(motionClear(game,u,p)){next=p;if(turn)u.avoidSide=Math.sign(turn);break;}}
      if(!next)break;u.x=next.x;u.y=next.y;remaining-=length;moved=true;if(distance(u,goal)<1e-5)u.path.shift();
    }u.trafficWait=moved?0:(u.trafficWait||0)+1;return moved;
  }
  function step(game){if(!game.running||game.paused)return;game.tick++;processCommands(game);advanceTasks(game);trafficStep(game);t3Step(game);
    for(const u of game.units){
      if(u.transportedBy||u.teleportJob)continue;
      if(u.trafficYield){const y=u.trafficYield;if(game.tick>=y.until||!game.units.some(v=>v.id===y.winner)){u.trafficYield=null;u.orderError=null;u.path=unitPath(game,u,u.dest,true)||[];}
        else{const original=u.path;u.path=y.path;travel(game,u,unitSpeed(game,u));y.path=u.path;u.path=original;continue;}}
      if(u.path.length&&u.pathRevision!==game.navRevision){moveTo(game,u,u.dest,u.mode,true);}
      if(u.mode==='blocked'){if(game.tick%20===0){if(u.jobId)resumeConstruction(game,u);else if(u.cargo)returnCargo(game,u);else if(u.nodeId)assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));else if(u.dest)moveTo(game,u,u.dest,u.resumeMode);}continue;}
      if(u.path.length){if(u.type==='worker'&&u.trafficWait>=40&&game.tick%20===0){if(u.jobId)resumeConstruction(game,u);else if(u.cargo)returnCargo(game,u);else if(u.nodeId)assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));}travel(game,u,unitSpeed(game,u));continue;}
      if(u.mode==='move')u.mode='idle';
      else if(u.mode==='toBuild'||u.mode==='build'){const b=game.buildings.find(b=>b.id===u.jobId);if(!b||b.completed||b.builderId!==u.id){releaseJob(game,u);u.mode='idle';continue;}
        u.mode='build';b.progress++;b.hp=Math.max(1,Math.round(BUILDINGS[b.type].hp*b.progress/b.duration));if(b.progress>=b.duration){b.completed=true;b.builderId=null;u.jobId=null;assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));}}
      else if(u.mode==='toNode'||u.mode==='waiting'){const n=game.nodes.find(n=>n.id===u.nodeId);if(!n||n.remaining<=0){assignGather(game,u);continue;}if(!n.miner){n.miner=u.id;u.mode='harvest';u.work=0;}else u.mode='waiting';}
      else if(u.mode==='harvest'){const n=game.nodes.find(n=>n.id===u.nodeId);if(!n||n.miner!==u.id||n.remaining<=0){assignGather(game,u);continue;}
        if(++u.work>=(game.players[u.owner].research.tools?50:60)){u.cargo=Math.min(5,n.remaining);n.remaining-=u.cargo;n.miner=null;u.work=0;if(!n.remaining)rebuildNavigation(game);returnCargo(game,u);}}
      else if(u.mode==='return'){if(u.cargo){game.players[u.owner].code+=u.cargo;game.players[u.owner].deliveries.push({tick:game.tick,amount:u.cargo});u.deliveredLoads=(u.deliveredLoads||0)+1;u.cargo=0;}assignGather(game,u,game.nodes.find(n=>n.id===u.nodeId));}
    }
    for(const p of game.players)p.deliveries=p.deliveries.filter(d=>d.tick>game.tick-1200);
    for(const b of game.buildings)if(b.completed&&b.queue.length&&game.players[b.owner].upgrade?.baseId!==b.id){const j=b.queue[0];if(j.remaining>0)j.remaining--;if(j.remaining<=0&&population(game,b.owner)+(UNIT[j.type]?.pop||1)<=supplyCap(game,b.owner)&&spawn(game,b.owner,j.type,b))b.queue.shift();}
    advancedStep(game);stepBots(game);
  }
  // T1/T2 extension. All gameplay durations below use the existing 20 Hz clock.
  const UNIT = Object.freeze({
    worker:{name:'Radnik',cost:50,ticks:300,hp:80,pop:1,speed:48,vision:7,damage:4,period:30,range:1.2,source:'base'},
    scout:{name:'Scout',cost:75,ticks:400,hp:100,pop:1,speed:64,vision:12,damage:0,source:'base'},
    guard:{name:'Čuvar',cost:60,ticks:360,hp:180,pop:2,speed:48,vision:8,damage:12,period:20,range:1.2,source:'barracks'},
    archer:{name:'Strelac',cost:90,ticks:440,hp:120,pop:2,speed:48,vision:10,damage:14,period:28,range:6,source:'barracks',tier:2,requires:'academy'},
    medic:{name:'Bolničar',cost:110,ticks:500,hp:100,pop:2,speed:48,vision:8,damage:0,source:'support',tier:2},
    breaker:{name:'Razbijač',cost:160,ticks:700,hp:300,pop:4,speed:32,vision:9,damage:10,buildingDamage:40,period:50,range:5,source:'workshop',tier:2},
    bastion:{name:'BASTION',hp:600,pop:4,speed:48,vision:12,damage:18,period:30,range:1.5,hero:true},
    pulsar:{name:'PULSAR',hp:400,pop:4,speed:48,vision:12,damage:20,period:30,range:5,hero:true},
    skyguard:{name:'Nebeski Čuvar',cost:180,ticks:700,hp:220,pop:3,speed:64,vision:10,damage:18,period:30,range:5,source:'airfield',tier:3,flying:true},
    carrier:{name:'Mostonoša',cost:220,ticks:800,hp:300,pop:4,speed:48,vision:9,damage:0,source:'airfield',tier:3,flying:true},
    shadow:{name:'Senka',cost:150,ticks:600,hp:120,pop:2,speed:64,vision:10,damage:20,period:40,range:1.2,source:'cloakCenter',tier:3},
    echo:{name:'EHO',hp:450,pop:4,speed:48,vision:12,damage:12,period:30,range:4,hero:true}
  });
  const RESEARCH=Object.freeze({tools:{name:'Efikasni alati',cost:120,ticks:800},guards:{name:'Ojačani Čuvari',cost:100,ticks:600},optics:{name:'Izviđačka optika',cost:100,ticks:600}});
  const ITEMS=Object.freeze({
    boots1:{name:'Scout čizme T1',cost:75,tier:1,stock:1,restock:1800,only:'scout'},
    boots3:{name:'Upgrade čizama T3',cost:150,tier:3,stock:1,restock:1800,only:'scout',upgrade:true},
    boots2:{name:'Upgrade čizama T2',cost:100,tier:2,stock:1,restock:1800,only:'scout',upgrade:true},
    aid:{name:'Prva pomoć',cost:30,tier:1,stock:2,restock:900,consumable:true},
    bag:{name:'Kurirska torba',cost:100,tier:2,stock:1,restock:1800,only:'scout'},
    heroBoots:{name:'Herojske čizme',cost:100,tier:2,stock:1,restock:1800,hero:true},
    crystal:{name:'Vitalni kristal',cost:120,tier:2,stock:1,restock:1800,hero:true},
    signal:{name:'Povratni signal',cost:60,tier:2,stock:2,restock:1200,only:'scout',consumable:true}
  });
  const tierOf=(g,o)=>g.players[o]?.tier||1;
  const workerLimit=(g,o)=>tierOf(g,o)>=3?12:tierOf(g,o)>=2?8:5;
  const population=(g,o)=>g.units.filter(u=>u.owner===o).reduce((n,u)=>n+(UNIT[u.type]?.pop||1),0);
  const reservedPop=(g,o)=>orders(g,o).reduce((n,j)=>n+(UNIT[j.type]?.pop||1),0)+(g.players[o].heroJob?4:0);
  const hasBuilding=(g,o,type)=>g.buildings.some(b=>b.owner===o&&b.type===type&&b.completed);
  const maxHp=(g,o)=>o.viewMaxHp|| (o.type==='base'?(o.techLevel===3?2500:o.techLevel===2?2000:1500):UNIT[o.type]?(UNIT[o.type].hp+(o.type==='guard'&&g.players[o.owner].research.guards?30:0)+(UNIT[o.type].hero?(o.level-1)*50+(o.inventory?.some(i=>i.type==='crystal')?100:0):0)):o.maxHp||BUILDINGS[o.type]?.hp||1);
  const unitSpeed=(g,u)=>(UNIT[u.type]?.speed||40)*(u.type==='scout'?(u.inventory.some(i=>i.type==='boots3')?2:u.inventory.some(i=>i.type==='boots2')?1.5:u.inventory.some(i=>i.type==='boots1')?1.2:1):UNIT[u.type]?.hero&&u.inventory.some(i=>i.type==='heroBoots')?1.15:1)*(u.slowUntil>g.tick?0.65:1);
  function armyInit(g){g.neutrals=[];g.loot=[];g.events=[];g.nextItem=1;g.shrine={id:'shrine',type:'shrine',x:1280,y:1280};g.visionCounter=0;
    for(const p of g.players)Object.assign(p,{tier:1,research:{},researchJob:null,upgrade:null,hero:null,heroJob:null,defeated:false,visible:new Uint8Array(25600),explored:new Uint8Array(25600)});
    for(const b of g.buildings)b.techLevel=1;
    for(const c of g.map.camps)Object.assign(c,{generation:0,nextSpawn:c.tier===1?600:c.tier===2?2400:6000,contribution:[0,0,0,0],seen:{}});
    for(const s of g.map.shops){s.type='shop';s.stock={};s.pending=[];for(const [k,d] of Object.entries(ITEMS))s.stock[k]=d.stock;}
    updateVision(g);
  }
  function unitExtras(u){Object.assign(u,{inventory:[],targetId:null,attackMove:null,lastDamage:-10000,cooldown:0,abilityReady:[0,0],level:1,xp:0,shield:0,shieldUntil:0,slowUntil:0});}
  function emit(g,type,owner,detail){g.events.push({tick:g.tick,type,owner,...detail});if(g.events.length>100)g.events.shift();}
  function updateVision(g){
    for(let owner=0;owner<4;owner++){const p=g.players[owner];p.visible.fill(0);const sources=[...g.units.filter(u=>u.owner===owner&&!u.transportedBy),...g.buildings.filter(b=>b.owner===owner&&b.completed)];
      for(const s of sources){const radius=UNIT[s.type]?(UNIT[s.type].vision+(s.type==='scout'&&p.research.optics?2:0)):s.type==='tower'?10:s.type==='base'?12:7,cx=Math.floor(s.x/16),cy=Math.floor(s.y/16);
        for(let y=Math.max(0,cy-radius);y<=Math.min(159,cy+radius);y++)for(let x=Math.max(0,cx-radius);x<=Math.min(159,cx+radius);x++)if((x-cx)**2+(y-cy)**2<=radius**2)p.visible[y*160+x]=p.explored[y*160+x]=1;}
    }
    if(g.match?.teams)for(let o=0;o<4;o++)for(let q=0;q<4;q++)if(o!==q&&allied(g,o,q))for(let i=0;i<25600;i++){g.players[o].visible[i]|=g.players[q].visible[i];g.players[o].explored[i]|=g.players[q].explored[i];}
    for(const c of g.map.camps)for(let o=0;o<4;o++)if(visibleTo(g,o,c)){const alive=g.neutrals.filter(n=>n.campId===c.id).length;c.seen[o]={alive,tick:g.tick,nextSpawn:alive?null:!c.generation||c.witnesses?.includes(o)?c.nextSpawn:null};}
  }
  function visibleTo(g,o,p){if(p.transportedBy)return p.owner===o;
    if(p.owner===o&&!!(UNIT[p.type]||BUILDINGS[p.type]))return true;
    if(!g.players[o]?.visible[cellIndex(clamp(p.x,0,2559),clamp(p.y,0,2559))])return false;
    if(p.type==='shadow'&&!allied(g,o,p.owner)&&!(p.revealedUntil>g.tick))return g.buildings.some(b=>b.type==='tower'&&b.completed&&b.detector&&allied(g,o,b.owner)&&distance(b,p)<=128);
    return true;
  }
  function upgradeReason(g,o,id){const p=g.players[o],b=g.bases.find(b=>b.id===id&&b.owner===o&&b.completed);
    if(!g.running||g.paused||!mayControl(g,o)||p?.defeated)return'Pokreni poligon i izaberi svoju Centralu.';
    if(!b)return'Izaberi završenu Centralu.';if(p.tier>=3)return'T3 je već naučen.';if(p.tier===2){if(p.upgrade)return'T3 unapređenje je već u toku.';if(!hasBuilding(g,o,'academy')||!hasBuilding(g,o,'workshop'))return'Potrebne Akademija i Radionica.';if(b.queue.length)return'Prvo završi red proizvodnje ove Centrale.';return availableCode(g,o)<600?'Potrebno 600 CODE.':'';}if(p.upgrade)return'T2 unapređenje je već u toku.';
    if(!hasBuilding(g,o,'barracks')||!hasBuilding(g,o,'relay'))return'Potrebne su završene Kasarna i Relej.';if(b.queue.length)return'Prvo završi red proizvodnje ove Centrale.';if(availableCode(g,o)<300)return'Potrebno 300 CODE.';return'';}
  function startUpgrade(g,o,id){const reason=upgradeReason(g,o,id);if(reason)return reason;const tier=g.players[o].tier+1,duration=tier===3?1800:1200;g.players[o].code-=tier===3?600:300;g.players[o].upgrade={baseId:id,remaining:duration,duration,tier};return null;}
  function productionReason(g,o,type,id){const d=UNIT[type],p=g.players[o],b=g.buildings.find(b=>b.id===id&&b.owner===o&&b.completed);
    if(!mayControl(g,o))return'Možeš proizvoditi samo u svojoj zgradi.';if(!g.running||g.paused||p?.defeated)return'Pokreni ili nastavi poligon.';if(!d?.source||!b||b.type!==d.source)return'Izaberi odgovarajuću završenu zgradu.';
    if(p.upgrade?.baseId===id)return'Centrala se unapređuje.';if(d.tier&&p.tier<d.tier)return'Potreban T'+d.tier+'.';if(d.requires&&!hasBuilding(g,o,d.requires))return'Potrebna završena Akademija.';
    const count=g.units.filter(u=>u.owner===o&&u.type===type).length+orders(g,o).filter(j=>j.type===type).length,limit=type==='worker'?workerLimit(g,o):type==='scout'?1:Infinity;
    if(count>=limit)return type==='scout'?'Scout je već prisutan ili naručen.':'Globalni limit: '+limit+' '+d.name+'.';if(population(g,o)+reservedPop(g,o)+d.pop>supplyCap(g,o))return'Nema slobodne populacije.';if(b.queue.length>=5)return'Proizvodni red je pun.';if(availableCode(g,o)<d.cost)return'Nedovoljno CODE-a: potrebno '+d.cost+'.';return'';}
  function startResearch(g,o,id,key){const p=g.players[o],b=g.buildings.find(b=>b.id===id&&b.type==='academy'&&b.owner===o&&b.completed),d=RESEARCH[key];
    if(!g.running||g.paused||!mayControl(g,o)||p.defeated||p.tier<2||!b||!d)return'Potrebna sopstvena T2 Akademija.';if(p.research[key])return'Istraživanje je završeno.';if(p.researchJob||b.queue.length)return'Istraživanje / proizvodnja je zauzeta.';if(availableCode(g,o)<d.cost)return'Nedovoljno CODE-a.';
    p.code-=d.cost;p.researchJob={buildingId:id,key,remaining:d.ticks,duration:d.ticks};return null;}
  function inventoryCapacity(u){return u.type==='scout'?(u.inventory.some(i=>i.type==='bag')?6:4):UNIT[u.type]?.hero?6:1;}
  function canCarry(u,key){return u.type==='scout'||UNIT[u.type]?.hero?(u.type==='scout'||!ITEMS[key].only):key==='aid';}
  function shopBuy(g,o,unitId,shopId,key){const u=g.units.find(u=>u.id===unitId&&u.owner===o),s=g.map.shops.find(s=>s.id===shopId),d=ITEMS[key],p=g.players[o];
    if(!g.running||g.paused||!mayControl(g,o)||p.defeated||!u||!s||!d||!visibleTo(g,o,s)||distance(u,s)>32)return'Priđi prodavnici na najviše 2 mapne jedinice.';
    if(p.tier<d.tier)return'Potreban T2.';if(!canCarry(u,key))return'Predmet nije namenjen toj jedinici.';if(!s.stock[key])return'Predmet nije na zalihi.';if(availableCode(g,o)<d.cost)return'Nedovoljno CODE-a.';
    const old=u.inventory.find(i=>i.type===(key==='boots3'?'boots2':'boots1'));if(d.upgrade&&!old)return'Prvo nabavi T1 čizme.';
    if(!d.consumable&&!d.upgrade&&u.inventory.some(i=>i.type===key||key==='boots1'&&['boots2','boots3'].includes(i.type)))return'Oprema je već prisutna.';
    if(!d.upgrade&&u.inventory.length>=inventoryCapacity(u))return'Inventar je pun.';
    p.code-=d.cost;s.stock[key]--;s.pending.push({key,at:g.tick+d.restock});if(d.upgrade)old.type=key;else u.inventory.push({id:'item'+g.nextItem++,type:key});return null;}
  function transferItem(g,o,fromId,toId,itemId){const a=g.units.find(u=>u.id===fromId&&u.owner===o),b=g.units.find(u=>u.id===toId&&u.owner===o),item=a?.inventory.find(i=>i.id===itemId);
    if(!g.running||g.paused||!mayControl(g,o)||!a||!b||a===b||!item||distance(a,b)>32)return'Predaja zahteva dve svoje jedinice na udaljenosti do 2.';
    if(item.type==='bag'||!canCarry(b,item.type)||ITEMS[item.type].only&&b.type!==ITEMS[item.type].only)return'Taj predmet nije prenosiv toj jedinici.';
    if(!ITEMS[item.type].consumable&&b.inventory.some(i=>i.type===item.type))return'Primalac već ima opremu.';if(b.inventory.length>=inventoryCapacity(b))return'Inventar primaoca je pun.';
    a.inventory=a.inventory.filter(i=>i!==item);b.inventory.push(item);a.hp=Math.min(a.hp,maxHp(g,a));return null;}
  function useItem(g,o,id,itemId){const u=g.units.find(u=>u.id===id&&u.owner===o),item=u?.inventory.find(i=>i.id===itemId);
    if(!g.running||g.paused||!mayControl(g,o)||!item)return'Izaberi sopstveni predmet.';
    if(item.type==='aid'){if(u.hp>=maxHp(g,u))return'Zdravlje je puno.';u.healBuff={remaining:120,started:g.tick};}
    else if(item.type==='signal'&&u.type==='scout'){const b=g.bases.filter(b=>b.owner===o&&b.completed).sort((a,b)=>distance(u,a)-distance(u,b))[0];if(!b)return'Nema završene Centrale.';releaseNode(g,u);releaseJob(g,u);u.path=[];u.targetId=null;u.mode='channel';u.channel={remaining:80,baseId:b.id};}
    else return'Oprema deluje pasivno kod odgovarajućeg nosioca.';
    u.inventory=u.inventory.filter(i=>i!==item);return null;}
  function summonHero(g,o,scoutId,type){const p=g.players[o],u=g.units.find(u=>u.id===scoutId&&u.owner===o&&u.type==='scout'),b=g.bases.find(b=>b.owner===o&&b.completed);
    if(!g.running||g.paused||!mayControl(g,o)||p.defeated||!UNIT[type]?.hero||!u||!b||distance(u,g.shrine)>32)return'Scout mora prići centralnom Svetilištu na 2 jedinice.';
    if(p.hero||p.heroJob)return'Jedan herojski izbor po igraču.';if(availableCode(g,o)<200)return'Potrebno 200 CODE.';if(population(g,o)+reservedPop(g,o)+4>supplyCap(g,o))return'Nema 4 slobodne populacije.';
    p.code-=200;p.hero={type,xp:0,level:1,inventory:[],dead:true};p.heroJob={type,baseId:b.id,remaining:600,duration:600};return null;}
  function reviveHero(g,o,id){const p=g.players[o],b=g.buildings.find(b=>b.id===id&&b.owner===o&&b.type==='altar'&&b.completed);
    if(!g.running||g.paused||!mayControl(g,o)||p.defeated||p.tier<2||!b||!p.hero?.dead||p.heroJob)return'Potreban Oltar i poginuli heroj bez aktivnog prizivanja.';
    if(availableCode(g,o)<100)return'Potrebno 100 CODE.';if(population(g,o)+reservedPop(g,o)+4>supplyCap(g,o))return'Nema 4 slobodne populacije.';
    p.code-=100;p.heroJob={type:p.hero.type,baseId:id,remaining:900,duration:900};return null;}
  function attackables(g){return [...g.units.filter(u=>!u.transportedBy),...g.neutrals,...g.buildings];}
  function edgeDistance(a,b){return b.w?Math.hypot(Math.max(0,Math.abs(a.x-b.x)-b.w/2),Math.max(0,Math.abs(a.y-b.y)-b.h/2)):Math.max(0,distance(a,b)-10);}
  function attackCommand(g,o,ids,target){if(!g.running||g.paused||!mayControl(g,o))return false;const enemy=attackables(g).find(e=>e.id===target?.id&&!allied(g,e.owner,o)&&visibleTo(g,o,e));if(!enemy)return false;
    for(const u of g.units.filter(u=>u.owner===o&&ids.includes(u.id)&&UNIT[u.type]?.damage)){releaseNode(g,u);releaseJob(g,u);u.channel=null;u.targetId=enemy.id;u.attackMove=null;u.path=[];u.mode='attack';}return true;}
  function damage(g,attacker,target,amount){if(!target||target.hp<=0||target.invulnerable||attacker&&allied(g,attacker.owner,target.owner))return 0;
    if(target.returning||target.recoverUntil>g.tick)return 0;
    if(g.auras?.some(a=>a.owner===target.owner&&a.until>g.tick&&distance(a,target)<=64))amount*=0.7;
    if(target.shieldUntil>g.tick&&target.shield>0){const absorbed=Math.min(target.shield,amount);target.shield-=absorbed;amount-=absorbed;}
    const actual=Math.min(target.hp,amount);target.hp=Math.max(0,target.hp-actual);target.lastDamage=g.tick;target.healBuff=null;if(target.teleportJob){target.teleportJob=null;target.mode='idle';}if(target.channel){target.channel=null;target.mode='idle';}
    if(target.campId&&attacker.owner>=0){const c=g.map.camps.find(c=>c.id===target.campId);c.contribution[attacker.owner]+=actual;target.targetId=attacker.id;target.lastContact=g.tick;}
    if(target.hp<=0)removeDead(g,target);return actual;}
  function removeDead(g,o){if(o.dead)return;if(o.type==='carrier')for(const passenger of g.units.filter(u=>u.transportedBy===o.id)){passenger.hp=0;removeDead(g,passenger);}clearUnitOrders(g,o);o.dead=true;
    if(UNIT[o.type]){releaseNode(g,o);releaseJob(g,o);if(UNIT[o.type].hero){const p=g.players[o.owner];p.hero={type:o.type,xp:o.xp,level:o.level,inventory:o.inventory,dead:true};}else if(o.inventory.length)g.loot.push({id:'loot'+g.nextId++,type:'loot',x:o.x,y:o.y,items:o.inventory,owner:-1,unlockAt:g.tick});g.units=g.units.filter(u=>u!==o);}
    else if(o.campId)g.neutrals=g.neutrals.filter(u=>u!==o);
    else{const builder=g.units.find(u=>u.id===o.builderId);if(builder){builder.jobId=null;builder.mode='idle';builder.path=[];}g.buildings=g.buildings.filter(b=>b!==o);g.bases=g.bases.filter(b=>b!==o);rebuildNavigation(g);}
    emit(g,'death',o.owner,{id:o.id});}
  function grantXP(g,u,amount){u.xp+=amount;const thresholds=[0,100,250,450,700];u.level=thresholds.reduce((n,t,i)=>u.xp>=t?i+1:n,1);g.players[u.owner].hero.xp=u.xp;g.players[u.owner].hero.level=u.level;}
  function ability(g,o,id,slot,point){const u=g.units.find(u=>u.id===id&&u.owner===o&&UNIT[u.type]?.hero);if(!g.running||g.paused||!mayControl(g,o)||!u||![0,1].includes(slot))return'Izaberi svog heroja.';if(slot===1&&tierOf(g,o)<2)return'Druga sposobnost zahteva T2.';if(u.abilityReady[slot]>g.tick)return'Sposobnost se obnavlja.';
    if(u.type==='bastion'){if(slot===0){u.shield=120;u.shieldUntil=g.tick+100;}else{g.auras??=[];g.auras.push({owner:o,x:u.x,y:u.y,until:g.tick+120});}u.abilityReady[slot]=g.tick+(slot?400:240);}
    else{if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.y<0||point.x>=WIDTH||point.y>=HEIGHT||distance(u,point)>96||!visibleTo(g,o,point))return'Izaberi vidljivu metu do dometa 6.';
      if(u.type==='pulsar'){const targets=attackables(g).filter(t=>t.owner!==o&&visibleTo(g,o,t)&&(slot?distance(t,point)<=32:distance(t,point)<=20));if(!targets.length)return'Nema neprijateljske mete.';for(const t of slot?targets:targets.slice(0,1))damage(g,u,t,slot?45:60);u.abilityReady[slot]=g.tick+(slot?320:200);}
      else if(slot===0){const t=g.units.find(t=>t.owner===o&&distance(t,point)<=20);if(!t||distance(u,t)>80)return'Izaberi svog saveznika do dometa 5.';t.hp=Math.min(maxHp(g,t),t.hp+80);u.abilityReady[0]=g.tick+200;}
      else{g.slowFields??=[];g.slowFields.push({owner:o,x:point.x,y:point.y,until:g.tick+120});u.abilityReady[1]=g.tick+360;}}
    emit(g,'ability',o,{id,slot});return null;}
  function pickupLoot(g,o,id,lootId){const u=g.units.find(u=>u.id===id&&u.owner===o),l=g.loot.find(l=>l.id===lootId);if(!g.running||g.paused||!mayControl(g,o)||!u||!l||distance(u,l)>32)return'Priđi plenu na 2 jedinice.';if(l.owner!==o&&l.owner!==-1&&g.tick<l.unlockAt)return'Plen je još rezervisan za drugog igrača.';
    const item=l.items.find(i=>canCarry(u,i.type)&&u.inventory.length<inventoryCapacity(u));if(!item)return'Nema mesta ili odgovarajućeg predmeta.';u.inventory.push(item);l.items=l.items.filter(i=>i!==item);if(!l.items.length)g.loot=g.loot.filter(x=>x!==l);return null;}
  function interactMove(g,o,ids,target){if(!g.running||g.paused||!mayControl(g,o)||!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))return false;const cells=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const p={x:Math.floor(target.x/16)*16+8+dx*16,y:Math.floor(target.y/16)*16+8+dy*16};if(distance(p,target)<=32&&p.x>0&&p.y>0&&p.x<WIDTH&&p.y<HEIGHT&&!g.blocked[cellIndex(p.x,p.y)])cells.push(p);}
    for(const u of g.units.filter(u=>u.owner===o&&!u.transportedBy&&ids.includes(u.id))){for(const p of cells.sort((a,b)=>distance(a,u)-distance(b,u))){const path=unitPath(g,u,p,true);if(path){command(g,o,[u.id],'move',p);break;}}}return true;}
  function startRepairNow(g,o,id,targetId){const u=g.units.find(u=>u.id===id&&u.owner===o&&u.type==='worker'),b=g.buildings.find(b=>b.id===targetId&&b.owner===o&&b.completed);if(!g.running||g.paused||!mayControl(g,o)||!u||!b||b.hp>=maxHp(g,b))return'Izaberi oštećenu sopstvenu građevinu i radnika.';releaseNode(g,u);releaseJob(g,u);u.path=[];u.targetId=b.id;u.mode='repair';u.repairWork=0;return null;}
  function rewardCamp(g,c){const total=c.contribution.reduce((a,b)=>a+b,0);if(!total)return;const code=c.tier===1?30:c.tier===2?60:120,xp=c.tier===1?40:c.tier===2?90:180,raw=c.contribution.map(x=>x/total*code),pay=raw.map(Math.floor);let left=code-pay.reduce((a,b)=>a+b,0);const rank=raw.map((x,i)=>({i,f:x-pay[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);for(let k=0;k<left;k++)pay[rank[k].i]++;
    for(let o=0;o<4;o++){if(g.players[o].defeated)continue;g.players[o].code+=pay[o];const h=g.units.find(u=>u.owner===o&&UNIT[u.type]?.hero&&distance(u,c)<=192);if(h)grantXP(g,h,xp*c.contribution[o]/total);}
    if(c.tier>=2&&c.generation===1){const owner=c.contribution.indexOf(Math.max(...c.contribution));g.loot.push({id:'loot'+g.nextId++,type:'loot',x:c.x,y:c.y,items:[{id:'item'+g.nextItem++,type:c.tier===3?'crystal':'aid'}],owner,unlockAt:g.tick+300});}
    emit(g,'camp',-1,{id:c.id,generation:c.generation});}
  function advancedStep(g){
    if(g.tick%5===0)updateVision(g);
    for(const s of g.map.shops){for(const j of s.pending.filter(j=>j.at<=g.tick))s.stock[j.key]=Math.min(ITEMS[j.key].stock,s.stock[j.key]+1);s.pending=s.pending.filter(j=>j.at>g.tick);}
    for(let o=0;o<4;o++){const p=g.players[o];
      if(p.upgrade){const j=p.upgrade,b=g.bases.find(b=>b.id===j.baseId&&b.completed);if(!b){p.upgrade=null;emit(g,'upgrade-lost',o,{});}else if(--j.remaining<=0){const ratio=b.hp/maxHp(g,b);b.techLevel=j.tier||2;b.hp=Math.round(ratio*(b.techLevel===3?2500:2000));p.tier=b.techLevel;p.upgrade=null;emit(g,'tier',o,{tier:p.tier});}}
      if(p.researchJob){const j=p.researchJob,b=g.buildings.find(b=>b.id===j.buildingId&&b.completed);if(!b)p.researchJob=null;else if(--j.remaining<=0){p.research[j.key]=true;p.researchJob=null;emit(g,'research',o,{key:j.key});}}
      if(p.heroJob){const j=p.heroJob,b=g.buildings.find(b=>b.id===j.baseId&&b.completed);if(!b){p.heroJob=null;}else if(j.remaining>0)j.remaining--;if(b&&j.remaining===0&&population(g,o)+4<=supplyCap(g,o)){const u=spawn(g,o,j.type,b);if(u){u.xp=p.hero.xp;u.level=p.hero.level;u.inventory=p.hero.inventory;u.hp=maxHp(g,u);p.hero.dead=false;p.heroJob=null;}}}
      if(!g.bases.some(b=>b.owner===o)&&!g.units.some(u=>u.owner===o&&u.type==='worker'))p.defeated=true;
    }
    for(const c of g.map.camps){
      if(!g.neutrals.some(n=>n.campId===c.id)&&c.nextSpawn<=g.tick){
        // Reserve the whole group atomically. Occupants are never teleported or crushed.
        const slots=[],occupied=[...g.units,...g.neutrals],count=c.tier===1?2:3;
        for(let ring=0;ring<=6&&slots.length<count;ring++)for(let dy=-ring;dy<=ring&&slots.length<count;dy++)for(let dx=-ring;dx<=ring&&slots.length<count;dx++){
          if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;
          const p={x:c.x+dx*16,y:c.y+dy*16};
          if(p.x<16||p.y<16||p.x>=WIDTH-16||p.y>=HEIGHT-16||!diskClear(g.blocked,p,7.2)||occupied.some(u=>distance(u,p)<7.2+unitRadius(u)+0.25)||slots.some(q=>distance(q,p)<24))continue;
          slots.push(p);
        }
        if(slots.length<count){c.nextSpawn=g.tick+20;continue;}
        c.generation++;c.nextSpawn=Infinity;c.contribution=[0,0,0,0];for(const [index,p] of slots.entries()){g.neutrals.push({id:'npc'+g.nextId++,type:'npc',owner:-1,campId:c.id,x:p.x,y:p.y,home:{...p},hp:c.tier===1?120:c.tier===3&&index===0?700:220,maxHp:c.tier===1?120:c.tier===3&&index===0?700:220,damage:c.tier===1?6:c.tier===3&&index===0?25:10,period:c.tier===3&&index===0?40:30,path:[],targetId:null,lastContact:g.tick,cooldown:0,returning:false,recoverUntil:0});}}
    }
    const targets=()=>attackables(g);const healTargets=new Set();
    for(const u of [...g.units,...g.neutrals]){
      if(u.hp<=0||u.transportedBy||u.teleportJob)continue;
      if(u.channel){const b=g.bases.find(b=>b.id===u.channel.baseId&&b.completed);if(!b){u.channel=null;u.mode='idle';}else if(--u.channel.remaining<=0){const p=availableExit(g,b,u.type);if(p){Object.assign(u,p);u.channel=null;u.mode='idle';}}continue;}
      if(u.healBuff){if(u.lastDamage>=u.healBuff.started)u.healBuff=null;else{u.hp=Math.min(maxHp(g,u),u.hp+0.5);if(--u.healBuff.remaining<=0)u.healBuff=null;}}
      if(g.slowFields?.some(f=>!allied(g,f.owner,u.owner)&&f.until>g.tick&&distance(f,u)<=64))u.slowUntil=g.tick+2;
      if(u.type==='medic'){const t=g.units.filter(t=>t!==u&&t.owner===u.owner&&t.hp<maxHp(g,t)&&g.tick-t.lastDamage>=60&&distance(u,t)<=64&&!healTargets.has(t.id)).sort((a,b)=>a.hp/maxHp(g,a)-b.hp/maxHp(g,b))[0];if(t){t.hp=Math.min(maxHp(g,t),t.hp+0.4);healTargets.add(t.id);}continue;}
      if(u.mode==='repair'){const b=g.buildings.find(b=>b.id===u.targetId&&b.owner===u.owner&&b.completed);if(!b||b.hp>=maxHp(g,b)){u.mode='idle';u.targetId=null;continue;}
        if(edgeDistance(u,b)>20){if(g.tick%10===0||!u.path.length){const p=approaches(g.blocked,b,u)[0];if(p){u.path=unitPath(g,u,p,true)||[];u.dest={x:p.x,y:p.y};u.pathRevision=g.navRevision;}}continue;}
        if(++u.repairWork>=20){u.repairWork=0;const amount=Math.min(10,maxHp(g,b)-b.hp);if(availableCode(g,u.owner)>=amount/10){g.players[u.owner].code-=amount/10;b.hp+=amount;}}continue;}
      if(u.campId){
        if(u.recoverUntil>g.tick){u.hp=Math.min(u.maxHp,u.hp+u.maxHp/100);continue;}
        if(u.returning){const p=u.path[0];if(p){travel(g,u,40);}else{u.returning=false;u.recoverUntil=g.tick+100;u.hp=Math.max(1,u.hp);if(g.neutrals.filter(n=>n.campId===u.campId).every(n=>!n.targetId&&!n.returning&&distance(n,n.home)<2))g.map.camps.find(c=>c.id===u.campId).contribution=[0,0,0,0];}continue;}
      }
      if(u.type==='worker'&&u.mode!=='attack')continue;
      const d=u.campId?{damage:u.damage,range:5,period:u.period||30,vision:4}:UNIT[u.type];if(!d?.damage||['move','toBuild','build','repair','channel','follow'].includes(u.mode))continue;
      let t=targets().find(t=>t.id===u.targetId&&!allied(g,t.owner,u.owner)&&t.hp>0&&(u.owner<0||visibleTo(g,u.owner,t)));
      if(t&&u.type==='shadow'&&(t.w||t.flying))t=null;
      if(!t){t=targets().filter(t=>!(u.type==='shadow'&&(t.w||t.flying))&&t!==u&&t.hp>0&&(u.owner<0?t.owner>=0: !allied(g,t.owner,u.owner)&&visibleTo(g,u.owner,t))&&(!t.flying||u.campId||(u.type==='archer'&&tierOf(g,u.owner)>=2||u.type==='skyguard'))&&!t.returning&&!(t.recoverUntil>g.tick)&&distance(u,t)<=d.vision*16).sort((a,b)=>distance(u,a)-distance(u,b))[0];u.targetId=t?.id||null;}
      if(u.campId){if(t&&distance(u,u.home)<=160)u.lastContact=g.tick;if(distance(u,u.home)>160||!t&&g.tick-u.lastContact>=60){if(distance(u,u.home)>2){u.returning=true;u.targetId=null;u.path=unitPath(g,u,u.home)||[];}continue;}}
      if(t?.flying&&!u.campId&&!((u.type==='archer'&&tierOf(g,u.owner)>=2)||u.type==='skyguard')){u.targetId=null;u.path=[];continue;}
      if(!t){if(u.mode==='attack'){u.mode='idle';u.path=[];}continue;}
      if(edgeDistance(u,t)>d.range*16){if(u.mode==='hold'){u.targetId=null;u.path=[];continue;}if(u.owner>=0){if(g.tick%10===0||!u.path.length){const p=t.w?approaches(g.blocked,t,u)[0]:t;if(p){u.path=unitPath(g,u,p)||[];u.dest={x:p.x,y:p.y};u.pathRevision=g.navRevision;u.mode='attack';}}}else{u.path=unitPath(g,u,t)||[];travel(g,u,40);}continue;}
      u.path=[];if(u.cooldown>g.tick)continue;u.cooldown=g.tick+d.period;if(u.type==='shadow')u.revealedUntil=g.tick+60;damage(g,u,t,(t.w&&d.buildingDamage?d.buildingDamage:d.damage)+(d.hero?(u.level-1)*2:0));
    }
    for(const b of g.buildings.filter(b=>b.type==='tower'&&b.completed)){if(b.cooldown>g.tick)continue;const t=[...g.units,...g.neutrals].find(u=>!allied(g,u.owner,b.owner)&&(!u.flying||tierOf(g,b.owner)>=2)&&distance(b,u)<=128&&visibleTo(g,b.owner,u));if(t){damage(g,b,t,15);b.cooldown=g.tick+30;}}
    for(const c of g.map.camps.filter(c=>c.generation&&c.nextSpawn===Infinity&&!g.neutrals.some(n=>n.campId===c.id))){rewardCamp(g,c);c.witnesses=[0,1,2,3].filter(o=>visibleTo(g,o,c));c.nextSpawn=g.tick+(c.tier===1?1800:c.tier===2?3000:4800);}
    g.auras=g.auras?.filter(a=>a.until>g.tick);g.slowFields=g.slowFields?.filter(a=>a.until>g.tick);
  }
  // A local controller capability is deliberately separate from the viewing player.
  const serverCapability=Symbol('server-controller'),botCapability=Symbol('bot-controller'),executingOwner=new WeakMap();
  function mayControl(g,o){return Number.isInteger(o)&&o>=0&&o<4&&(executingOwner.get(g)===o||o===g.active&&g.controllers?.[o]!=='bot'&&g.controllers?.[o]!=='inactive');}
  function resumeConstruction(g,u){executingOwner.set(g,u.owner);try{return resumeBuildNow(g,u.owner,u.id,u.jobId);}finally{executingOwner.delete(g);}}
  function controllerInit(g){g.controllers=['passive','passive','passive','passive'];g.controllers[g.active]='human';g.match={mode:'sandbox',participants:[0,1,2,3],result:null};g.bots={};g.commandQueue=[];g.commandHistory=[];g.inputSequence=[0,0,0,0];g.appliedSequence=[0,0,0,0];}
  function configureBots(g,mode='sandbox'){
    if(g.running||g.tick||!['sandbox','bot1v1'].includes(mode))return false;
    if(mode===g.match.mode)return true;
    if(g.match.mode!=='sandbox')return false; // reset creates a clean world before changing modes
    if(mode==='bot1v1'){const bot=g.active^3,participants=[g.active,bot];g.match={mode,participants,result:null};g.controllers=Array.from({length:4},(_,o)=>o===g.active?'human':o===bot?'bot':'inactive');
      g.units=g.units.filter(u=>participants.includes(u.owner));g.buildings=g.buildings.filter(b=>participants.includes(b.owner));g.bases=g.bases.filter(b=>participants.includes(b.owner));for(const n of g.nodes)if(n.miner&&!g.units.some(u=>u.id===n.miner))n.miner=null;rebuildNavigation(g);updateVision(g);
      g.bots[bot]={owner:bot,buildIndex:{},scoutIndex:0,campDone:false,openingArmy:false,log:[],lastDecision:-20};
    }return true;
  }
  const commandHandlers={loadCargo:(g,o,a)=>loadCargo(g,o,...a),unloadCargo:(g,o,a)=>unloadCargo(g,o,...a),teleport:(g,o,a)=>teleport(g,o,...a),detector:(g,o,a)=>detector(g,o,...a),
    command:(g,o,a)=>command(g,o,a[0],a[1],a[1]==='gather'&&a[2]?.id?g.nodes.find(n=>n.id===a[2].id):a[2],!!a[3]),setRally:(g,o,a)=>setRally(g,o,...a),clearPending:(g,o,a)=>clearPending(g,o,...a),purchaseGroup:(g,o,a)=>purchaseGroup(g,o,...a),purchase:(g,o,a)=>purchase(g,o,...a),beginBuild:(g,o,a)=>beginBuild(g,o,...a),resumeBuild:(g,o,a)=>resumeBuild(g,o,...a),cancelBuild:(g,o,a)=>cancelBuild(g,o,...a),startUpgrade:(g,o,a)=>startUpgrade(g,o,...a),startResearch:(g,o,a)=>startResearch(g,o,...a),shopBuy:(g,o,a)=>shopBuy(g,o,...a),transferItem:(g,o,a)=>transferItem(g,o,...a),useItem:(g,o,a)=>useItem(g,o,...a),summonHero:(g,o,a)=>summonHero(g,o,...a),reviveHero:(g,o,a)=>reviveHero(g,o,...a),ability:(g,o,a)=>ability(g,o,...a),pickupLoot:(g,o,a)=>pickupLoot(g,o,...a),interactMove:(g,o,a)=>interactMove(g,o,...a),startRepair:(g,o,a)=>startRepair(g,o,...a)
  };
  function executeCommand(g,owner,packet,capability){
    const reject=error=>({accepted:false,error,value:packet?.type==='beginBuild'?{error}:packet?.type==='command'||packet?.type==='resumeBuild'||packet?.type==='cancelBuild'||packet?.type==='interactMove'?false:error});
    if(!Number.isInteger(owner)||owner<0||owner>3||!packet||typeof packet!=='object')return reject('Nevažeći nalog.');
    if(capability===serverCapability?g.controllers[owner]!=='human':capability===botCapability?g.controllers[owner]!=='bot':owner!==g.active||g.controllers[owner]==='bot'||g.controllers[owner]==='inactive')return reject('Nemaš kontrolu nad tim igračem.');
    if(!g.running||g.paused||g.players[owner].defeated||g.match.result)return reject('Igra nije aktivna.');
    if(!Object.hasOwn(commandHandlers,packet.type)||!Array.isArray(packet.args)||packet.args.length>8)return reject('Nevažeća komanda.');
    let args;try{const json=JSON.stringify(packet.args);if(json.length>8192)return reject('Prevelika komanda.');args=JSON.parse(json);}catch{return reject('Komanda nije serijalizovana.');}
    if(packet.tick!==undefined&&packet.tick!==g.tick)return reject('Komanda ima pogrešan tick.');
    const seq=packet.seq??g.inputSequence[owner]+1;if(!Number.isSafeInteger(seq)||seq<=g.appliedSequence[owner])return reject('Dupla ili zastarela komanda.');
    g.inputSequence[owner]=Math.max(g.inputSequence[owner],seq);g.appliedSequence[owner]=seq;
    let value;executingOwner.set(g,owner);try{value=commandHandlers[packet.type](g,owner,args);}catch{value='Nevažeći argumenti komande.';}finally{executingOwner.delete(g);}
    const accepted=typeof value==='boolean'?value:value&&typeof value==='object'?'error'in value?!value.error:true:!value,error=accepted?null:typeof value==='string'?value:value?.error||'Nalog odbijen.';
    const result={accepted,error,value,seq};g.commandHistory.push({tick:g.tick,owner,seq,type:packet.type,args,accepted,error});if(g.commandHistory.length>200)g.commandHistory.shift();return result;
  }
  function processCommands(g){const due=g.commandQueue.filter(c=>c.tick<=g.tick).sort((a,b)=>a.tick-b.tick||a.owner-b.owner||a.seq-b.seq);g.commandQueue=g.commandQueue.filter(c=>c.tick>g.tick);
    for(const c of due){const r=executeCommand(g,c.owner,c,botCapability),state=g.bots[c.owner];if(state){state.log.push({tick:g.tick,type:c.type,reason:c.reason,accepted:r.accepted,error:r.error});if(state.log.length>80)state.log.shift();if(c.type==='beginBuild'&&!r.accepted)state.buildIndex[c.args[1]]=(state.buildIndex[c.args[1]]||0)+1;}}
  }
  function observePlayer(g,o){const p=g.players[o],copy=v=>JSON.parse(JSON.stringify(v));
    return {tick:g.tick,owner:o,code:availableCode(g,o),tier:p.tier,research:copy(p.research),upgrade:copy(p.upgrade),researchJob:copy(p.researchJob),hero:copy(p.hero),heroJob:copy(p.heroJob),pop:population(g,o),reserved:reservedPop(g,o),cap:supplyCap(g,o),defeated:p.defeated,
      units:copy(g.units.filter(u=>u.owner===o)),buildings:copy(g.buildings.filter(b=>b.owner===o)),
      enemies:attackables(g).filter(e=>!allied(g,e.owner,o)&&visibleTo(g,o,e)).map(e=>({id:e.id,owner:e.owner,type:e.type,x:e.x,y:e.y,hp:e.hp,w:e.w,h:e.h,campId:e.campId,returning:!!e.returning,recovering:e.recoverUntil>g.tick})),
      home:{...TEAMS[o]},enemySpawn:{...TEAMS[o^3]},camp:{...mirror({x:720,y:720},o)},shrine:{x:g.shrine.x,y:g.shrine.y}};
  }
  function planBot(v,m){
    if(v.defeated)return null;const cmd=(type,args,reason)=>({type,args,reason}),own=v.units,built=t=>v.buildings.find(b=>b.type===t&&b.completed),exists=t=>v.buildings.some(b=>b.type===t),base=built('base'),queued=t=>v.buildings.reduce((n,b)=>n+b.queue.filter(j=>j.type===t).length,0),count=t=>own.filter(u=>u.type===t).length+queued(t),workers=own.filter(u=>u.type==='worker'),army=own.filter(u=>!['worker','scout'].includes(u.type)),fighters=army.filter(u=>UNIT[u.type].damage&&!u.transportedBy&&!u.boardingId),healthy=fighters.filter(u=>u.hp/UNIT[u.type].hp>=.35),builder=workers.filter(u=>!['toBuild','build','repair'].includes(u.mode)).sort((a,b)=>(a.mode==='idle'?0:1)-(b.mode==='idle'?0:1)||(a.id<b.id?-1:1))[0];
    for(const e of v.enemies)if(e.type==='base'&&e.owner>=0)m.enemyBase={x:e.x,y:e.y};
    const danger=v.enemies.filter(e=>e.owner>=0&&distance(e,v.home)<224).sort((a,b)=>distance(a,v.home)-distance(b,v.home))[0];
    const retreat=fighters.find(u=>u.hp/UNIT[u.type].hp<.35&&distance(u,v.home)>180&&u.mode!=='move');if(retreat)return cmd('command',[[retreat.id],'move',{x:v.home.x+(v.owner%2?-144:144),y:v.home.y+(v.owner<2?112:-112)}],'Povuci ranjenog borca.');
    if(danger&&fighters.length&&fighters.some(u=>u.targetId!==danger.id))return cmd('command',[fighters.map(u=>u.id),'attack',danger],'Odbrana od trenutno viđene pretnje.');
    const idle=workers.find(u=>u.mode==='idle'&&!u.jobId);if(idle)return cmd('command',[[idle.id],'gather'],'Vrati slobodnog radnika u ekonomiju.');
    const abandoned=v.buildings.find(b=>!b.completed&&!b.builderId);if(abandoned&&builder)return cmd('resumeBuild',[builder.id,abandoned.id],'Nastavi napušteno gradilište.');
    const build=(type)=>{if(!builder||v.code<BUILDINGS[type].cost||v.buildings.some(b=>!b.completed))return null;
      const layouts={barracks:[[160,448]],relay:[[240,448],[240,512],[320,512],[400,512],[480,512],[160,96]],academy:[[160,336]],support:[[160,208]],workshop:[[448,432]],altar:[[464,304]],tower:[[464,160]]},spots=layouts[type]||[],index=(m.buildIndex[type]||0)+(type==='relay'?v.buildings.filter(b=>b.type==='relay').length:0),fallback=[96+(index%7)*64,96+(Math.floor(index/7)%7)*64],xy=spots[index]||fallback;
      return cmd('beginBuild',[builder.id,type,mirror({x:xy[0],y:xy[1]},v.owner)],'Izgradi '+BUILDINGS[type].name+'.');};
    const train=type=>{const b=built(UNIT[type].source),d=UNIT[type];return b&&!b.queue.length&&!v.upgrade&&v.code>=d.cost&&v.pop+v.reserved+d.pop<=v.cap?cmd('purchase',[type,b.id],'Obuči '+d.name+'.'):null;};
    if(v.pop+v.reserved>=v.cap-(v.tier>=2?4:2)&&v.cap<(v.tier>=3?60:v.tier===1?20:40)){const c=build('relay');if(c)return c;}
    if(base&&count('worker')<(v.tier>=3?12:v.tier===1?5:8)){const c=train('worker');if(c)return c;}
    if(!exists('barracks')){const c=build('barracks');if(c)return c;}
    if(!exists('relay')){const c=build('relay');if(c)return c;}
    if(count('scout')<1){const c=train('scout');if(c)return c;}
    if(count('guard')>=3)m.openingArmy=true;
    if(!m.openingArmy){const c=train('guard');if(c)return c;}
    if(v.tier===1&&!v.upgrade&&built('barracks')&&built('relay')&&base&&!base.queue.length&&v.code>=300)return cmd('startUpgrade',[base.id],'Sačuvaj CODE i pređi na globalni T2.');
    if(v.tier>=2){for(const t of ['academy','support','workshop','altar'])if(!exists(t)){const c=build(t);if(c)return c;}
      if(v.hero?.dead&&!v.heroJob&&built('altar')&&v.code>=100&&v.pop+v.reserved+4<=v.cap)return cmd('reviveHero',[built('altar').id],'Vrati izabranog heroja.');
      for(const [type,target]of [['guard',4],['archer',3],['medic',1],['breaker',1]])if(count(type)<target&&(type!=='archer'||built('academy'))){const c=train(type);if(c)return c;}
      const a=built('academy');if(a&&!v.researchJob)for(const key of ['tools','guards','optics'])if(!v.research[key]&&v.code>=RESEARCH[key].cost)return cmd('startResearch',[a.id,key],'Istraži '+RESEARCH[key].name+'.');
    }
    if(v.tier===2&&!v.upgrade&&base&&!base.queue.length&&built('academy')&&built('workshop')&&['tools','guards','optics'].every(k=>v.research[k])&&v.code>=600)return cmd('startUpgrade',[base.id],'Pređi na T3 istim pravilima kao čovek.');
    if(v.tier>=3){for(const t of ['airfield','cloakCenter','anchor','tower'])if(!exists(t)){const c=build(t);if(c)return c;}
      const tower=built('tower');if(tower&&!tower.detector&&!tower.detectorJob&&v.code>=75)return cmd('detector',[tower.id],'Ugradi detekciju za T3 odbranu.');
      for(const type of ['skyguard','shadow','carrier'])if(count(type)<1){const c=train(type);if(c)return c;}
      const carrier=own.find(u=>u.type==='carrier'),anchor=built('anchor');if(carrier){const passengers=own.filter(u=>u.transportedBy===carrier.id);
        if(passengers.length&&anchor&&carrier.hp<150&&!carrier.teleportJob&&!(carrier.teleportReady>v.tick)&&v.code>=40)return cmd('teleport',[carrier.id,anchor.id],'Vrati ugroženi transport do sopstvenog sidra.');
        if(passengers.length&&!carrier.path.length&&!carrier.teleportJob){if(distance(carrier,v.camp)>90)return cmd('command',[[carrier.id],'move',v.camp],'Prevezi vojsku do javne kamp lokacije.');m.transportDelivered=true;return cmd('unloadCargo',[carrier.id],'Iskrcaj na prohodno tlo.');}
        if(!m.transportDelivered&&!passengers.length&&!own.some(u=>u.boardingId===carrier.id)){const guards=own.filter(u=>u.type==='guard'&&!u.transportedBy&&distance(u,carrier)<256).slice(0,3);if(guards.length)return cmd('loadCargo',[carrier.id,guards.map(u=>u.id)],'Ukrcaj legalan teret Mostonoše.');}
      }
    }
    const scout=own.find(u=>u.type==='scout');if(scout){
      if(!v.hero&&base&&v.code>=200&&v.pop+v.reserved+4<=v.cap&&distance(scout,v.shrine)<=32)return cmd('summonHero',[scout.id,'bastion'],'Scout je posetio Svetilište.');
      const points=!v.hero?[v.shrine,v.enemySpawn]:[v.enemySpawn,v.camp,v.shrine],goal=points[m.scoutIndex%points.length];if(distance(scout,goal)<90)m.scoutIndex++;
      if(scout.mode==='idle'||scout.mode==='blocked'&&v.tick-(m.scoutOrder||0)>200){m.scoutOrder=v.tick;return cmd('command',[[scout.id],'move',points[m.scoutIndex%points.length]],'Izvidi javnu mapnu lokaciju.');}
    }
    const hero=own.find(u=>UNIT[u.type].hero),near=hero&&v.enemies.some(e=>distance(e,hero)<96);if(hero&&near){if(hero.abilityReady[0]<=v.tick)return cmd('ability',[hero.id,0],'Aktiviraj štit u viđenoj borbi.');if(v.tier>=2&&hero.abilityReady[1]<=v.tick)return cmd('ability',[hero.id,1],'Zaštiti obližnju vojsku.');}
    if(healthy.length>=3){const center={x:healthy.reduce((s,u)=>s+u.x,0)/healthy.length,y:healthy.reduce((s,u)=>s+u.y,0)/healthy.length},target=v.enemies.filter(e=>!e.returning&&!e.recovering&&distance(center,e)<320).sort((a,b)=>distance(center,a)-distance(center,b))[0];
      if(target&&healthy.some(u=>u.targetId!==target.id))return cmd('command',[healthy.map(u=>u.id),'attack',target],'Napadni trenutno vidljivu metu.');
      if(!target&&!healthy.some(u=>u.path.length||u.mode==='attack')){if(distance(center,v.camp)<128)m.campDone=true;const goal=m.campDone?(m.enemyBase||v.enemySpawn):v.camp;return cmd('command',[army.filter(u=>!fighters.includes(u)||healthy.includes(u)).map(u=>u.id),'move',goal],m.campDone?'Istraži zapamćenu ili početnu neprijateljsku lokaciju.':'Pošalji vojsku prema najbližem T1 kampu.');}
    }return null;
  }
  function stepBots(g){if(g.match.mode!=='bot1v1')return;
    const participants=g.match.participants,alive=participants.filter(o=>!g.players[o].defeated);if(alive.length<2){g.match.result={winner:alive[0]??null,tick:g.tick};g.running=false;g.paused=true;return;}
    for(const [key,m]of Object.entries(g.bots)){const o=Number(key);if(g.players[o].defeated||g.tick-m.lastDecision<20||g.commandQueue.some(c=>c.owner===o))continue;m.lastDecision=g.tick;const decision=planBot(observePlayer(g,o),m);if(decision)g.commandQueue.push({...decision,owner:o,tick:g.tick+1,seq:++g.inputSequence[o]});}
  }

  // 0.6.2: serialized unit tasks. No live entity references in orders or rally data.
  const ORDER_LIMIT=32;
  const availableCode=(g,o)=>Math.max(0,g.players[o].code-(g.players[o].reservedCode||0));
  function plannedTowers(g,o,except=null){return g.units.filter(u=>u.owner===o&&u.id!==except).flatMap(u=>[u.activeOrder,...(u.orderQueue||[])]).filter(q=>q?.type==='build'&&q.buildType==='tower'&&!q.buildingId&&q.reservation>0).length;}
  const pointCopy=p=>({x:p.x,y:p.y});
  function controlled(g,o,fn){const prev=executingOwner.get(g);executingOwner.set(g,o);try{return fn();}finally{if(prev===undefined)executingOwner.delete(g);else executingOwner.set(g,prev);}}
  function tasks(u){u.orderQueue??=[];u.activeOrder??=null;u.deliveredLoads??=0;return u;}
  function releaseReservation(g,u,order){if(order?.reservation){g.players[u.owner].reservedCode=Math.max(0,(g.players[u.owner].reservedCode||0)-order.reservation);order.reservation=0;}}
  function clearUnitOrders(g,u,includeActive=true){if(includeActive){u.trafficYield=null;u.teleportJob=null;u.boardingId=null;}tasks(u);for(const q of u.orderQueue)releaseReservation(g,u,q);u.orderQueue=[];if(includeActive){releaseReservation(g,u,u.activeOrder);u.activeOrder=null;}}
  function clearPending(g,o,ids){if(!g.running||g.paused||!mayControl(g,o)||g.players[o].defeated)return false;let n=0;for(const u of g.units.filter(u=>u.owner===o&&!u.transportedBy&&ids.includes(u.id))){clearUnitOrders(g,u,false);if(u.activeOrder&&!u.activeOrder.started){releaseReservation(g,u,u.activeOrder);u.activeOrder=null;u.orderError=null;}n++;}return !!n;}
  function inferTask(g,u){if(u.jobId)return{type:'build',buildingId:u.jobId,started:true};if(u.type==='worker'&&u.nodeId)return{type:'gather',targetId:u.nodeId,started:true,startDelivery:u.deliveredLoads||0};if(u.mode==='repair')return{type:'repair',targetId:u.targetId,started:true};if(u.mode==='attack'&&u.targetId)return{type:'attack',targetId:u.targetId,started:true};if(u.path.length&&u.dest)return{type:'move',point:pointCopy(u.dest),started:true};return null;}
  function validateTask(g,u,q){
    if(!q||!['move','attack','gather','repair','build','attackMove','hold','patrol','follow'].includes(q.type))return'Nepoznat nalog.';
    if(['move','attackMove','patrol'].includes(q.type)&&(!q.point||!Number.isFinite(q.point.x)||!Number.isFinite(q.point.y)||q.point.x<0||q.point.y<0||q.point.x>=WIDTH||q.point.y>=HEIGHT))return'Cilj je van mape.';
    if(q.type==='attack'){const t=attackables(g).find(t=>t.id===q.targetId&&!allied(g,t.owner,u.owner)&&visibleTo(g,u.owner,t));if(!t||!UNIT[u.type]?.damage)return'Potrebna vidljiva neprijateljska meta i borac.';}
    if(q.type==='follow'&&!g.units.some(t=>t.id===q.targetId&&t.owner===u.owner&&t!==u))return'Izaberi drugu sopstvenu jedinicu.';
    if(q.type==='gather'&&(u.type!=='worker'||q.targetId&&!g.nodes.some(n=>n.id===q.targetId&&n.remaining>0)))return'Izaberi radnika i važeći CODE.';
    if(q.type==='repair'&&(u.type!=='worker'||!g.buildings.some(b=>b.id===q.targetId&&b.owner===u.owner&&b.completed&&b.hp<maxHp(g,b))))return'Izaberi oštećenu sopstvenu zgradu.';
    if(q.type==='build'&&q.buildingId&&!g.buildings.some(b=>b.id===q.buildingId&&b.owner===u.owner&&!b.completed))return'Gradilište nije dostupno.';
    if(q.type==='build'&&!q.buildingId){const d=BUILDINGS[q.buildType];if(u.type!=='worker'||!d)return'Izaberi graditelja.';if(d.tier&&tierOf(g,u.owner)<d.tier)return'Potreban T2.';if(availableCode(g,u.owner)<d.cost)return'Nedovoljno slobodnog CODE-a.';const r=placement(g,u.owner,q.buildType,q.point,u.id,true);if(r.error)return r.error;
      if(q.buildType==='tower'){const pending=g.units.filter(v=>v.owner===u.owner).flatMap(v=>[v.activeOrder,...(v.orderQueue||[])]).filter(v=>v?.type==='build'&&v.buildType==='tower'&&!v.buildingId).length;if(pending+g.buildings.filter(b=>b.owner===u.owner&&b.type==='tower').length>=2)return'Limit dve kule sa planovima.';}}
    return null;
  }
  function beginTask(g,u,q){q.started=true;q.startedTick=g.tick;u.channel=null;u.orderError=null;
    if(q.type==='build'){
      if(q.buildingId){const b=g.buildings.find(b=>b.id===q.buildingId);if(!b||b.completed)return null;return resumeBuildNow(g,u.owner,u.id,b.id)?null:'Gradilište čeka pristup.';}
      const reserved=q.reservation||0;releaseReservation(g,u,q);const r=beginBuildNow(g,u.owner,u.id,q.buildType,q.point);
      if(r.error){q.reservation=reserved;g.players[u.owner].reservedCode=(g.players[u.owner].reservedCode||0)+reserved;q.started=false;return r.error;}q.buildingId=r.building.id;return null;
    }
    if(q.type==='repair')return startRepairNow(g,u.owner,u.id,q.targetId);
    if(q.type==='gather'){q.startDelivery=u.deliveredLoads||0;const n=q.targetId?g.nodes.find(n=>n.id===q.targetId):null;return commandNow(g,u.owner,[u.id],'gather',n)?null:'Skupljanje nije prihvaćeno.';}
    if(q.type==='attack')return commandNow(g,u.owner,[u.id],'attack',{id:q.targetId})?null:'Meta više nije vidljiva.';
    if(q.type==='hold'){commandNow(g,u.owner,[u.id],'stop');u.mode='hold';return null;}
    releaseNode(g,u);releaseJob(g,u);u.nodeId=null;u.targetId=null;
    if(q.type==='follow'){q.lastPosition=pointCopy(g.units.find(t=>t.id===q.targetId)||u);u.path=[];u.mode='follow';return null;}
    if(q.type==='patrol'){q.origin??=pointCopy(u);q.leg=1;}
    moveTo(g,u,q.point,q.type==='move'?'move':q.type);q.arrivalPoint=pointCopy(u.path.at(-1)||q.point);return null;
  }
  function submitTasks(g,o,ids,template,append=false){if(!g.running||g.paused||!mayControl(g,o)||g.players[o].defeated||!Array.isArray(ids))return{accepted:0,total:0,errors:['Igra nije aktivna.']};const us=g.units.filter(u=>u.owner===o&&!u.transportedBy&&ids.includes(u.id)),errors=[];let accepted=0;
    const slots=['move','attackMove','patrol'].includes(template?.type)&&us.length>1&&template.point?formationTargets(g,us,template.point):null;
    for(const u of us){tasks(u);const q=JSON.parse(JSON.stringify(template));if(slots){const p=slots.get(u.id);if(!p){errors.push('Nema slobodnog dolaska.');continue;}q.point=p;}
      const error=validateTask(g,u,q);if(error){errors.push(error);continue;}
      if(append&&u.orderQueue.length+(u.activeOrder||inferTask(g,u)?1:0)>=ORDER_LIMIT){errors.push('Red je pun: '+ORDER_LIMIT+'.');continue;}
      if(!append){clearUnitOrders(g,u);releaseNode(g,u);releaseJob(g,u);}else if(!u.activeOrder)u.activeOrder=inferTask(g,u);
      if(q.type==='build'&&!q.buildingId){q.reservation=BUILDINGS[q.buildType].cost;g.players[o].reservedCode=(g.players[o].reservedCode||0)+q.reservation;}
      if(append&&u.activeOrder)u.orderQueue.push(q);else{u.activeOrder=q;const reason=beginTask(g,u,q);if(reason){u.orderError=reason;if(q.type!=='build'){releaseReservation(g,u,q);u.activeOrder=null;errors.push(reason);continue;}}}accepted++;
    }g.lastOrderBatch={accepted,total:us.length,errors};return g.lastOrderBatch;
  }
  function command(g,o,ids,action,target,append=false){if(action==='stop'){if(!g.running||g.paused||!mayControl(g,o)||g.players[o].defeated)return false;for(const u of g.units.filter(u=>u.owner===o&&!u.transportedBy&&ids.includes(u.id)))clearUnitOrders(g,u);return commandNow(g,o,ids,action,target);}
    const q={type:action};if(['move','attackMove','patrol'].includes(action))q.point=target&&pointCopy(target);else if(['attack','repair','follow'].includes(action))q.targetId=target?.id;else if(action==='build')q.buildingId=target?.id;else if(action==='gather')q.targetId=target?.id||null;
    return submitTasks(g,o,ids,q,append).accepted>0;
  }
  function beginBuild(g,o,id,type,p,append=false){if(append){const r=submitTasks(g,o,[id],{type:'build',buildType:type,point:pointCopy(p)},true);return{queued:r.accepted>0,error:r.accepted?null:r.errors[0]||'Nalog nije prihvaćen.'};}
    if(!g.running||g.paused||!mayControl(g,o)||g.players[o].defeated)return{error:'Igra nije aktivna ili nemaš kontrolu.'};const u=g.units.find(u=>u.id===id&&u.owner===o);const check=placement(g,o,type,p,id,false,id);if(check.error||!u)return check;const held=[u.activeOrder,...(u.orderQueue||[])].reduce((n,q)=>n+(q?.reservation||0),0);if(availableCode(g,o)+held<BUILDINGS[type].cost)return{error:'Nedovoljno slobodnog CODE-a.'};clearUnitOrders(g,u);const r=beginBuildNow(g,o,id,type,p);if(!r.error)u.activeOrder={type:'build',buildingId:r.building.id,started:true};return r;
  }
  function resumeBuild(g,o,id,buildingId){const r=resumeBuildNow(g,o,id,buildingId);if(r){const u=g.units.find(u=>u.id===id);clearUnitOrders(g,u);u.activeOrder={type:'build',buildingId,started:true};}return r;}
  function cancelBuild(g,o,id){const r=cancelBuildNow(g,o,id);if(r)for(const u of g.units)if(u.activeOrder?.buildingId===id)u.activeOrder=null;return r;}
  function startRepair(g,o,id,targetId,append=false){return submitTasks(g,o,[id],{type:'repair',targetId},append).accepted?null:'Popravka nije prihvaćena.';}
  function taskDone(g,u,q){if(!q.started)return false;
    if(q.type==='build'){const b=g.buildings.find(b=>b.id===q.buildingId);return !!q.buildingId&&(!b||b.completed);}
    if(q.type==='repair'){const b=g.buildings.find(b=>b.id===q.targetId);return !b||b.hp>=maxHp(g,b);}
    if(q.type==='attack'){const t=attackables(g).find(t=>t.id===q.targetId);return !t||!visibleTo(g,u.owner,t);}
    if(q.type==='gather')return u.orderQueue.length>0&&((u.deliveredLoads||0)>q.startDelivery||!u.cargo&&!u.work&&!['harvest','return'].includes(u.mode));
    if(['move','attackMove'].includes(q.type))return !u.path.length&&!u.targetId&&u.mode!=='blocked'&&distance(u,q.arrivalPoint||q.point)<=1;
    return false;
  }
  function advanceTasks(g){for(const u of [...g.units]){if(u.transportedBy||u.teleportJob)continue;tasks(u);controlled(g,u.owner,()=>{
      if(u.activeOrder&&taskDone(g,u,u.activeOrder)){releaseReservation(g,u,u.activeOrder);u.activeOrder=null;u.orderError=null;if(u.orderQueue.length){releaseNode(g,u);releaseJob(g,u);u.path=[];u.targetId=null;u.mode='idle';}}
      if(!u.activeOrder&&u.orderQueue.length)u.activeOrder=u.orderQueue.shift();const q=u.activeOrder;if(!q)return;
      if(!q.started){if(g.tick%20===0||!q.lastAttempt){q.lastAttempt=g.tick;u.orderError=beginTask(g,u,q);}return;}
      if(q.type==='hold'){u.mode='hold';u.path=[];}
      if(q.type==='follow'){
        const t=g.units.find(t=>t.id===q.targetId&&t.owner===u.owner);if(!t){q.type='move';q.point=q.lastPosition;u.targetId=null;moveTo(g,u,q.point,'move');return;}
        q.lastPosition=pointCopy(t);u.targetId=null;if(distance(u,t)>unitRadius(u)+unitRadius(t)+18){if(g.tick%10===0||!u.path.length){const angle=Math.atan2(u.y-t.y,u.x-t.x),r=unitRadius(u)+unitRadius(t)+20,p={x:t.x+Math.cos(angle)*r,y:t.y+Math.sin(angle)*r};moveTo(g,u,p,'follow');}}else{u.path=[];u.mode='follow';}
      }
      if(['attackMove','patrol'].includes(q.type)){
        const enemy=attackables(g).find(t=>t.id===u.targetId&&t.hp>0&&visibleTo(g,u.owner,t)&&!allied(g,t.owner,u.owner));if(enemy)return;u.targetId=null;
        if(!u.path.length&&u.mode!=='blocked'){if(q.type==='patrol'&&distance(u,q.leg?q.point:q.origin)<32)q.leg=q.leg?0:1;moveTo(g,u,q.type==='patrol'?(q.leg?q.point:q.origin):q.point,q.type);}
      }
    });}}
  function producer(b){return ['base','barracks','support','workshop','altar','airfield','cloakCenter'].includes(b.type);}
  function setRally(g,o,ids,target){if(!g.running||g.paused||!mayControl(g,o)||g.players[o].defeated||!Array.isArray(ids))return'Izaberi svoje proizvođače.';let rally=null;
    if(target){const n=g.nodes.find(n=>n.id===target.id),u=g.units.find(u=>u.id===target.id&&u.owner===o);if(u)rally={kind:'unit',targetId:u.id,point:pointCopy(u)};else if(n&&g.players[o].explored[cellIndex(n.x,n.y)])rally={kind:'resource',targetId:n.id,field:n.field,fieldOwner:n.owner,point:pointCopy(n)};else if(Number.isFinite(target.x)&&Number.isFinite(target.y)&&target.x>=0&&target.y>=0&&target.x<WIDTH&&target.y<HEIGHT)rally={kind:'point',point:pointCopy(target)};else return'Nevažeći rally cilj.';}
    const bs=g.buildings.filter(b=>b.owner===o&&ids.includes(b.id)&&producer(b));if(!bs.length)return'Izaberi proizvođača jedinica.';for(const b of bs){b.rally=rally?JSON.parse(JSON.stringify(rally)):null;b.rallyInvalid=false;}return null;
  }
  function applyRally(g,u,b){const r=b.rally;if(!r)return false;controlled(g,u.owner,()=>{if(r.kind==='unit'){const t=g.units.find(t=>t.id===r.targetId&&t.owner===u.owner);if(t)command(g,u.owner,[u.id],'follow',t);else b.rallyInvalid=true;}
      else if(r.kind==='resource'&&u.type==='worker'){const n=g.nodes.find(n=>n.id===r.targetId&&n.remaining>0)||g.nodes.find(n=>n.owner===r.fieldOwner&&n.field===r.field&&n.remaining>0);if(n)command(g,u.owner,[u.id],'gather',n);else u.orderError='Rally CODE je iscrpljen.';}
      else{let p=r.point;if(r.kind==='resource'){const n=g.nodes.find(n=>n.id===r.targetId);if(n)p={x:n.x+32,y:n.y+32};}const slots=formationTargets(g,[u],p),goal=slots.get(u.id);if(goal)command(g,u.owner,[u.id],'move',goal);else u.orderError='Rally čeka slobodno mesto.';}
    });return true;
  }
  function purchaseGroup(g,o,type,ids){const acceptedIds=[],errors=[];for(const id of [...new Set(ids)].filter(id=>g.buildings.some(b=>b.id===id&&b.owner===o&&b.completed&&b.type===UNIT[type]?.source))){const e=purchase(g,o,type,id);if(e)errors.push(e);else acceptedIds.push(id);}return{acceptedIds,errors,error:acceptedIds.length?null:errors[0]||'Nema odgovarajuće proizvodnje.'};}

  function t3Authority(g,o){return g.running&&!g.paused&&mayControl(g,o)&&!g.players[o]?.defeated;}
  function loadCargo(g,o,id,ids){if(!t3Authority(g,o)||!Array.isArray(ids))return'Nevažeći utovar.';const c=g.units.find(u=>u.id===id&&u.owner===o&&u.type==='carrier');if(!c||c.teleportJob)return'Izaberi sopstvenu Mostonošu.';
    let pop=g.units.filter(u=>u.transportedBy===id||u.boardingId===id).reduce((n,u)=>n+UNIT[u.type].pop,0),accepted=0;
    for(const u of g.units.filter(u=>ids.includes(u.id)&&u.owner===o&&!UNIT[u.type].flying&&!u.transportedBy&&!u.boardingId)){if(pop+UNIT[u.type].pop>6)continue;clearUnitOrders(g,u);releaseNode(g,u);releaseJob(g,u);u.boardingId=id;u.mode='move';u.path=unitPath(g,u,c)||[];u.dest={x:c.x,y:c.y};pop+=UNIT[u.type].pop;accepted++;}return accepted?null:'Nema mesta ili dozvoljenih putnika.';
  }
  function unloadCargo(g,o,id){if(!t3Authority(g,o))return'Pokreni meč.';const c=g.units.find(u=>u.id===id&&u.type==='carrier'&&u.owner===o);if(!c||c.path.length||c.teleportJob||!diskClear(g.blocked,c,7.2))return'Mostonoša mora mirovati iznad prohodnog tla.';let count=0;
    for(const u of g.units.filter(u=>u.transportedBy===id)){let goal=null;for(let ring=1;ring<=8&&!goal;ring++)for(let dy=-ring;dy<=ring&&!goal;dy++)for(let dx=-ring;dx<=ring&&!goal;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;const p={x:c.x+dx*16,y:c.y+dy*16};if(freeArrival(g,u,p))goal=p;}if(goal){u.transportedBy=null;Object.assign(u,goal);u.mode='idle';u.path=[];count++;}}return count?null:'Iskrcavanje čeka slobodno mesto.';
  }
  function teleport(g,o,id,anchorId){if(!t3Authority(g,o))return'Pokreni meč.';const u=g.units.find(u=>u.id===id&&u.owner===o&&u.type==='carrier'),b=g.buildings.find(b=>b.id===anchorId&&b.owner===o&&b.type==='anchor'&&b.completed);
    if(!u||!b||u.teleportJob||u.teleportReady>g.tick||availableCode(g,o)<40)return'Nevažeći skok, cooldown ili nedovoljno CODE-a.';clearUnitOrders(g,u);u.path=[];u.mode='channel';u.teleportJob={anchorId,remaining:100};u.teleportReady=g.tick+1200;g.players[o].code-=40;return null;
  }
  function detector(g,o,id){const b=g.buildings.find(b=>b.id===id&&b.owner===o&&b.type==='tower'&&b.completed);if(!t3Authority(g,o)||g.players[o].tier<2||!b||b.detector||b.detectorJob||availableCode(g,o)<75)return'Potreban T2, kula i 75 CODE.';g.players[o].code-=75;b.detectorJob=400;return null;}
  function t3Step(g){for(const b of g.buildings)if(b.detectorJob&&--b.detectorJob===0)b.detector=true;
    for(const u of [...g.units]){if(u.transportedBy){const c=g.units.find(c=>c.id===u.transportedBy);if(c){u.x=c.x;u.y=c.y;}continue;}
      if(u.boardingId){const c=g.units.find(c=>c.id===u.boardingId);if(!c){u.boardingId=null;continue;}if(distance(u,c)<=32&&!c.path.length&&!c.teleportJob&&diskClear(g.blocked,c,unitRadius(u))){u.transportedBy=c.id;u.boardingId=null;u.path=[];u.mode='transported';continue;}if(g.tick%20===0){u.path=unitPath(g,u,c)||[];u.dest={x:c.x,y:c.y};}}
      if(u.teleportJob){const b=g.buildings.find(b=>b.id===u.teleportJob.anchorId&&b.owner===u.owner&&b.completed);if(!b){u.teleportJob=null;u.mode='idle';}else if(--u.teleportJob.remaining<=0){const point=availableExit(g,b,u.type);if(point){Object.assign(u,point);u.teleportJob=null;u.mode='idle';}else u.teleportJob.remaining=1;}}
    }
  }
  const API={rebuildNavigation,serverCommand:(g,o,p)=>executeCommand(g,o,p,serverCapability),allied,loadCargo,unloadCargo,teleport,detector,availableCode,submitTasks,setRally,clearPending,purchaseGroup,configureBots,executeCommand,observePlayer,planBot,unitRadius,diskClear,clearanceMask,staticSegment,unitPath,motionClear,formationTargets,UNIT,ITEMS,RESEARCH,tierOf,workerLimit,population,reservedPop,maxHp,unitSpeed,upgradeReason,startUpgrade,productionReason,startResearch,inventoryCapacity,shopBuy,transferItem,useItem,summonHero,reviveHero,attackCommand,damage,ability,pickupLoot,interactMove,startRepair,updateVision,visibleTo,RULES,WIDTH,HEIGHT,TEAMS,BUILDINGS,createGame,purchase,command,step,pathfind,assignGather,placement,beginBuild,resumeBuild,cancelBuild,supplyCap,cellIndex,cellPoint,footprint};
  if(typeof module!=='undefined'&&module.exports)module.exports=API;
  if(typeof document==='undefined')return;

  const $=id=>document.getElementById(id),canvas=$('battlefield'),mini=$('minimap'),mctx=mini.getContext('2d');
  let ctx=canvas.getContext('2d'),game=createGame(),selected=['base0'],started=false,camera={x:WIDTH/2,y:HEIGHT/2,scale:1},view={width:1,height:1};
  let targetMode=null,interactionTarget=null,debugNavigation=false,cameraDrag=null,miniDrag=null,mouseInside=false,activeSubtype=null,lastSelectionClick=null,lastBindingPress=null,groupBarSignature='';
  let pointer=null,mouse={x:0,y:0},orderMarker=null,noticeTimer,lastTime=0,accumulator=0,buildMode=null,preview=null,previewKey='',terrainCache=null;
  const CLIENT_RULES_HASH='81eafe5dc45090c1';let net=null;
  const bindings=new Map();let draftKey=null,cameraHistory=[],lastIdle=null;
  function humanAction(type,...args){if(type==='command'&&args[2]?.id)args[2]={id:args[2].id,x:args[2].x,y:args[2].y};if(type==='setRally'&&args[1])args[1]={id:args[1].id,x:args[1].x,y:args[1].y};if(type==='interactMove'&&args[1])args[1]={id:args[1].id,x:args[1].x,y:args[1].y};if(net){if(net.ws?.readyState!==WebSocket.OPEN||!started){notify('Mreža nije spremna.');return type==='beginBuild'?{error:'Nema veze.'}:false;}net.ws.send(JSON.stringify({kind:'command',seq:++net.seq,type,args}));notify('Nalog poslat · čeka server.');return type==='beginBuild'?{queued:true,error:null}:type==='purchaseGroup'?{acceptedIds:[],errors:['Čeka server']}:['command','resumeBuild','cancelBuild','interactMove','clearPending'].includes(type)?true:null;}return executeCommand(game,game.active,{type,args,tick:game.tick}).value;}
  const keys=new Set(),modes={idle:'Nezaposlen',move:'Kretanje',toNode:'Ide po CODE',waiting:'Čeka nalazište',harvest:'Skuplja CODE',return:'Nosi CODE',toBuild:'Ide do gradilišta',build:'Gradi',blocked:'Čeka slobodan prolaz'};
  function notify(text){$('notice').textContent=text;$('notice').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('show'),3600);}
  function rememberCamera(){cameraHistory.push({...camera});if(cameraHistory.length>24)cameraHistory.shift();}
  function jumpCamera(target){rememberCamera();camera.x=clamp(target.x,0,WIDTH);camera.y=clamp(target.y,0,HEIGHT);if(target.scale)camera.scale=clamp(target.scale,Math.min(view.width/(WIDTH+80),view.height/(HEIGHT+80)),2);pointer=null;keys.clear();previewKey='';}
  function fit(){rememberCamera();camera.scale=Math.min(view.width/(WIDTH+80),view.height/(HEIGHT+80));camera.x=WIDTH/2;camera.y=HEIGHT/2;}
  function home(){rememberCamera();const b=game.bases.find(b=>b.owner===game.active)||game.units.find(u=>u.owner===game.active);if(!b)return;camera.scale=Math.min(1.5,view.width/900,view.height/760);camera.x=b.x+(b.x<1280?130:-130);camera.y=b.y+(b.y<1280?90:-90);}
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);view.width=r.width;view.height=r.height;canvas.width=r.width*dpr;canvas.height=r.height*dpr;if(!started)fit();}
  function world(x,y){return{x:(x-view.width/2)/camera.scale+camera.x,y:(y-view.height/2)/camera.scale+camera.y};}
  function pos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function zoom(f,p={x:view.width/2,y:view.height/2}){const before=world(p.x,p.y);camera.scale=clamp(camera.scale*f,Math.min(view.width/(WIDTH+80),view.height/(HEIGHT+80)),2);const after=world(p.x,p.y);camera.x+=before.x-after.x;camera.y+=before.y-after.y;}
  function hit(p){return [...game.neutrals,...game.units].filter(u=>!u.transportedBy&&visibleTo(game,game.active,u)&&distance(u,p)<18).sort((a,b)=>distance(a,p)-distance(b,p))[0]||game.buildings.find(b=>inside(p,b))||game.nodes.find(n=>distance(n,p)<21)||[...game.map.shops,game.shrine,...game.loot].find(n=>distance(n,p)<24);}
  function endPlacement(){buildMode=null;preview=null;previewKey='';$('build-status').hidden=true;canvas.classList.remove('placing');}
  function chooseBuild(type){const u=game.units.find(u=>selected.includes(u.id)&&u.owner===game.active&&u.type==='worker');if(!started||game.paused||!u)return notify('Izaberi svog radnika i nastavi poligon.');
    buildMode={type,workerId:u.id};previewKey='';canvas.classList.add('placing');notify(BUILDINGS[type].name+': levi klik postavlja, desni klik ili Escape odustaje.');updatePreview();}
  function updatePreview(){if(!buildMode)return;const p=world(mouse.x,mouse.y),r=footprint(buildMode.type,p),key=[r.x,r.y,game.navRevision,Math.floor(game.tick/5),buildMode.workerId].join(':');
    if(key===previewKey)return;previewKey=key;preview=placement(game,game.active,buildMode.type,p,buildMode.workerId);
    const cost=BUILDINGS[buildMode.type].cost;if(!preview.error&&availableCode(game,game.active)<cost)preview={...preview,error:'Nedovoljno CODE-a.'};
    $('build-status').hidden=false;$('build-status').classList.toggle('invalid',!!preview.error);$('build-status').textContent=BUILDINGS[buildMode.type].name+' · '+cost+' CODE — '+(preview.error||'Lokacija dostupna. Levi klik za gradnju.');}
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{canvas.focus();mouse=pos(e);const p=world(mouse.x,mouse.y);
    if(e.button===1){e.preventDefault();if(started&&!dialog.open){rememberCamera();cameraDrag=mouse;canvas.setPointerCapture(e.pointerId);}return;}
    if(targetMode){if(e.button===2){targetMode=null;return;}if(e.button===0){resolveTarget(p,appendInput(e));return;}}
    if(buildMode){if(e.button===2){endPlacement();return;}if(e.button===0){const append=appendInput(e),workerId=buildMode.workerId,result=humanAction('beginBuild',workerId,buildMode.type,p,append);if(result.error){notify(result.error);previewKey='';return;}if(append){selected=[workerId];previewKey='';notify('Dodato u red graditelja.');}else if(net){selected=[workerId];endPlacement();notify('Gradnja poslata · čeka server.');}else{selected=[result.building.id];notify(BUILDINGS[result.building.type].name+' naručena.');endPlacement();}updateHUD();}return;}
    if(e.button===2){contextOrder(p,e);return;}
    if(e.button===0){pointer={start:mouse,end:mouse,shift:e.shiftKey,ctrl:e.ctrlKey};canvas.setPointerCapture(e.pointerId);}
  });
  canvas.addEventListener('pointermove',e=>{mouse=pos(e);if(cameraDrag){const invert=$('drag-invert').checked?1:-1;camera.x=clamp(camera.x+(mouse.x-cameraDrag.x)*invert/camera.scale,0,WIDTH);camera.y=clamp(camera.y+(mouse.y-cameraDrag.y)*invert/camera.scale,0,HEIGHT);cameraDrag=mouse;previewKey='';return;}if(pointer)pointer.end=mouse;if(buildMode)updatePreview();});
  canvas.addEventListener('pointerup',e=>{if(cameraDrag){cameraDrag=null;return;}if(!pointer||e.button!==0)return;const a=world(pointer.start.x,pointer.start.y),b=world(pointer.end.x,pointer.end.y);let ids;
    if(distance(pointer.start,pointer.end)>5)ids=game.units.filter(u=>u.owner===game.active&&u.x>=Math.min(a.x,b.x)&&u.x<=Math.max(a.x,b.x)&&u.y>=Math.min(a.y,b.y)&&u.y<=Math.max(a.y,b.y)).map(u=>u.id);
    else{const object=hit(b);if(object&&['shop','shrine','loot'].includes(object.type)){interactionTarget=object;updateInteraction();pointer=null;return;}const same=object&&object.owner===game.active&&(pointer.ctrl||!pointer.shift&&lastSelectionClick?.id===object.id&&performance.now()-lastSelectionClick.time<300);lastSelectionClick=object?{id:object.id,time:performance.now()}:null;ids=same?[...game.units,...game.buildings].filter(o=>o.owner===game.active&&o.type===object.type&&inCamera(o)).map(o=>o.id):object&&visibleTo(game,game.active,object)?[object.id]:[];}
    const click=distance(pointer.start,pointer.end)<=5;if(pointer.shift){if(click&&ids.length===1&&selected.includes(ids[0]))selected=selected.filter(id=>id!==ids[0]);else selected=[...new Set([...selected,...ids.filter(id=>[...game.units,...game.buildings].some(o=>o.id===id&&o.owner===game.active))])];}else selected=ids;activeSubtype=null;pointer=null;updateHUD();});
  canvas.addEventListener('pointercancel',()=>{pointer=null;cameraDrag=null;});canvas.addEventListener('pointerenter',e=>{mouse=pos(e);mouseInside=true;});canvas.addEventListener('pointerleave',()=>mouseInside=false);canvas.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12,pos(e));previewKey='';},{passive:false});
  const miniPoint=e=>{const r=mini.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width,0,1)*WIDTH,y:clamp((e.clientY-r.top)/r.height,0,1)*HEIGHT};};
  mini.addEventListener('contextmenu',e=>e.preventDefault());mini.addEventListener('pointerdown',e=>{e.preventDefault();const p=miniPoint(e);if(e.button===2){if(buildMode)endPlacement();else contextOrder(p,e);return;}if(e.button!==0)return;if(targetMode){resolveTarget(p,appendInput(e));return;}rememberCamera();miniDrag=true;mini.setPointerCapture(e.pointerId);Object.assign(camera,p);canvas.focus();});mini.addEventListener('pointermove',e=>{if(miniDrag)Object.assign(camera,miniPoint(e));});mini.addEventListener('pointerup',()=>miniDrag=null);mini.addEventListener('pointercancel',()=>miniDrag=null);
  $('nav-debug').onclick=()=>{debugNavigation=!debugNavigation;$('nav-debug').setAttribute('aria-pressed',String(debugNavigation));};$('home').onclick=home;$('fit').onclick=fit;$('zoom-in').onclick=()=>zoom(1.3);$('zoom-out').onclick=()=>zoom(1/1.3);
  function reset(){if(net){net.intentional=true;net.ws?.close();net=null;}cameraDrag=null;miniDrag=null;mouseInside=false;activeSubtype=null;lastSelectionClick=null;groupBarSignature='';lastBindingPress=null;targetMode=null;interactionTarget=null;$('interaction-panel').hidden=true;endPlacement();bindings.clear();cameraHistory=[];lastIdle=null;game=createGame(Number($('player').value));selected=['base'+game.active];started=false;terrainCache=null;$('welcome').hidden=false;$('pause').disabled=true;$('pause').textContent='Pauza';keys.clear();accumulator=0;orderMarker=null;fit();updateHUD();}
  $('restart').onclick=reset;$('player').onchange=reset;$('opponents').onchange=reset;
  $('start').onclick=()=>{if(net)return notify('Za mrežni meč koristi Spreman ili Reset za izlaz.');configureBots(game,$('opponents').value);game.running=true;started=true;$('welcome').hidden=true;$('pause').disabled=false;home();canvas.focus();notify('Izaberi radnika, pa B za Kasarnu ili R za Relej. Cela mapa je dostupna za test.');updateHUD();};
  function pause(){if(!started)return;if(net){net.pauseVote=!net.pauseVote;net.ws?.send(JSON.stringify({kind:'pause',vote:net.pauseVote}));notify(net.pauseVote?'Pauza zatražena · čekaju se svi igrači.':'Glas za pauzu povučen.');return;}game.paused=!game.paused;$('pause').textContent=game.paused?'Nastavi':'Pauza';accumulator=0;endPlacement();updateHUD();}
  $('pause').onclick=pause;
  function train(type){const b=primaryBuilding();if(!b)return notify('Izaberi svoju završenu Centralu.');const producers=ownedSelection().filter(x=>BUILDINGS[x.type]&&x.completed&&x.type===UNIT[type].source);if(producers.length>1){const r=humanAction('purchaseGroup',type,producers.map(x=>x.id));if(net)return;notify('Naručeno '+r.acceptedIds.length+'/'+producers.length+(r.errors[0]?' · '+r.errors[0]:''));updateHUD();return;}const error=humanAction('purchase',type,b.id);notify(error||(UNIT[type].name+' dodat u red.'));updateHUD();}
  $('train-worker').onclick=()=>train('worker');$('train-scout').onclick=()=>train('scout');$('gather').onclick=()=>{humanAction('command',selected,'gather',null,appendInput());updateHUD();};$('stop').onclick=()=>{humanAction('command',selected,'stop');updateHUD();};
  for(const type of Object.keys(BUILDINGS))$('build-'+type).onclick=()=>chooseBuild(type);
  $('cancel-build').onclick=()=>{const id=selected.find(id=>game.buildings.some(b=>b.id===id&&!b.completed&&b.owner===game.active));if(id&&humanAction('cancelBuild',id)){selected=[];notify('Gradnja otkazana. CODE vraćen prema napretku.');updateHUD();}};
  const defaults={Space:'Pauza',KeyW:'Radnik',KeyS:'Scout',KeyG:'Skupljaj',KeyH:'Zaustavi',KeyB:'Kasarna',KeyR:'Relej',KeyC:'Centrala',KeyX:'Otkaži gradnju',KeyU:'Tier 2',KeyA:'Napad',KeyL:'Popravka',KeyD:'Moć 1',KeyF:'Moć 2',KeyJ:'Drži položaj',KeyP:'Patrola',KeyV:'Prati',KeyY:'Rally'};
  const dialog=$('hotkeys-dialog');
  function keyName(code){return code.replace(/^Digit/,'').replace(/^Key/,'').replace(/^Numpad/,'Num ').replace('Space','Space');}
  function bindingName(b){if(b.kind==='location')return 'Lokacija '+Math.round(b.x/16)+', '+Math.round(b.y/16);return b.ids.length>1?'Grupa · '+b.ids.length:b.label;}
  function targetObjects(){return [...game.units,...game.buildings].filter(o=>selected.includes(o.id)&&o.owner===game.active);}
  function refreshBindingEditor(){
    const objects=targetObjects(),isLocation=$('binding-target').value==='location';
    $('binding-action-row').hidden=isLocation;
    $('binding-target-name').textContent=isLocation?'Sačuvaće se trenutni položaj i zoom kamere.':objects.length?objects.map(o=>BUILDINGS[o.type]?.name||UNIT[o.type]?.name||'Objekat').join(' + '):'Izaberi sopstvenu jedinicu ili zgradu na mapi, pa otvori Hotkeys.';
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
  $('hotkeys-form').onsubmit=e=>{e.preventDefault();if($('binding-save').disabled)return;const objects=targetObjects();const b=$('binding-target').value==='location'?{kind:'location',x:camera.x,y:camera.y,scale:camera.scale}:{kind:'entities',action:$('binding-action').value,ids:objects.map(o=>o.id),label:objects.length===1?(BUILDINGS[objects[0].type]?.name||UNIT[objects[0].type]?.name||'Objekat'):'Grupa'};
    bindings.set(draftKey,b);lastBindingPress=null;notify(keyName(draftKey)+' → '+bindingName(b));closeHotkeys();updateHUD();};
  $('camera-back').onclick=()=>{const previous=cameraHistory.pop();if(previous){Object.assign(camera,previous);pointer=null;keys.clear();previewKey='';}else notify('Nema prethodnog kadra.');canvas.focus();};
  $('idle-worker').onclick=()=>{const idle=game.units.filter(u=>u.owner===game.active&&u.type==='worker'&&u.mode==='idle');if(!idle.length)return;const i=idle.findIndex(u=>u.id===lastIdle),u=idle[(i+1)%idle.length];lastIdle=u.id;selected=[u.id];jumpCamera(u);updateHUD();canvas.focus();};
  function activateBinding(code){lastSelectionClick=null;const b=bindings.get(code);if(!b)return false;if(b.kind==='location')jumpCamera(b);else{const objects=b.ids.map(id=>[...game.units,...game.buildings].find(o=>o.id===id&&o.owner===game.active)).filter(Boolean);if(objects.length){b.ids=objects.map(o=>o.id);selected=[...b.ids];activeSubtype=null;targetMode=null;endPlacement();const twice=lastBindingPress?.code===code&&performance.now()-lastBindingPress.time<300;if(b.action!=='select'||twice)jumpCamera({x:objects.reduce((n,o)=>n+o.x,0)/objects.length,y:objects.reduce((n,o)=>n+o.y,0)/objects.length});lastBindingPress={code,time:performance.now()};updateHUD();}else notify('Mapirana grupa je prazna.');}return true;}
  window.addEventListener('keydown',e=>{
    if(dialog.open)return;
    if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return;
    if(started&&/^Digit[0-9]$/.test(e.code)&&(e.ctrlKey||e.shiftKey)){e.preventDefault();if(!e.repeat)storeGroup(e.code,!e.ctrlKey&&e.shiftKey);return;}
    if(started&&e.code==='Tab'){e.preventDefault();if(!e.repeat)cycleSubtype(e.shiftKey);return;}
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.code==='Escape'){e.preventDefault();const hadTarget=!!targetMode;targetMode=null;interactionTarget=null;$('interaction-panel').hidden=true;if(buildMode)endPlacement();else if(!hadTarget)selected=[];updateHUD();return;}
    if(started&&bindings.has(e.code)){e.preventDefault();if(!e.repeat)activateBinding(e.code);return;}
    if(['BUTTON','SUMMARY','A'].includes(document.activeElement.tagName))return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;
    if(e.code==='KeyJ')$('hold-order').click();if(e.code==='KeyP')$('patrol-order').click();if(e.code==='KeyV')$('follow-order').click();if(e.code==='KeyY')$('set-rally').click();
    if(e.code==='KeyU')$('upgrade-tier').click();if(e.code==='KeyA')$('attack').click();if(e.code==='KeyL')$('repair').click();if(e.code==='KeyD')$('ability-0').click();if(e.code==='KeyF')$('ability-1').click();
    if(e.code==='Space')pause();if(e.code==='KeyW')train('worker');if(e.code==='KeyS')train('scout');if(e.code==='KeyG')$('gather').click();if(e.code==='KeyH')$('stop').click();
    if(e.code==='KeyB')chooseBuild('barracks');if(e.code==='KeyR')chooseBuild('relay');if(e.code==='KeyC')chooseBuild('base');if(e.code==='KeyX')$('cancel-build').click();
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();mouseInside=false;cameraDrag=null;miniDrag=null;pointer=null;});
  function text(id,value){if($(id).textContent!==String(value))$(id).textContent=value;}
  let queueSignature='';
  function updateHUD(){const p=game.players[game.active],own=game.units.filter(u=>u.owner===game.active),units=selected.map(id=>game.units.find(u=>u.id===id)).filter(Boolean).sort((a,b)=>(b.type===activeSubtype)-(a.type===activeSubtype)),pending=orders(game,game.active);
    text('code',p.code);text('workers',own.filter(u=>u.type==='worker').length+' / '+workerLimit(game,game.active));text('supply',population(game,game.active)+' / '+supplyCap(game,game.active)+(reservedPop(game,game.active)?' (+'+reservedPop(game,game.active)+')':''));
    const seconds=Math.floor(game.tick/20);text('clock',String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'));
    text('income','+'+p.deliveries.reduce((s,d)=>s+d.amount,0)+(seconds<60?' / '+seconds+' s':' / min'));text('player-label','P'+(game.active+1)+' / '+TEAMS[game.active].name);text('selected-count',selected.length+' OBJEKATA');
    const b=activeSubtype&&UNIT[activeSubtype]?null:selected.map(id=>game.buildings.find(b=>b.id===id)).find(b=>b?.type===activeSubtype)||selected.map(id=>game.buildings.find(b=>b.id===id)).find(Boolean),n=game.nodes.find(n=>selected.includes(n.id));let title='Ništa nije izabrano',desc='Klikni objekat ili prevuci preko svojih jedinica.',meta='B / R / C: gradnja izabranim radnikom.',portrait='◇',ratio=0;
    if(b){title=BUILDINGS[b.type].name;desc=!b.completed?(b.builderId?'Gradilište · radnik putuje ili gradi':'Gradilište miruje · desni klik radnikom'):b.type==='base'?'Tier '+tierOf(game,b.owner)+' · proizvodnja i isporuka CODE-a':b.type==='relay'?'Završen Relej · +5 kapaciteta, T1 najviše 20':'Završena proizvodna / tehnološka zgrada';
      meta=b.hp+' / '+BUILDINGS[b.type].hp+' HP'+(!b.completed?' · '+Math.floor(b.progress/b.duration*100)+'% · '+Math.ceil((b.duration-b.progress)/20)+' s rada':'');portrait=b.type==='base'?'⌂':b.type==='relay'?'◆':'⚑';ratio=b.hp/BUILDINGS[b.type].hp;}
    else if(units.length){const u=units[0];title=units.length>1?units.length+' jedinica':u.type==='worker'?'WHR Radnik':'Scout';desc=units.length>1?'Desni klik za grupno kretanje.':modes[u.mode];meta=u.hp+' HP · '+(u.type==='worker'?u.cargo+'/5 CODE · graditelj':'Izviđač · bez napada');portrait=u.type==='worker'?'⚒':'➤';ratio=1;}
    else if(n){title='CODE · '+(n.field==='home'?'početno polje':'proširenje');desc='Jedno aktivno mesto za skupljanje.';meta=n.remaining+' / 1.000 CODE · teret 5 · rad 3 s';portrait='◆';}
    if(b){title=b.type==='base'&&b.techLevel===2?'WHR Komandni centar':BUILDINGS[b.type].name;meta=meta.replace(BUILDINGS[b.type].hp+' HP',maxHp(game,b)+' HP');ratio=b.hp/maxHp(game,b);if(b.type==='relay')desc='Kapacitet +5 · maksimum T'+tierOf(game,b.owner)+' '+(tierOf(game,b.owner)===2?40:20);}
    if(units.length){const u=units[0];if(UNIT[u.type])title=units.length>1?units.length+' jedinica':UNIT[u.type].name;if(u.type!=='worker'&&u.type!=='scout'){desc=UNIT[u.type]?.hero?'Nivo '+u.level+' · XP '+Math.floor(u.xp):u.type==='medic'?'Lečenje 8 HP/s':'Borbena jedinica';meta=Math.ceil(u.hp)+' / '+maxHp(game,u)+' HP · '+UNIT[u.type].pop+' pop';ratio=u.hp/maxHp(game,u);}}
    if(units.length===1&&units[0].type==='carrier')desc='Putnici: '+game.units.filter(u=>u.transportedBy===units[0].id).reduce((n,u)=>n+UNIT[u.type].pop,0)+'/6 pop · teleport '+Math.max(0,Math.ceil(((units[0].teleportReady||0)-game.tick)/20))+' s';
    if(units.length===1&&units[0].path.length&&units[0].trafficWait>=20)desc='Čeka slobodan prolaz · nalog sačuvan';
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
    for(const type of ['worker','scout']){const cost=type==='worker'?50:75,limit=type==='worker'?workerLimit(game,game.active):1;status('train-'+type,!can?'Poligon je pauziran / nije pokrenut.':!base?'Izaberi svoju Centralu.':has(type)+queued(type)>=limit?'Globalni limit '+limit:own.length+pending.length>=supplyCap(game,game.active)?'Nema slobodne populacije.':availableCode(game,game.active)<cost?'Potrebno '+cost+' CODE; dostupno '+availableCode(game,game.active)+'.':'');}
    for(const type of ['base','barracks','relay'])status('build-'+type,!can?'Poligon je pauziran / nije pokrenut.':!worker?'Izaberi radnika.':availableCode(game,game.active)<BUILDINGS[type].cost?'Potrebno '+BUILDINGS[type].cost+' CODE; dostupno '+availableCode(game,game.active)+'.':'');
    for(const [id,code] of [['train-worker','KeyW'],['train-scout','KeyS'],['gather','KeyG'],['stop','KeyH'],['build-barracks','KeyB'],['build-relay','KeyR'],['build-base','KeyC'],['cancel-build','KeyX']])$(id).querySelector('kbd').textContent=bindings.has(code)?'':keyName(code);
    $('pause').title=bindings.has('Space')?'Space je dodeljen kameri.':'Space: pauza / nastavak';
    $('hotkeys-open').disabled=!started;
    const jobs=ownedSelection().filter(o=>BUILDINGS[o.type]&&o.completed).flatMap(o=>o.queue.map((j,index)=>({...j,producerId:o.id,index}))),signature=JSON.stringify(jobs.map(j=>[j.producerId,j.type,j.remaining]));if(signature!==queueSignature){queueSignature=signature;$('queue').replaceChildren();jobs.forEach((j,i)=>{const el=document.createElement('span');el.className='job';el.title=j.producerId;el.textContent=UNIT[j.type].name+' · '+(j.index?'čeka':j.remaining?Math.ceil(j.remaining/20)+' s':'čeka izlaz');el.style.setProperty('--progress',((1-j.remaining/j.duration)*100)+'%');$('queue').append(el);});}
    updateT2HUD(b,units);updateInteraction();updateOrderHUD();
    text('action-hint',game.paused?'Pauza · svi radovi miruju.':buildMode?'Levi klik potvrđuje. Desni klik / Escape odustaje.':worker?'B Kasarna · R Relej · C Centrala. Desni klik na gradilište nastavlja rad.':'Izaberi Centralu za proizvodnju ili radnika za gradnju.');
  }
  const outputResult=result=>{notify(net?'Čeka potvrdu servera.':result||'Nalog prihvaćen.');updateHUD();};
  const selectedBuilding=()=>primaryBuilding();
  const selectedUnits=()=>game.units.filter(u=>selected.includes(u.id)&&u.owner===game.active);
  $('upgrade-tier').onclick=()=>outputResult(humanAction('startUpgrade',selectedBuilding()?.id));
  $('revive').onclick=()=>outputResult(humanAction('reviveHero',selectedBuilding()?.id));
  for(const type of ['guard','archer','medic','breaker','skyguard','carrier','shadow'])$('train-'+type).onclick=()=>train(type);
  for(const key of Object.keys(RESEARCH))$('research-'+key).onclick=()=>outputResult(humanAction('startResearch',selectedBuilding()?.id,key));
  $('attack').onclick=()=>{targetMode={action:'attack',append:appendInput()};notify('Levi klik na neprijatelja. Escape odustaje.');canvas.focus();};
  $('repair').onclick=()=>{targetMode={action:'repair',append:appendInput(),id:selectedUnits().find(u=>u.type==='worker')?.id};notify('Klikni oštećenu sopstvenu zgradu.');canvas.focus();};
  for(const slot of [0,1])$('ability-'+slot).onclick=()=>{const u=selectedUnits().find(u=>UNIT[u.type].hero);if(!u)return;if(u.type==='bastion')outputResult(humanAction('ability',u.id,slot));else{targetMode={action:'ability',id:u.id,slot};notify('Izaberi metu sposobnosti levim klikom.');canvas.focus();}};
  function resolveTarget(p,append=false){const mode=targetMode,object=hit(p);append=append||mode.append;targetMode=null;
    if(mode.action==='attack')outputResult(humanAction('command',selected,object&&object.owner!==undefined&&object.owner!==game.active&&visibleTo(game,game.active,object)?'attack':'attackMove',object&&object.owner!==undefined&&object.owner!==game.active&&visibleTo(game,game.active,object)?object:p,append)?null:'Nalog nije prihvaćen.');
    if(mode.action==='rally')outputResult(humanAction('setRally',ownedSelection().filter(b=>BUILDINGS[b.type]&&producer(b)).map(b=>b.id),object?.owner===game.active||object?.type==='node'?object:p));
    if(mode.action==='patrol'||mode.action==='follow')outputResult(humanAction('command',selected,mode.action,mode.action==='follow'?object:p,append)?null:'Nalog nije prihvaćen.');
    if(mode.action==='board')outputResult(humanAction('loadCargo',object?.id,mode.ids));
    if(mode.action==='teleport')outputResult(humanAction('teleport',mode.id,object?.id));
    if(mode.action==='ability')outputResult(humanAction('ability',mode.id,mode.slot,p));
    if(mode.action==='repair')outputResult(humanAction('startRepair',mode.id,object?.id,append));
    if(mode.action==='transfer')outputResult(humanAction('transferItem',mode.id,object?.id,mode.item));
  }
  $('load-cargo').onclick=()=>{targetMode={action:'board',ids:selectedUnits().map(u=>u.id)};notify('Klikni sopstvenu Mostonošu.');};$('unload-cargo').onclick=()=>outputResult(humanAction('unloadCargo',selectedUnits().find(u=>u.type==='carrier')?.id));$('teleport').onclick=()=>{targetMode={action:'teleport',id:selectedUnits().find(u=>u.type==='carrier')?.id};notify('Klikni završeno sopstveno sidro.');};$('detector').onclick=()=>outputResult(humanAction('detector',selectedBuilding()?.id));
  $('set-rally').onclick=()=>{targetMode={action:'rally'};notify('Klikni rally cilj na mapi ili minimapi.');canvas.focus();};$('clear-rally').onclick=()=>outputResult(humanAction('setRally',ownedSelection().filter(b=>BUILDINGS[b.type]&&producer(b)).map(b=>b.id),null));$('clear-pending').onclick=()=>outputResult(humanAction('clearPending',selected)?null:'Nema naloga.');$('hold-order').onclick=()=>outputResult(humanAction('command',selected,'hold',null,appendInput())?null:'Izaberi jedinicu.');for(const action of ['patrol','follow'])$(action+'-order').onclick=()=>{targetMode={action,append:appendInput()};notify('Klikni cilj: '+action);canvas.focus();};
  let inventorySignature='',interactionSignature='',fogCache=null,fogKey='',fogGame=null;
  function updateT2HUD(b,units){const own=b&&b.owner===game.active&&b.completed,p=game.players[game.active],tier=p.tier,us=units.filter(u=>u.owner===game.active),worker=us.some(u=>u.type==='worker'),hero=us.find(u=>UNIT[u.type].hero),can=started&&!game.paused;
    text('tier-label','T'+tier);text('bot-status',game.match.result?((game.match.result.winnerTeam!==undefined?game.match.result.winnerTeam===game.match.teams?.[game.active]:game.match.result.winner===game.active)?'Pobeda':game.match.result.winner===null?'Nerešeno':'Poraz'):net?(game.match.mode||'').replace('network','')+' · net'+(net.ws?.readyState!==WebSocket.OPEN?' · prekid':''):game.match.mode==='bot1v1'?'1v1 · bot':'Poligon');$('tier-label').title=p.defeated?'Poražen: nema Centrala i radnika.':'Globalna tehnologija igrača';
    const set=(id,show,reason='')=>{const e=$(id);e.hidden=!show;e.disabled=!can||!!reason;e.title=reason||e.textContent.trim();};
    set('upgrade-tier',own&&b.type==='base'&&tier<3,upgradeReason(game,game.active,b?.id));
    $('upgrade-tier').querySelector('b').textContent='Tier '+Math.min(3,tier+1);$('upgrade-tier').querySelector('span').textContent=tier===2?'600 ◆ · 90 s':'300 ◆ · 60 s';
    set('load-cargo',us.some(u=>!UNIT[u.type].flying&&!u.transportedBy));set('unload-cargo',us.some(u=>u.type==='carrier'));set('teleport',us.some(u=>u.type==='carrier'));set('detector',own&&b.type==='tower',tier<2?'Potreban T2.':b?.detector?'Već ima detektor.':b?.detectorJob?'Ugradnja u toku.':'');
    set('attack',us.some(u=>UNIT[u.type].damage));set('repair',worker);
    for(const type of ['tower','academy','support','workshop','altar','airfield','cloakCenter','anchor'])set('build-'+type,worker&&tier>=(BUILDINGS[type].tier||1),availableCode(game,game.active)<BUILDINGS[type].cost?'Nedovoljno CODE-a.':type==='tower'&&game.buildings.filter(b=>b.owner===game.active&&b.type==='tower').length>=2?'Limit dve kule.':'');
    for(const type of ['guard','archer','medic','breaker','skyguard','carrier','shadow'])set('train-'+type,own&&b.type===UNIT[type].source,productionReason(game,game.active,type,b?.id));
    for(const type of ['worker','scout'])if(own&&b.type==='base'){const reason=productionReason(game,game.active,type,b.id);$('train-'+type).disabled=!!reason;$('train-'+type).title=reason||UNIT[type].name+' · '+UNIT[type].cost+' CODE';}
    for(const key of Object.keys(RESEARCH))set('research-'+key,own&&b.type==='academy',p.research[key]?'Već istraženo.':p.researchJob?'Istraživanje u toku.':availableCode(game,game.active)<RESEARCH[key].cost?'Nedovoljno CODE-a.':'');
    set('revive',own&&b.type==='altar',!p.hero?.dead||p.heroJob?'Nema poginulog heroja ili već postoji posao.':availableCode(game,game.active)<100?'Potrebno 100 CODE.':population(game,game.active)+reservedPop(game,game.active)+4>supplyCap(game,game.active)?'Nedovoljno populacije.':'');
    for(const slot of [0,1]){set('ability-'+slot,!!hero,slot===1&&tier<2?'Potreban T2.':hero?.abilityReady[slot]>game.tick?'Obnavlja se.':'');if(hero)$('ability-'+slot).querySelector('span').textContent=hero.abilityReady[slot]>game.tick?Math.ceil((hero.abilityReady[slot]-game.tick)/20)+' s':slot?'T2 sposobnost':'Osnovna moć';}
    for(const [id,key] of [['upgrade-tier','KeyU'],['attack','KeyA'],['repair','KeyL'],['ability-0','KeyD'],['ability-1','KeyF']])$(id).querySelector('kbd').textContent=bindings.has(key)?'':keyName(key);
    document.querySelector('.actions-panel').hidden=![...document.querySelectorAll('.actions button')].some(e=>!e.hidden);
    $('attack').style.gridColumn=worker?'4':'1';
    const shown=[...document.querySelectorAll('.actions button')].filter(e=>!e.hidden);const rows=Math.max(1,...shown.map(e=>Number(getComputedStyle(e).gridRowStart)||1));document.querySelector('.actions').style.gridTemplateRows='repeat('+rows+', '+(innerWidth<=640?54:58)+'px)';
    const job=p.upgrade?.baseId===b?.id?p.upgrade:p.researchJob?.buildingId===b?.id?p.researchJob:p.heroJob?.baseId===b?.id?p.heroJob:null;
    text('tech-status',job?(job.key?RESEARCH[job.key].name:p.upgrade===job?'Tier '+(job.tier||2):'Heroj')+' · '+Math.floor((1-job.remaining/job.duration)*100)+'% · '+Math.ceil(job.remaining/20)+' s':own&&b.type==='base'&&tier<3?upgradeReason(game,game.active,b.id):'');
    const u=us.length===1?us[0]:null,signature=JSON.stringify([u?.id,u?.inventory]);if(signature!==inventorySignature){inventorySignature=signature;$('inventory').replaceChildren();if(u)for(const i of u.inventory){const use=document.createElement('button');use.textContent=ITEMS[i.type].name;use.title=ITEMS[i.type].consumable?'Upotrebi na nosiocu':'Pasivna oprema';use.onclick=()=>outputResult(humanAction('useItem',u.id,i.id));const give=document.createElement('button');give.textContent='→';give.title='Predaj predmet obližnjoj svojoj jedinici';give.onclick=()=>{targetMode={action:'transfer',id:u.id,item:i.id};notify('Klikni primaoca do 2 mapne jedinice.');canvas.focus();};$('inventory').append(use,give);}}
    const npc=game.neutrals.find(n=>selected.includes(n.id));if(npc){text('selection-name','Neutralni čuvar');text('selection-description',npc.returning?'Vraća se · ne prima štetu':npc.recoverUntil>game.tick?'Oporavlja se':'NPC kamp');text('selection-meta',Math.ceil(npc.hp)+' / '+npc.maxHp+' HP');$('health').hidden=false;$('health').firstElementChild.style.width=(npc.hp/npc.maxHp*100)+'%';}
  }
  $('interaction-close').onclick=()=>{interactionTarget=null;$('interaction-panel').hidden=true;canvas.focus();};
  function updateInteraction(){const t=interactionTarget;if(!t){$('interaction-panel').hidden=true;return;}
    if(!visibleTo(game,game.active,t)){interactionTarget=null;$('interaction-panel').hidden=true;return;}
    $('interaction-panel').hidden=false;const u=selectedUnits()[0],p=game.players[game.active];text('interaction-title',t.type==='shop'?'Neutralna prodavnica':t.type==='shrine'?'WHR Svetilište':'Torba plena');text('interaction-status',!u?'Izaberi svoju jedinicu.':distance(u,t)>32?'Priđi na najviše 2 mapne jedinice (desni klik na lokaciju).':'Jedinica je u dometu.');
    const signature=[t.id,u?.id,p.tier,t.type].join(':');if(signature!==interactionSignature){interactionSignature=signature;$('interaction-actions').replaceChildren();const add=(key,label,fn)=>{const b=document.createElement('button');b.dataset.key=key;b.textContent=label;b.onclick=()=>outputResult(fn());$('interaction-actions').append(b);};
      if(t.type==='shop')for(const [key,d] of Object.entries(ITEMS))add(key,d.name+' · '+d.cost+' CODE',()=>humanAction('shopBuy',u?.id,t.id,key));
      if(t.type==='shrine')for(const type of ['bastion','pulsar','echo'])add(type,UNIT[type].name+' · 200 CODE · 30 s',()=>humanAction('summonHero',u?.id,type));
      if(t.type==='loot')add('loot','Preuzmi predmet',()=>humanAction('pickupLoot',u?.id,t.id));
    }
    for(const b of $('interaction-actions').children){const d=ITEMS[b.dataset.key];b.disabled=game.paused||!u||distance(u,t)>32||(d&&(p.tier<d.tier||!t.stock[b.dataset.key]));if(d)b.textContent=d.name+' · '+d.cost+' ◆ · zaliha '+t.stock[b.dataset.key];}
  }
  function drawFog(context,sx=1,sy=1){const key=game.active+':'+Math.floor(game.tick/5);if(!fogCache||fogGame!==game||key!==fogKey){fogGame=game;fogKey=key;fogCache??=document.createElement('canvas');fogCache.width=fogCache.height=160;const c=fogCache.getContext('2d'),p=game.players[game.active];for(let i=0;i<25600;i++)if(!p.visible[i]){c.fillStyle=p.explored[i]?'#081512aa':'#081512f5';c.fillRect(i%160,Math.floor(i/160),1,1);}}
    context.save();context.imageSmoothingEnabled=false;context.drawImage(fogCache,0,0,WIDTH*sx,HEIGHT*sy);context.restore();}
  function drawT2World(){
    for(const c of game.map.camps)if(visibleTo(game,game.active,c)){const alive=game.neutrals.some(n=>n.campId===c.id);const seen=c.seen[game.active];label(alive?'NPC kamp':seen?.nextSpawn!=null?'Kamp · '+Math.max(0,Math.ceil((seen.nextSpawn-game.tick)/20))+' s':'Kamp · čeka pojavu',c.x,c.y+65,'#c9cda8',10);}
    for(const n of game.neutrals.filter(n=>visibleTo(game,game.active,n))){circle(n.x,n.y,12,n.returning||n.recoverUntil>game.tick?'#7a8d86':'#ac7157',selected.includes(n.id)?'#fff':'#e1bb8b',2);bunny(n.x,n.y-7,8,'#d2c1a5');ctx.fillStyle='#1c2523';ctx.fillRect(n.x-16,n.y+18,32,4);ctx.fillStyle='#d69b70';ctx.fillRect(n.x-16,n.y+18,32*n.hp/n.maxHp,4);}
    for(const l of game.loot.filter(l=>visibleTo(game,game.active,l)))label('◆ PLEN',l.x,l.y,'#f6dd90',12);
    label('SVETILIŠTE',game.shrine.x,game.shrine.y+75,'#dcbafa',12);
    for(const a of game.auras||[])circle(a.x,a.y,64,'#7ecdf022','#8bd5df');
    for(const f of game.slowFields||[])if(visibleTo(game,game.active,f))circle(f.x,f.y,64,'#b588e922','#c49ceb');
    drawFog(ctx);
  }

  function appendInput(e){return !!e?.shiftKey||keys.has('ShiftLeft')||keys.has('ShiftRight');}
  function ownedSelection(){return selected.map(id=>[...game.units,...game.buildings].find(o=>o.id===id&&o.owner===game.active)).filter(Boolean);}
  function primaryBuilding(){if(activeSubtype&&UNIT[activeSubtype])return null;const bs=ownedSelection().filter(o=>BUILDINGS[o.type]);return bs.find(b=>b.type===activeSubtype)||bs[0];}
  function inCamera(o){const p={x:(o.x-camera.x)*camera.scale+view.width/2,y:(o.y-camera.y)*camera.scale+view.height/2};return p.x>=0&&p.y>=0&&p.x<=view.width&&p.y<=view.height;}
  function cycleSubtype(back=false){const types=[...new Set(ownedSelection().map(o=>o.type))];if(types.length<2)return;const at=types.indexOf(activeSubtype||types[0]);activeSubtype=types[(at+(back?-1:1)+types.length)%types.length];updateHUD();}
  function storeGroup(code,add=false){const objects=ownedSelection(),old=bindings.get(code);if(!objects.length)return notify('Izaberi svoje objekte.');if(old?.kind==='location')return notify('Slot je lokacija. Zameni ga kroz Hotkeys.');const ids=add?[...new Set([...(old?.ids||[]),...objects.map(o=>o.id)])]:objects.map(o=>o.id);bindings.set(code,{kind:'entities',ids,label:ids.length===1?(UNIT[objects[0].type]?.name||BUILDINGS[objects[0].type]?.name):'Grupa',action:old?.action||'selectCenter'});notify(keyName(code)+' · '+ids.length+' objekata');updateHUD();}
  function drawGroupBar(){const liveIds=b=>b.ids?.filter(id=>[...game.units,...game.buildings].some(o=>o.id===id&&o.owner===game.active))||[];const signature=JSON.stringify([...bindings].map(([key,b])=>[key,b.kind==='entities'?{...b,ids:liveIds(b)}:b]));if(signature===groupBarSignature)return;groupBarSignature=signature;$('control-groups').replaceChildren();for(const [code,b]of bindings){const button=document.createElement('button');button.type='button';button.textContent=keyName(code)+(b.kind==='entities'?' · '+liveIds(b).length:' ⌖');button.title=bindingName(b);button.onclick=()=>{activateBinding(code);canvas.focus();};$('control-groups').append(button);}}
  function contextOrder(p,e){if(!started||game.paused)return;const object=[...game.map.shops,game.shrine,...game.loot].find(n=>distance(n,p)<20&&visibleTo(game,game.active,n))||hit(p),visible=object&&visibleTo(game,game.active,object)?object:null,units=selectedUnits(),bs=ownedSelection().filter(b=>BUILDINGS[b.type]&&producer(b)),append=appendInput(e);
    if(bs.length){const r=humanAction('setRally',bs.map(b=>b.id),visible?.owner===game.active||visible?.type==='node'?visible:p);if(r)notify(r);else notify('Rally postavljen za '+bs.length+' proizvođača.');}
    if(!units.length)return;
    if(visible&&['shop','shrine','loot'].includes(visible.type)){interactionTarget=visible;humanAction('interactMove',selected,visible);updateInteraction();return;}
    if(visible&&visible.owner!==undefined&&visible.owner!==game.active&&visible.type!=='node'){humanAction('command',units.map(u=>u.id),'attack',visible,append);return;}
    if(visible&&BUILDINGS[visible.type]&&!visible.completed){const u=units.find(u=>u.type==='worker');if(u){const r=append?humanAction('command',[u.id],'build',visible,true):humanAction('resumeBuild',u.id,visible.id);if(!r)notify('Gradilište nema slobodan pristup.');}return;}
    if(visible&&UNIT[visible.type]&&visible.owner===game.active&&!units.some(u=>u.id===visible.id)){humanAction('command',units.map(u=>u.id),'follow',visible,append);return;}
    const gatherers=visible?.type==='node'?units.filter(u=>u.type==='worker'):[],movers=units.filter(u=>!gatherers.includes(u));if(gatherers.length)humanAction('command',gatherers.map(u=>u.id),'gather',visible,append);if(movers.length)humanAction('command',movers.map(u=>u.id),'move',p,append);orderMarker={...p,until:performance.now()+900};
    if(game.lastOrderBatch?.errors.length)notify(game.lastOrderBatch.accepted+'/'+game.lastOrderBatch.total+' naloga · '+game.lastOrderBatch.errors[0]);
  }
  function cameraMouseStep(elapsed){if(!started||dialog.open||cameraDrag||miniDrag||!mouseInside||mouse.x<0||mouse.y<0||mouse.x>view.width||mouse.y>view.height||document.hidden||!document.hasFocus()||!$('edge-enabled').checked)return;
    const margin=16,dx=mouse.x<margin?-1:mouse.x>view.width-margin?1:0,dy=mouse.y<margin?-1:mouse.y>view.height-margin?1:0;if(!dx&&!dy)return;const speed=clamp(Number($('edge-speed').value)||600,100,2000),n=Math.hypot(dx,dy),step=Math.min(elapsed,100)/1000*speed/camera.scale;camera.x+=dx/n*step;camera.y+=dy/n*step;previewKey='';
  }
  function updateOrderHUD(){drawGroupBar();$('control-groups').hidden=!started||!bindings.size;const us=selectedUnits(),bs=ownedSelection().filter(b=>BUILDINGS[b.type]&&producer(b)),can=started&&!game.paused&&game.running,one=us.length===1?us[0]:null;
    for(const id of ['hold-order','patrol-order','follow-order']){$(id).hidden=!us.length;$(id).disabled=!can;}
    $('clear-pending').hidden=!us.some(u=>u.orderQueue?.length||u.activeOrder&&!u.activeOrder.started);$('clear-pending').disabled=!can;$('clear-rally').hidden=!bs.some(b=>b.rally);$('clear-rally').disabled=!can;
    $('set-rally').hidden=!bs.length;$('set-rally').disabled=!can;text('unit-orders',one?(one.activeOrder?'Aktivno: '+one.activeOrder.type:'')+(one.orderQueue?.length?' · zatim '+one.orderQueue.map(q=>q.type==='build'?BUILDINGS[q.buildType]?.name:q.type).join(' → '):'')+(one.orderError?' · '+one.orderError:''):us.length>1?'Grupa · '+us.length+' jedinica'+(activeSubtype?' · '+(UNIT[activeSubtype]?.name||activeSubtype):''):'');
    if(one&&one.activeOrder&&one.trafficWait>=200)$('unit-orders').title='Nalog čeka slobodan put i ostaje sačuvan.';
    if(bs.length&&bs[0].rally)text('rally-status','Rally: '+(bs[0].rallyInvalid?'meta nije dostupna':bs[0].rally.kind==='resource'?'CODE':bs[0].rally.kind==='unit'?'jedinica':'lokacija'));else text('rally-status','');
    if(us.length>1){text('selection-description','Grupa · '+us.length+' jedinica'+(activeSubtype?' · '+(UNIT[activeSubtype]?.name||activeSubtype):''));text('selection-meta',Math.ceil(us.reduce((n,u)=>n+u.hp,0))+' / '+us.reduce((n,u)=>n+maxHp(game,u),0)+' HP · '+us.reduce((n,u)=>n+UNIT[u.type].pop,0)+' pop');}
    if(!us.length&&bs.length>1){text('selection-name',bs.length+' proizvođača');text('selection-description','Odvojeni redovi · grupna obuka i rally'+(activeSubtype?' · '+BUILDINGS[activeSubtype]?.name:''));text('selection-meta',Math.ceil(bs.reduce((n,b)=>n+b.hp,0))+' / '+bs.reduce((n,b)=>n+maxHp(game,b),0)+' HP');}
    $('set-rally').querySelector('kbd').textContent=bindings.has('KeyY')?'':'Y';
    const reserved=game.players[game.active].reservedCode||0;text('code',availableCode(game,game.active));$('code').title=reserved?'Rezervisano za buduću gradnju: '+reserved+' CODE':'Raspoloživi CODE';
  }
  function drawRalliesAndTasks(){for(const b of game.buildings.filter(b=>b.owner===game.active&&selected.includes(b.id)&&b.rally)){const r=b.rally,p=r.kind==='unit'?game.units.find(u=>u.id===r.targetId&&u.owner===b.owner):r.point;if(!p)continue;line([[b.x,b.y],[p.x,p.y]],'#f2d68999',1.5/camera.scale);line([[p.x,p.y],[p.x,p.y-24],[p.x+14,p.y-19],[p.x,p.y-14]],'#f2d689',2/camera.scale);}
    for(const u of selectedUnits()){let prev=u;for(const q of u.orderQueue||[]){const p=q.point||(q.targetId?[...game.units,...game.nodes,...game.buildings].find(o=>o.id===q.targetId):null);if(!p)continue;line([[prev.x,prev.y],[p.x,p.y]],'#cee9a999',1/camera.scale);circle(p.x,p.y,5,null,'#cee9a9',1/camera.scale);if(q.type==='build'){const r=footprint(q.buildType,p);ctx.strokeStyle='#d9cf8b';ctx.lineWidth=1/camera.scale;ctx.strokeRect(r.x-r.w/2,r.y-r.h/2,r.w,r.h);}prev=p;}}
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
    game.map.camps.forEach(c=>{circle(c.x,c.y,64,'#515b3c','#81906a',2);circle(c.x,c.y,25,'#717d61','#a7b08a',2);label('T'+c.tier+' KAMP',c.x,c.y-76,['','#b3d49c','#ead08a','#e8a395'][c.tier],16);});
    game.map.shops.forEach(s=>{ctx.fillStyle='#4f4632';ctx.fillRect(s.x-32,s.y-12,64,42);ctx.fillStyle='#ba8c50';ctx.beginPath();ctx.moveTo(s.x-41,s.y-12);ctx.lineTo(s.x,s.y-44);ctx.lineTo(s.x+41,s.y-12);ctx.closePath();ctx.fill();label('PRODAVNICA',s.x,s.y+50,'#d5bf8d',13);});
    circle(1280,1280,145,'#42574c','#a5a285',4);circle(1280,1280,110,'#354449','#899f94',2);circle(1280,1280,72,'#4e4564','#b0a0d3',2);crystal(1280,1280,48);bunny(1280,1280,22,'#e7ddff');label('CENTRALNO JEZGRO',1280,1395,'#cfc2e1',17);
    ctx.strokeStyle='#6c805e';ctx.lineWidth=8;ctx.strokeRect(0,0,WIDTH,HEIGHT);ctx=actual;return terrainCache;
  }
  function drawBuilding(b){const color=TEAMS[b.owner].color,d=BUILDINGS[b.type];ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle=b.completed?'#253d3c':'#3b3d30';ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);ctx.strokeStyle=selected.includes(b.id)?'#c3ffb4':color;ctx.lineWidth=selected.includes(b.id)?3:2;ctx.strokeRect(-b.w/2,-b.h/2,b.w,b.h);
    if(!b.completed){ctx.strokeStyle='#c7af72';ctx.lineWidth=2;for(let x=-b.w/2;x<b.w/2;x+=16)line([[x,-b.h/2],[x,b.h/2]],'#786e49',1);line([[-b.w/2,-b.h/2],[b.w/2,b.h/2]],'#b3a36c',2);line([[b.w/2,-b.h/2],[-b.w/2,b.h/2]],'#b3a36c',2);label(Math.floor(b.progress/b.duration*100)+'%',0,5,'#fff1bd',14);}
    else if(b.type==='base'){ctx.fillStyle='#49676b';ctx.fillRect(-32,-28,64,50);bunny(0,-17,22,color);circle(0,28,9,color);}
    else if(b.type==='relay'){crystal(0,0,14);}
    else{ctx.fillStyle='#5f736a';ctx.fillRect(-28,-20,56,40);ctx.fillStyle='#14282c';ctx.fillRect(-12,0,24,20);line([[-33,-20],[0,-34],[33,-20]],color,4);label({barracks:'K',academy:'AK',support:'+',workshop:'R',altar:'O',tower:'▲'}[b.type]||'',0,-5,color,12);}
    if(selected.includes(b.id)||inside(world(mouse.x,mouse.y),b))label(b.type==='base'&&b.techLevel===2?'Komandni centar':d.name,0,b.h/2+19,color,b.type==='relay'?10:13);
    if(!b.completed){ctx.fillStyle='#142727';ctx.fillRect(-b.w/2,b.h/2+26,b.w,5);ctx.fillStyle='#d6bd7b';ctx.fillRect(-b.w/2,b.h/2+26,b.w*b.progress/b.duration,5);}
    ctx.restore();}
  function render(now){const dpr=canvas.width/view.width;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#10271f';ctx.fillRect(0,0,view.width,view.height);ctx.save();ctx.translate(view.width/2,view.height/2);ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);ctx.drawImage(terrain(),0,0);
    if(buildMode){for(const z of game.map.zones.filter(z=>z.owner===game.active)){ctx.fillStyle='#75d8a514';ctx.fillRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);ctx.setLineDash([8,8]);ctx.strokeStyle='#8bddb6';ctx.lineWidth=2;ctx.strokeRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);ctx.setLineDash([]);}}
    game.nodes.filter(n=>game.players[game.active].explored[cellIndex(n.x,n.y)]).forEach(n=>{if(selected.includes(n.id))circle(n.x,n.y,21,null,'#baffb4',2);crystal(n.x,n.y,13,!n.remaining);crystal(n.x+9,n.y+5,8,!n.remaining);});game.buildings.filter(b=>visibleTo(game,game.active,b)).forEach(drawBuilding);
    for(const u of game.units.filter(u=>!u.transportedBy&&visibleTo(game,game.active,u))){const color=TEAMS[u.owner].color;if(selected.includes(u.id)){circle(u.x,u.y+5,17,null,'#b9ffa6',2);if(u.path.length)line([[u.x,u.y],...u.path.map(p=>[p.x,p.y])],'#a2dc9b66',1);}
      if(debugNavigation)circle(u.x,u.y,unitRadius(u),null,u.trafficWait>=20?'#ffae71':'#d4f6b9',1/camera.scale);
      circle(u.x,u.y+7,11,'#0c1e1f88');if(UNIT[u.type]?.flying){line([[u.x-20,u.y],[u.x,u.y-10],[u.x+20,u.y]],color,3);circle(u.x,u.y,unitRadius(u),null,color,1);}if(u.type==='scout'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(u.x,u.y-18);ctx.lineTo(u.x+12,u.y+13);ctx.lineTo(u.x-12,u.y+13);ctx.closePath();ctx.fill();bunny(u.x,u.y-3,8,'#e5ebdb');}
      else{circle(u.x,u.y+3,9,u.type==='worker'?'#c79753':UNIT[u.type]?.hero?'#9a71c9':'#6588a0',color,2);bunny(u.x,u.y-6,8,'#ede8cf');if(u.cargo)crystal(u.x+9,u.y,6);}
      if(u.type!=='worker'&&u.type!=='scout'){if(selected.includes(u.id)||distance(world(mouse.x,mouse.y),u)<18)label(UNIT[u.type].name,u.x,u.y-30,color,10);ctx.fillStyle='#102321';ctx.fillRect(u.x-16,u.y+20,32,3);ctx.fillStyle='#94cf91';ctx.fillRect(u.x-16,u.y+20,32*u.hp/maxHp(game,u),3);}
      if(u.mode==='harvest'){ctx.fillStyle='#142927';ctx.fillRect(u.x-12,u.y-26,24,3);ctx.fillStyle='#71e2d4';ctx.fillRect(u.x-12,u.y-26,24*u.work/60,3);}
      if(u.mode==='build')label('⚒',u.x+15,u.y-10,'#f4d28f',15);
    }
    drawT2World();drawRalliesAndTasks();
    if(buildMode&&preview){ctx.fillStyle=preview.error?'#e7686344':'#8febad44';ctx.strokeStyle=preview.error?'#ff9e98':'#b0ffd0';ctx.lineWidth=2;ctx.fillRect(preview.x-preview.w/2,preview.y-preview.h/2,preview.w,preview.h);ctx.strokeRect(preview.x-preview.w/2,preview.y-preview.h/2,preview.w,preview.h);}
    if(orderMarker&&now<orderMarker.until)circle(orderMarker.x,orderMarker.y,12+(orderMarker.until-now)/55,null,'#c6efad',2);ctx.restore();
    if(pointer&&distance(pointer.start,pointer.end)>5){ctx.fillStyle='#81e5b922';ctx.strokeStyle='#a6efc5';ctx.lineWidth=1;ctx.fillRect(pointer.start.x,pointer.start.y,pointer.end.x-pointer.start.x,pointer.end.y-pointer.start.y);ctx.strokeRect(pointer.start.x,pointer.start.y,pointer.end.x-pointer.start.x,pointer.end.y-pointer.start.y);}
    mctx.drawImage(terrain(),0,0,mini.width,mini.height);drawFog(mctx,mini.width/WIDTH,mini.height/HEIGHT);const sx=mini.width/WIDTH,sy=mini.height/HEIGHT;for(const c of game.map.camps){const seen=c.seen[game.active];if(seen){mctx.fillStyle=seen.alive?'#d18c69':'#797f69';mctx.fillRect(c.x*sx-2,c.y*sy-2,4,4);}}for(const b of game.buildings.filter(b=>visibleTo(game,game.active,b))){mctx.fillStyle=TEAMS[b.owner].color;mctx.fillRect(b.x*sx-3,b.y*sy-3,6,6);}for(const u of game.units.filter(u=>!u.transportedBy&&visibleTo(game,game.active,u))){mctx.fillStyle=TEAMS[u.owner].color;mctx.fillRect(u.x*sx-1,u.y*sy-1,2,2);}mctx.strokeStyle='#dcf6d9';mctx.lineWidth=1;mctx.strokeRect((camera.x-view.width/camera.scale/2)*sx,(camera.y-view.height/camera.scale/2)*sy,view.width/camera.scale*sx,view.height/camera.scale*sy);
  }
  const networkStatus=t=>{$('net-status').textContent=t;};
  function connectNetwork(kind){if(net?.ws?.readyState===WebSocket.OPEN)return networkStatus('Veza već postoji.');let url=$('net-url').value.trim();if(!url)url=location.protocol==='https:'?'wss://'+location.host+'/ws':'ws://'+location.host+'/ws';
    let ws;try{const parsed=new URL(url);if(!['ws:','wss:'].includes(parsed.protocol))throw Error();ws=new WebSocket(url);}catch{return networkStatus('Unesi važeću WS/WSS adresu.');}
    const previous=net,sessionToken=sessionStorage.getItem('whr-v7-token');net={ws,seq:previous?.seq||0,pauseVote:false,intentional:false};const connection=net;
    networkStatus('Povezivanje…');ws.onopen=()=>{const message={kind,protocol:1,rules:CLIENT_RULES_HASH,name:$('net-name').value,mode:$('net-mode').value,id:$('net-id').value.trim()};if(kind==='resume')message.token=sessionToken;ws.send(JSON.stringify(message));};
    ws.onmessage=e=>{if(net!==connection)return;let m;try{m=JSON.parse(e.data);}catch{return;}if(m.rules&&m.rules!==CLIENT_RULES_HASH){networkStatus('Verzije pravila se razlikuju. Osveži klijent.');ws.close();return;}
      if(m.kind==='welcome'){connection.seq=m.seq;sessionStorage.setItem('whr-v7-token',m.token);$('net-id').value=m.id;networkStatus('Meč '+m.id+' · P'+(m.owner+1));$('net-ready').disabled=false;}
      if(m.kind==='lobby'){networkStatus('Meč '+m.id+' · '+m.players.map(p=>p.name+': '+(p.ready?'spreman':'čeka')).join(' / '));}
      if(m.kind==='error')networkStatus(m.error);
      if(m.kind==='ack'&&m.status!=='queued')notify(m.status==='applied'?'Server: nalog prihvaćen.':'Server: '+m.error);
      if(m.kind==='state'){const v=m.state,first=!started;const fresh=game;Object.assign(fresh,v);fresh.map.camps=v.camps;fresh.map.shops=v.shops;fresh.shrine={id:'shrine',type:'shrine',x:1280,y:1280};fresh.bases=fresh.buildings.filter(b=>b.type==='base');fresh.bots={};fresh.commandQueue=[];fresh.commandHistory=[];
        for(const p of fresh.players)for(const key of ['visible','explored']){const bytes=p[key]?atob(p[key]):null;p[key]=bytes?Uint8Array.from({length:25600},(_,i)=>(bytes.charCodeAt(i>>3)>>(i&7))&1):new Uint8Array(25600);}
        rebuildNavigation(fresh);game=fresh;started=true;$('welcome').hidden=true;$('pause').disabled=false;$('pause').textContent=game.paused?'Nastavi':'Pauza';if(first){selected=game.bases.filter(b=>b.owner===game.active).map(b=>b.id);home();}if(interactionTarget)interactionTarget=[...game.map.shops,...game.loot,game.shrine].find(x=>x.id===interactionTarget.id)||null;updateHUD();}
    };
    ws.onerror=()=>networkStatus('Server nije dostupan.');ws.onclose=()=>{if(net===connection&&!connection.intentional){networkStatus('Veza prekinuta. Vrati meč u roku 60 s.');notify('Veza prekinuta · svet na serveru nastavlja.');$('welcome').hidden=false;$('net-ready').disabled=true;}};
  }
  $('net-create').onclick=()=>connectNetwork('create');$('net-join').onclick=()=>connectNetwork('join');$('net-resume').onclick=()=>connectNetwork('resume');$('net-ready').onclick=()=>{net?.ws?.send(JSON.stringify({kind:'ready',ready:true}));$('net-ready').disabled=true;};
  function frame(time){const elapsed=lastTime?Math.max(0,time-lastTime):0;lastTime=time;if(!net&&!document.hidden&&started&&!game.paused&&!dialog.open){accumulator+=Math.min(elapsed,1000);let count=0;while(accumulator>=50&&count++<20){step(game);accumulator-=50;}}else accumulator=0;
    cameraMouseStep(elapsed);const movement=dialog.open?0:Math.min(elapsed,100)*.6/camera.scale;if(keys.has('ArrowLeft'))camera.x-=movement;if(keys.has('ArrowRight'))camera.x+=movement;if(keys.has('ArrowUp'))camera.y-=movement;if(keys.has('ArrowDown'))camera.y+=movement;camera.x=clamp(camera.x,0,WIDTH);camera.y=clamp(camera.y,0,HEIGHT);if(buildMode)updatePreview();render(time);updateHUD();requestAnimationFrame(frame);}
  document.addEventListener('visibilitychange',()=>{lastTime=0;accumulator=0;keys.clear();if(!net&&document.hidden&&started&&!game.paused)pause();});window.addEventListener('resize',resize);resize();updateHUD();requestAnimationFrame(frame);
  root.WHR=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({tick:game.tick,active:game.active,running:game.running,paused:game.paused,players:game.players.map(({visible,explored,...p})=>({...p,visibleCells:visible.reduce((a,b)=>a+b,0),exploredCells:explored.reduce((a,b)=>a+b,0)})),units:game.units,nodes:game.nodes,buildings:game.buildings,selected,activeSubtype,camera,view,debugNavigation,bindings:[...bindings].map(([key,target])=>({key,...target})),cameraHistoryDepth:cameraHistory.length,buildMode,preview:preview?{x:preview.x,y:preview.y,w:preview.w,h:preview.h,error:preview.error}:null,neutrals:game.neutrals,loot:game.loot,camps:game.map.camps,shops:game.map.shops,shrine:game.shrine,events:game.events,match:game.match,controllers:game.controllers,bots:game.bots,commandQueue:game.commandQueue,commandHistory:game.commandHistory,world:{width:WIDTH,height:HEIGHT},zones:game.map.zones}))});
})(typeof window!=='undefined'?window:globalThis);
