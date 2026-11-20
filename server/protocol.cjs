'use strict';
const id=x=>typeof x==='string'&&x.length>0&&x.length<=96;
const ids=x=>Array.isArray(x)&&x.length>0&&x.length<=128&&x.every(id)&&new Set(x).size===x.length;
const point=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>['id','x','y'].includes(k))&&(x.id===undefined||id(x.id))&&Number.isFinite(x.x)&&Number.isFinite(x.y)&&x.x>=0&&x.y>=0&&x.x<2560&&x.y<2560;
const target=x=>point(x)||x&&Object.keys(x).length===1&&id(x.id);
const append=x=>x===undefined||typeof x==='boolean';
function valid(type,a){if(!Array.isArray(a)||a.length>5)return false;
 switch(type){
 case 'command':return a.length>=2&&a.length<=4&&ids(a[0])&&['move','attack','gather','stop','hold','patrol','follow','attackMove'].includes(a[1])&&(['stop','hold','gather'].includes(a[1])?(a[2]==null||target(a[2])):target(a[2]))&&append(a[3]);
 case 'beginBuild':return a.length>=3&&a.length<=4&&id(a[0])&&['base','barracks','relay','tower','academy','support','workshop','altar','airfield','cloakCenter','anchor'].includes(a[1])&&point(a[2])&&append(a[3]);
 case 'setRally':return a.length===2&&ids(a[0])&&(a[1]===null||target(a[1]));
 case 'clearPending':return a.length===1&&ids(a[0]);
 case 'purchaseGroup':return a.length===2&&id(a[0])&&ids(a[1]);
 case 'purchase':return a.length===2&&a.every(id);
 case 'startUpgrade':case 'reviveHero':case 'cancelBuild':case 'unloadCargo':case 'detector':return a.length===1&&id(a[0]);
 case 'startResearch':case 'useItem':case 'pickupLoot':case 'teleport':return a.length===2&&a.every(id);
 case 'loadCargo':return a.length===2&&id(a[0])&&ids(a[1]);
 case 'resumeBuild':case 'startRepair':return a.length>=2&&a.length<=3&&id(a[0])&&id(a[1])&&append(a[2]);
 case 'shopBuy':case 'transferItem':return a.length===3&&a.every(id);
 case 'summonHero':return a.length===2&&id(a[0])&&['bastion','pulsar','echo'].includes(a[1]);
 case 'ability':return a.length>=2&&a.length<=3&&id(a[0])&&[0,1].includes(a[1])&&(a[2]===undefined||point(a[2]));
 case 'interactMove':return a.length===2&&ids(a[0])&&target(a[1]);
 default:return false;
 }}
function command(m){return m&&Object.keys(m).every(k=>['kind','seq','type','args'].includes(k))&&m.kind==='command'&&Number.isSafeInteger(m.seq)&&m.seq>0&&valid(m.type,m.args);}
module.exports={command,valid};
