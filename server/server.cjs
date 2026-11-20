'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{performance}=require('node:perf_hooks');
const {WebSocketServer,WebSocket}=require('ws'),A=require('../script.js'),{view}=require('./view.cjs'),P=require('./protocol.cjs');
const ROOT=path.resolve(__dirname,'..'),PROTOCOL=1,RULES_HASH=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'core.part'))).digest('hex').slice(0,16);
function createServer(options={}){
 const matches=new Map(),sessions=new Map(),origins=options.origins||[],metrics={ticks:0,maxTickMs:0,rejected:0,maxStateBytes:0,stateBytes:0};
 const server=http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://local').pathname);}catch{res.writeHead(400);return res.end();}
  if(name==='/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({service:'WHR',version:'0.7.0',protocol:PROTOCOL,matches:matches.size,metrics}));}
  const allowed={'/':'index.html','/index.html':'index.html','/script.js':'script.js','/style.css':'style.css'};
  if(!allowed[name]){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');fs.createReadStream(path.join(ROOT,allowed[name])).pipe(res);
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:16384,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{socket.on('error',()=>{});if(wss.clients.size>=80){socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');return socket.destroy();}if(new URL(req.url,'http://local').pathname!=='/ws'||(origins.length?!origins.includes(req.headers.origin):req.headers.origin&&(()=>{try{return new URL(req.headers.origin).host!==req.headers.host;}catch{return true;}})())){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');return socket.destroy();}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));});
 const send=(ws,data)=>{if(ws?.readyState!==WebSocket.OPEN)return;if(ws.bufferedAmount>2*1024*1024){ws.close(1013,'Slow client');return;}ws.send(JSON.stringify(data));};
 const roster=m=>({kind:'lobby',id:m.id,mode:m.mode,started:m.started,players:m.slots.map((s,i)=>({slot:m.owners[i],name:s?.name||'',ready:!!s?.ready,connected:!!s?.ws})),host:m.owners[0]});
 const lobby=m=>m.slots.forEach(s=>s&&send(s.ws,roster(m)));
 function bind(ws,s){if(s.ws&&s.ws!==ws){s.ws.session=null;s.ws.close(4001,'Replaced connection');}s.ws=ws;s.droppedAt=null;ws.session=s;send(ws,{kind:'welcome',protocol:PROTOCOL,rules:RULES_HASH,token:s.token,id:s.match.id,owner:s.owner,seq:s.high});if(s.match.started)sendState(s);else lobby(s.match);}
 function sendState(s){const packet={kind:'state',protocol:PROTOCOL,rules:RULES_HASH,state:view(s.match.g,s.owner,s.memory)},bytes=Buffer.byteLength(JSON.stringify(packet));metrics.maxStateBytes=Math.max(metrics.maxStateBytes,bytes);metrics.stateBytes+=bytes;send(s.ws,packet);}
 function create(ws,msg){if(matches.size>=16)return send(ws,{kind:'error',error:'Server je pun.'});if(!['1v1','2v2'].includes(msg.mode))return;const id=crypto.randomBytes(5).toString('hex'),owners=msg.mode==='2v2'?[0,1,2,3]:[0,3],m={id,mode:msg.mode,owners,slots:owners.map(()=>null),started:false,last:performance.now(),acc:0,queue:[],emptyAt:null};matches.set(id,m);join(ws,m,msg.name);}
 function join(ws,m,name){if(m.started)return send(ws,{kind:'error',error:'Meč je počeo.'});const i=m.slots.findIndex(s=>!s);if(i<0)return send(ws,{kind:'error',error:'Nema slobodnog mesta.'});const s={token:crypto.randomBytes(32).toString('base64url'),owner:m.owners[i],name:typeof name==='string'?name.slice(0,32):'Igrač',match:m,ready:false,ws:null,high:0,ledger:new Map(),memory:new Map(),droppedAt:null,pauseVote:false};m.slots[i]=s;sessions.set(s.token,s);bind(ws,s);}
 function start(m){const g=A.createGame(0);g.running=true;g.controllers=[0,1,2,3].map(o=>m.owners.includes(o)?'human':'inactive');g.units=g.units.filter(u=>m.owners.includes(u.owner));g.buildings=g.buildings.filter(b=>m.owners.includes(b.owner));g.bases=g.bases.filter(b=>m.owners.includes(b.owner));g.match={mode:'network'+m.mode,participants:m.owners,teams:m.mode==='2v2'?[0,0,1,1]:[0,1,2,3],result:null};for(const n of g.nodes)if(n.miner&&!g.units.some(u=>u.id===n.miner))n.miner=null;A.rebuildNavigation(g);A.updateVision(g);m.g=g;m.started=true;m.last=performance.now();lobby(m);m.slots.forEach(sendState);}
 wss.on('connection',ws=>{ws.alive=true;ws.quota=40;ws.quotaAt=performance.now();const authTimer=setTimeout(()=>{if(!ws.session)ws.close(4003,'Join timeout');},10000);ws.on('error',()=>{});ws.on('pong',()=>ws.alive=true);
  ws.on('message',(bytes,isBinary)=>{if(isBinary)return ws.close(1003,'Text messages only');const now=performance.now();ws.quota=Math.min(40,ws.quota+(now-ws.quotaAt)*.02);ws.quotaAt=now;if(ws.quota<1){metrics.rejected++;return send(ws,{kind:'error',error:'Previše poruka.'});}ws.quota--;let msg;try{msg=JSON.parse(bytes.toString());}catch{return ws.close(1007,'Invalid JSON');}if(!msg||Array.isArray(msg)||typeof msg!=='object')return;
   if(!ws.session){if(msg.protocol!==PROTOCOL||msg.rules!==RULES_HASH)return send(ws,{kind:'error',error:'Neusklađen protokol.'});
    if(msg.kind==='resume'){const s=sessions.get(msg.token);if(!s||s.droppedAt&&Date.now()-s.droppedAt>60000)return send(ws,{kind:'error',error:'Sesija je istekla.'});bind(ws,s);return;}
    if(msg.kind==='create')return create(ws,msg);if(msg.kind==='join'){const m=matches.get(msg.id);return m?join(ws,m,msg.name):send(ws,{kind:'error',error:'Meč ne postoji.'});}return;
   }
   const s=ws.session,m=s.match;if(s.ws!==ws)return;
   if(msg.kind==='ready'&&!m.started){s.ready=!!msg.ready;lobby(m);if(m.slots.every(s=>s?.ready&&s.ws))start(m);return;}
   if(msg.kind==='pause'&&m.started&&!m.g.match.result){s.pauseVote=!!msg.vote;m.g.paused=m.slots.every(s=>s.pauseVote&&s.ws);m.slots.forEach(sendState);return;}
   if(msg.kind!=='command'||!m.started)return;
   if(!P.command(msg)){metrics.rejected++;return send(ws,{kind:'ack',seq:Number.isSafeInteger(msg.seq)?msg.seq:0,status:'rejected',error:'Nevažeća komanda.'});}
   const fingerprint=JSON.stringify([msg.type,msg.args]),old=s.ledger.get(msg.seq);
   if(old){if(old.fingerprint!==fingerprint)return send(ws,{kind:'ack',seq:msg.seq,status:'rejected',error:'Isti sequence ima drugi sadržaj.'});return send(ws,old.response);}
   if(msg.seq<=s.high||msg.seq>s.high+128||m.queue.length>=256)return send(ws,{kind:'ack',seq:msg.seq,status:'rejected',error:'Zastarela komanda ili pun red.'});
   s.high=msg.seq;const entry={fingerprint,response:{kind:'ack',seq:msg.seq,status:'queued'}};s.ledger.set(msg.seq,entry);m.queue.push({session:s,msg,entry});send(ws,entry.response);while(s.ledger.size>256)s.ledger.delete(s.ledger.keys().next().value);
  });
  ws.on('close',()=>{clearTimeout(authTimer);const s=ws.session;if(s?.ws===ws){s.ws=null;s.droppedAt=Date.now();s.pauseVote=false;if(s.match.started)s.match.g.paused=false;else lobby(s.match);}});
 });
 function result(m){const g=m.g;if(g.match.result)return;for(const s of m.slots)if(s.droppedAt&&Date.now()-s.droppedAt>60000)g.players[s.owner].defeated=true;const teams=[...new Set(m.owners.filter(o=>!g.players[o].defeated).map(o=>g.match.teams[o]))];if(teams.length<=1){g.match.result={winnerTeam:teams[0]??null,winner:teams.length?m.owners.find(o=>g.match.teams[o]===teams[0]&&!g.players[o].defeated):null,tick:g.tick};}}
 const timer=setInterval(()=>{const now=performance.now();for(const m of matches.values()){
  if(m.slots.every(s=>!s?.ws)){m.emptyAt??=Date.now();if(Date.now()-m.emptyAt>65000){for(const s of m.slots)if(s)sessions.delete(s.token);matches.delete(m.id);} }else m.emptyAt=null;
  if(!m.started)continue;const dt=Math.min(250,Math.max(0,now-m.last));m.last=now;m.acc+=dt;
  let count=0;while(m.acc>=50&&count++<4){const began=performance.now();for(const c of m.queue.splice(0)){let r;if(m.g.match.result)r={accepted:false,error:'Meč je završen.'};else try{r=A.serverCommand(m.g,c.session.owner,{type:c.msg.type,args:c.msg.args,seq:c.msg.seq,tick:m.g.tick});}catch{r={accepted:false,error:'Komanda nije prihvaćena.'};}
   c.entry.response={kind:'ack',seq:c.msg.seq,status:r.accepted?'applied':'rejected',tick:m.g.tick,error:r.error||null};send(c.session.ws,c.entry.response);}
   try{if(!m.g.match.result)A.step(m.g);result(m);}catch(e){m.g.running=false;m.g.match.result={winner:null,error:'Simulacija je zaustavljena zbog greške.'};console.error('WHR match stopped',m.id,e.message);}
   metrics.ticks++;metrics.maxTickMs=Math.max(metrics.maxTickMs,performance.now()-began);m.acc-=50;
  }
  if((m.publishAt||0)<=now){m.publishAt=now+100;for(const s of m.slots)if(s.ws)sendState(s);}
 }},10);
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},15000);
 return {server,wss,matches,sessions,metrics,listen:(port=8080,host='127.0.0.1')=>new Promise(resolve=>server.listen(port,host,()=>resolve(server.address()))),close:()=>new Promise(resolve=>{clearInterval(timer);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();wss.close(()=>server.close(resolve));})};
}
module.exports={createServer,PROTOCOL,RULES_HASH};
if(require.main===module){const origins=(process.env.WHR_ORIGINS||'').split(',').filter(Boolean);if(process.env.WHR_HOST&&!['127.0.0.1','localhost'].includes(process.env.WHR_HOST)&&!origins.length)throw Error('Public/LAN binding requires WHR_ORIGINS allowlist.');const app=createServer({origins});app.listen(Number(process.env.PORT)||8080,process.env.WHR_HOST||'127.0.0.1').then(a=>console.log('WHR 0.7.0 http://'+a.address+':'+a.port));process.on('SIGINT',()=>app.close().then(()=>process.exit(0)));}
