import {bindings} from './bindings';
export {bindings} from './bindings';
import {readAccess} from './access-storage';
import {seedDemo,applyAction,type DemoData,type CollaborationAlert,actionSchema} from '@/lib/demo-model';

export async function readDemo():Promise<DemoData>{
 const {db}=bindings();let row=await db.prepare('SELECT data, version FROM demo_state WHERE id = ?').bind('two-profile-demo-v2').first<{data:string;version:number}>();
 if(!row){const seed=seedDemo();await db.prepare('INSERT OR IGNORE INTO demo_state (id, data, version, updated_at) VALUES (?, ?, ?, ?)').bind('two-profile-demo-v2',JSON.stringify(seed),0,new Date().toISOString()).run();row=await db.prepare('SELECT data, version FROM demo_state WHERE id = ?').bind('two-profile-demo-v2').first<{data:string;version:number}>();}
 if(!row)throw Error('No se pudo cargar la demo.');const data={...JSON.parse(row.data),version:row.version};const access=await readAccess();data.profiles=access.members.filter(m=>m.status==='Activo'||data.properties.some((p:{ownerId:string})=>p.ownerId===m.id)||data.collaborations.some((c:{senderId:string;recipientId:string})=>c.senderId===m.id||c.recipientId===m.id)).map(m=>({id:m.id,name:m.name,agency:m.agency,initials:m.name.split(' ').slice(0,2).map(s=>s[0]).join(''),email:m.email,phone:m.phone,role:m.role==='admin'?'Administrador':'Asesor de la red',color:'#d9f56b',active:m.status==='Activo'}));data.notifications??=[];
 // Older responses are already durable events; surface their missing notices
 // with stable IDs, then persist read state through the normal CAS write.
 for(const c of data.collaborations){if(c.status==='Pendiente'||!c.senderId||!c.recipientId||data.notifications.some((n:CollaborationAlert)=>n.kind==='collaboration'&&n.collaborationId===c.id&&n.status===c.status))continue;
  const last=c.events?.at(-1);if(!last||!Number.isFinite(Date.parse(last.at)))continue;
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(c.id+'|'+c.status+'|'+last.at)));const id='LEGACY-'+Array.from(digest.slice(0,16)).map(n=>n.toString(16).padStart(2,'0')).join('');
  const who=data.profiles.find((p:{id:string})=>p.id===c.recipientId)?.name||data.properties.find((p:{id:string})=>p.id===c.propertyId)?.owner||'La contraparte';
  data.notifications.push({kind:'collaboration',id,actorId:c.senderId,collaborationId:c.id,propertyId:c.propertyId,propertyTitle:data.properties.find((p:{id:string})=>p.id===c.propertyId)?.title||c.propertyId,title:c.status==='Rechazada'?'Colaboración rechazada':c.status==='Aceptada'?'Colaboración aceptada':'Te pidieron una aclaración',message:who+': '+last.text,status:c.status,createdAt:last.at});
 }
 data.notifications.sort((a:{createdAt:string},b:{createdAt:string})=>b.createdAt.localeCompare(a.createdAt));return data;
}
export async function mutateDemo(raw:unknown){
 const a=actionSchema.parse(raw);const {db}=bindings();
 if(a.type==='property')for(const url of a.property.photos){if(!url.startsWith('/api/photos/'))continue;const photo=await db.prepare('SELECT actor_id FROM photo_uploads WHERE id = ?').bind(url.slice('/api/photos/'.length)).first<{actor_id:string}>();if(!photo||photo.actor_id!==a.actorId)throw Error('Una fotografía no pertenece a este perfil.');}
 for(let attempt=0;attempt<3;attempt++){
  const old=await readDemo();const next=applyAction(old,a);if(next.version===old.version)return old;
  const result=await db.prepare('UPDATE demo_state SET data = ?, version = ?, updated_at = ? WHERE id = ? AND version = ?').bind(JSON.stringify(next),next.version,new Date().toISOString(),'two-profile-demo-v2',old.version).run();
  if(result.meta.changes===1)return next;
 }
 throw Error('Otra acción actualizó la demo. Inténtalo de nuevo.');
}
