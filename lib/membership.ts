import {z} from 'zod';
export type Member={id:string;userId?:string;email:string;name:string;agency:string;phone:string;role:'admin'|'advisor';status:'Pendiente'|'Activo'|'Rechazado'|'Suspendido';createdAt:string;updatedAt:string;invitationId?:string;reviewNote?:string};
export type Invitation={id:string;code:string;email:string;name:string;role:'admin'|'advisor';createdBy:string;createdAt:string;expiresAt:string;usedAt?:string;usedBy?:string;revokedAt?:string};
export type AccessData={version:number;members:Member[];invitations:Invitation[];events:{id:string;actorId:string;text:string;at:string}[]};
export type Identity={userId:string;email:string;displayName:string};
export const OWNER_EMAIL='pabloirausquinp@gmail.com';
export class AccessError extends Error{constructor(message:string,public status=403){super(message)}}
const profileFields={name:z.string().trim().min(3,'Escribe tu nombre completo.').max(140),agency:z.string().trim().min(2,'Indica tu agencia o “Independiente”.').max(140),phone:z.string().trim().min(7,'Indica un teléfono de contacto.').max(30)};
export const registrationSchema=z.object({...profileFields,code:z.string().trim().max(80).default('')});
export const adminSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('invite'),email:z.string().trim().email('Revisa el correo del invitado.').max(200),name:z.string().trim().min(3).max(140),role:z.enum(['advisor','admin']),days:z.union([z.literal(7),z.literal(30)])}),
 z.object({type:z.literal('revoke'),id:z.string().max(90)}),
 z.object({type:z.literal('review'),id:z.string().max(90),status:z.enum(['Activo','Rechazado','Suspendido']),note:z.string().trim().max(500).default('')}),
 z.object({type:z.literal('role'),id:z.string().max(90),role:z.enum(['advisor','admin'])}),
 z.object({type:z.literal('add'),email:z.string().trim().email().max(200),...profileFields,role:z.enum(['advisor','admin'])})
]);
export const emptyAccess=():AccessData=>({version:0,members:[],invitations:[],events:[]});
const emailKey=(s:string)=>s.trim().toLowerCase();
const codeKey=(s:string)=>s.replace(/[^a-z0-9]/gi,'').toUpperCase();
function event(d:AccessData,actorId:string,text:string,now:string){d.events.unshift({id:crypto.randomUUID(),actorId,text,at:now})}
export function ensureOwner(data:AccessData,user:Identity,now=new Date().toISOString()){
 if(emailKey(user.email)!==OWNER_EMAIL||data.members.some(m=>m.email===OWNER_EMAIL))return data;
 const d=structuredClone(data);d.members.push({id:'MEM-OWNER',userId:user.userId,email:OWNER_EMAIL,name:'Pablo Irausquin',agency:'cuatroporciento',phone:'',role:'admin',status:'Activo',createdAt:now,updatedAt:now});d.version++;event(d,'MEM-OWNER','Administración inicial habilitada.',now);return d;
}
export function memberFor(data:AccessData,user:Identity){return data.members.find(m=>m.userId===user.userId&&m.email===emailKey(user.email))||null}
export function applyRegistration(data:AccessData,user:Identity,raw:unknown,now=new Date().toISOString()):AccessData{
 const input=registrationSchema.parse(raw);const d=structuredClone(data);let member=d.members.find(m=>m.email===emailKey(user.email));
 if(member?.userId&&member.userId!==user.userId)throw new AccessError('Ese correo ya está vinculado a otra identidad.');
 if(member?.status==='Suspendido'||member?.status==='Rechazado')throw new AccessError('Tu acceso requiere una revisión del administrador.');
 if(member?.status==='Activo'&&member.userId)return data;
 let invite:Invitation|undefined;
 if(input.code){invite=d.invitations.find(i=>codeKey(i.code)===codeKey(input.code));if(!invite||invite.revokedAt||invite.usedAt||invite.expiresAt<=now)throw new AccessError('El código no es válido, venció o ya fue utilizado.',400);if(invite.email!==emailKey(user.email))throw new AccessError('Esta invitación corresponde a otro correo. Inicia sesión con el correo invitado.',400);}
 if(member){Object.assign(member,input,{userId:user.userId,updatedAt:now});delete (member as Member&{code?:string}).code;if(invite){member.status='Activo';member.role=invite.role;member.invitationId=invite.id;}}
 else{member={id:'MEM-'+crypto.randomUUID(),userId:user.userId,email:emailKey(user.email),name:input.name,agency:input.agency,phone:input.phone,role:invite?.role||'advisor',status:invite?'Activo':'Pendiente',createdAt:now,updatedAt:now,invitationId:invite?.id};d.members.push(member);}
 if(invite){invite.usedAt=now;invite.usedBy=member.id;}
 event(d,member.id,invite?'Registro con invitación: '+member.name:'Registro recibido: '+member.name,now);d.version++;return d;
}
export function applyAdmin(data:AccessData,actor:Member,raw:unknown,now=new Date().toISOString()):AccessData{
 const current=data.members.find(m=>m.id===actor.id);if(!current||current.status!=='Activo'||current.role!=='admin')throw new AccessError('Solo un administrador activo puede realizar esta acción.');
 const action=adminSchema.parse(raw);const d=structuredClone(data);
 if(action.type==='invite'){
  if(d.members.some(m=>m.email===emailKey(action.email)&&m.status==='Activo'&&m.userId))throw new AccessError('Este asesor ya tiene acceso activo.',400);
  const rawCode=crypto.randomUUID().replace(/-/g,'').toUpperCase();const code='CF-'+rawCode.match(/.{1,8}/g)!.join('-');
  d.invitations.unshift({id:'INV-'+crypto.randomUUID(),code,email:emailKey(action.email),name:action.name,role:action.role,createdBy:actor.id,createdAt:now,expiresAt:new Date(Date.parse(now)+action.days*86400000).toISOString()});event(d,actor.id,'Invitación creada para '+action.email,now);
 }else if(action.type==='revoke'){const i=d.invitations.find(i=>i.id===action.id);if(!i||i.usedAt)throw new AccessError('La invitación no existe o ya fue utilizada.',400);i.revokedAt??=now;event(d,actor.id,'Invitación revocada: '+i.email,now);
 }else if(action.type==='add'){
  if(d.members.some(m=>m.email===emailKey(action.email)))throw new AccessError('Este correo ya está registrado. Revisa su ficha.',400);
  d.members.push({id:'MEM-'+crypto.randomUUID(),email:emailKey(action.email),name:action.name,agency:action.agency,phone:action.phone,role:action.role,status:'Activo',createdAt:now,updatedAt:now});event(d,actor.id,'Alta autorizada para '+action.email,now);
 }else{
  const m=d.members.find(m=>m.id===action.id);if(!m)throw new AccessError('No encontramos ese registro.',404);
  if(m.email===OWNER_EMAIL)throw new AccessError('La cuenta propietaria conserva la administración.',400);
  if(m.role==='admin'&&m.status==='Activo'&&(action.type==='role'&&action.role!=='admin'||action.type==='review'&&action.status!=='Activo')&&d.members.filter(m=>m.role==='admin'&&m.status==='Activo').length<2)throw new AccessError('Debe permanecer al menos un administrador activo.',400);
  if(action.type==='review'){m.status=action.status;m.reviewNote=action.note;event(d,actor.id,m.name+': '+action.status+(action.note?' · '+action.note:''),now);}else{m.role=action.role;event(d,actor.id,'Rol actualizado: '+m.name+' · '+action.role,now);}m.updatedAt=now;
 }
 d.version++;return d;
}
