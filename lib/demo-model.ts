import {criteriaLabels,requirementCriteria} from './property-search';
import {z} from 'zod';
import {initialProperties,initialRequirements,money,conditions,getMatches,propertyTypes,type Property,type Requirement,type Collaboration} from './real-estate';
export const profiles=[
 {id:'alejandro',name:'Alejandro Medina',agency:'Asesor independiente',initials:'AM',email:'alejandro@example.com',role:'Busca opciones para sus clientes',color:'#d9f56b'},
 {id:'mariana',name:'Mariana López',agency:'López Bienes Raíces',initials:'ML',email:'mariana@example.com',role:'Publica inventario y recibe solicitudes',color:'#bcdbeb'}
] as const;
export type ActorId=string;
export type AdvisorProfile={id:string;name:string;agency:string;initials:string;email:string;phone?:string;role:string;color:string;active?:boolean};
export function profile(id:string,custom:AdvisorProfile[]=[]):AdvisorProfile{const p=[...custom,...profiles].find(p=>p.id===id);if(!p)throw new Error('Perfil de demo no válido.');return p;}
export type CollaborationAlert={kind:'collaboration';id:string;actorId:string;collaborationId:string;propertyId:string;propertyTitle:string;title:string;message:string;status:Collaboration['status'];createdAt:string;readAt?:string};
export type Notification=MatchAlert|CollaborationAlert;
export type MatchAlert={kind?:'match';id:string;actorId:ActorId;requirementId:string;propertyId:string;createdAt:string;readAt?:string;propertyTitle:string;requirementReference:string;reasons:string[]};
export type DemoData={version:number;notifications?:Notification[];profiles?:AdvisorProfile[];properties:Property[];requirements:Requirement[];collaborations:Collaboration[];saved:Record<string,string[]>;reports:{id:string;propertyId:string;actorId:ActorId;text:string;at:string}[]};
export function seedDemo():DemoData {
 const properties=initialProperties.map(p=>{const actor=profile(p.mine?'alejandro':'mariana');return {...p,ownerId:actor.id,owner:actor.name,agency:actor.agency,mine:false,photos:[p.image]}});
 const requirements=initialRequirements.map((r,i)=>({...r,ownerId:i===0?'alejandro':'mariana'}));
 const p=properties.find(p=>p.id==='RCI-005')!;
 return {version:0,notifications:[],properties,requirements,collaborations:[{id:'COL-DEMO-01',senderId:'mariana',recipientId:'alejandro',propertyId:p.id,direction:'Enviada',status:'Pendiente',colleague:'Alejandro Medina',message:'Tengo un cliente que busca dos recámaras en El Molino. ¿Podemos confirmar disponibilidad para una visita?',requirementId:'REQ-02',priceSnapshot:p.price,commissionSnapshot:p.commission,operationSnapshot:p.operation,conditionsSnapshot:conditions(p),events:[{actorId:'mariana',text:'Solicitud enviada. Tengo un cliente que busca dos recámaras en El Molino. ¿Podemos confirmar disponibilidad para una visita?',at:'2026-10-07T01:00:00.000Z'}]}],saved:{alejandro:[],mariana:[]},reports:[]};
}
const id=z.string().min(1).max(90);
const actor=id;
const photo=z.string().max(500).refine(s=>s.startsWith('/api/photos/')||initialProperties.some(p=>p.image===s),'La fotografía no pertenece a esta demo.');
const clientDetailsSchema=z.object({city:z.string().trim().max(90).optional(),state:z.string().trim().max(90).optional(),address:z.string().trim().max(300).optional(),neighborhood:z.string().trim().max(150).optional(),postalCode:z.string().trim().regex(/^\d{5}$|^$/,'El código postal debe tener 5 dígitos.').optional(),maintenance:z.string().trim().max(150).optional(),furnishing:z.string().trim().max(100).optional(),distribution:z.string().trim().max(3000).optional(),equipment:z.string().trim().max(3000).optional(),terms:z.string().trim().max(2000).optional()});
const propertySchema=z.object({id,title:z.string().trim().min(3).max(140),type:z.enum(propertyTypes),operation:z.enum(['Venta','Renta']),zone:z.string().trim().min(2).max(200),price:z.number().finite().positive().max(1e11),beds:z.number().int().min(0).max(100),baths:z.number().min(0).max(100),parking:z.number().int().min(0).max(100),area:z.number().min(0).max(1e7),land:z.number().min(0).max(1e7),garden:z.boolean(),pool:z.boolean(),image:photo,photos:z.array(photo).min(1).max(10),direct:z.boolean(),exclusive:z.boolean(),status:z.enum(['Disponible','Reservado','Vendido','Rentado','Retirado','Pendiente de reconfirmación']),confirmed:z.string().max(90),commission:z.number().min(0).max(100),description:z.string().max(3000),clientDetails:clientDetailsSchema.optional()});
const requirementSchema=z.object({id,reference:z.string().trim().min(3).max(140),operation:z.enum(['Venta','Renta','Indistinta']),type:z.enum(['Indistinto',...propertyTypes]),zones:z.array(z.string().trim().min(2).max(200)).max(10),budget:z.number().finite().min(0).max(1e11),beds:z.number().int().min(0).max(100),parking:z.number().int().min(0).max(100),garden:z.boolean(),gardenMode:z.enum(['Indiferente','Con jardín','Sin jardín']).optional(),poolMode:z.enum(['Indiferente','Con alberca','Sin alberca']).optional(),baths:z.number().min(0).max(100).optional(),minArea:z.number().min(0).max(1e7).optional(),minLand:z.number().min(0).max(1e7).optional(),furnishing:z.enum(['Indistinto','Amueblado','Sin muebles']).optional(),features:z.array(z.string().trim().min(1).max(90)).max(20).optional(),keywords:z.string().trim().max(500).optional(),searchText:z.string().trim().max(500).optional(),status:z.enum(['Activo','Pausado','Resuelto','Vencido']),flexBudget:z.boolean(),alerts:z.boolean()});
export const actionSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('notifications_read'),actorId:actor,ids:z.array(id).min(1).max(300)}),
 z.object({type:z.literal('property'),actorId:actor,property:propertySchema}),
 z.object({type:z.literal('property_status'),actorId:actor,propertyId:id,status:propertySchema.shape.status}),
 z.object({type:z.literal('requirement'),actorId:actor,requirement:requirementSchema}),
 z.object({type:z.literal('request'),actorId:actor,id,propertyId:id,requirementId:z.string().max(90),message:z.string().trim().min(3).max(1500)}),
 z.object({type:z.literal('respond'),actorId:actor,collaborationId:id,status:z.enum(['Aceptada','Rechazada','Aclaración','Pendiente']),message:z.string().trim().max(1500).default('')}),
 z.object({type:z.literal('save'),actorId:actor,propertyId:id,save:z.boolean()}),
 z.object({type:z.literal('report'),actorId:actor,id,propertyId:id,message:z.string().trim().min(3).max(1500)})
]);
export type DemoAction=z.infer<typeof actionSchema>;
export function applyAction(data:DemoData,raw:unknown,now=new Date().toISOString()):DemoData{
 const action=actionSchema.parse(raw);const a=profile(action.actorId,data.profiles);const d=structuredClone(data);d.notifications??=[];
 if(action.type==='property'){
  const old=d.properties.find(p=>p.id===action.property.id);
  if(old&&old.ownerId!==a.id)throw Error('Solo puedes editar tus propiedades.');
  if(action.property.operation==='Venta'&&action.property.status==='Rentado'||action.property.operation==='Renta'&&action.property.status==='Vendido')throw Error('El estado no corresponde a la operación.');
  const photos=Array.from(new Set(action.property.photos));if(photos.length<8)throw Error('Agrega al menos 8 fotografías diferentes antes de publicar o guardar la propiedad.');if(['Terreno','Lote comercial'].includes(action.property.type)&&action.property.land<=0)throw Error('Indica la superficie del terreno.');
  if(!photos.includes(action.property.image))throw Error('La portada debe ser una de tus fotografías.');
  const p:Property={...action.property,photos,ownerId:a.id,owner:a.name,agency:a.agency,mine:false,confirmed:old?.confirmed||'Hoy'};
  d.properties=old?d.properties.map(x=>x.id===p.id?p:x):[p,...d.properties];
 }else if(action.type==='property_status'){
  const p=d.properties.find(x=>x.id===action.propertyId);if(!p||p.ownerId!==a.id)throw Error('Solo puedes actualizar tus propiedades.');
  if(p.operation==='Venta'&&action.status==='Rentado'||p.operation==='Renta'&&action.status==='Vendido')throw Error('El estado no corresponde a la operación.');
  if(action.status==='Disponible'&&(new Set(p.photos||[p.image])).size<8)throw Error('Completa al menos 8 fotografías antes de reconfirmar esta propiedad.');p.status=action.status;if(action.status==='Disponible')p.confirmed='Hoy';
 }else if(action.type==='requirement'){
  const old=d.requirements.find(r=>r.id===action.requirement.id);if(old&&old.ownerId!==a.id)throw Error('Solo puedes editar tus requerimientos.');
  const r:Requirement={...action.requirement,ownerId:a.id,createdAt:old?.createdAt||(!old?now:undefined),updatedAt:now,history:[...(old?.history||[])]};
  const text=!old?'Solicitud registrada':old.status!==r.status?'Estado: '+r.status:old.alerts!==r.alerts?(r.alerts?'Alertas activadas':'Alertas desactivadas'):'Criterios actualizados';
  r.history!.push({at:now,text,criteria:criteriaLabels(requirementCriteria(r))});
  d.requirements=old?d.requirements.map(x=>x.id===r.id?r:x):[r,...d.requirements];
 }else if(action.type==='notifications_read'){
  for(const id of action.ids){const notice=d.notifications.find(n=>n.id===id);if(!notice||notice.actorId!==a.id)throw Error('Esta alerta no pertenece a tu perfil.');notice.readAt??=now;}
 }else if(action.type==='request'){
  if(d.collaborations.some(c=>c.id===action.id))return data;
  const p=d.properties.find(p=>p.id===action.propertyId);if(!p||p.status!=='Disponible')throw Error('Esta propiedad ya no está disponible.');
  if(p.ownerId===a.id)throw Error('No puedes solicitar colaboración sobre tu propia propiedad.');if(profile(p.ownerId!,d.profiles).active===false)throw Error('La propiedad pertenece a un asesor sin acceso activo.');
  if(action.requirementId){const r=d.requirements.find(r=>r.id===action.requirementId);if(!r||r.ownerId!==a.id||r.status!=='Activo')throw Error('El requerimiento no está activo en tu perfil.');}
  if(d.collaborations.some(c=>c.propertyId===p.id&&c.senderId===a.id&&c.status!=='Rechazada'))throw Error('Ya tienes una solicitud para esta propiedad.');
  d.collaborations.unshift({id:action.id,propertyId:p.id,senderId:a.id,recipientId:p.ownerId,direction:'Enviada',colleague:p.owner,status:'Pendiente',message:action.message,requirementId:action.requirementId,priceSnapshot:p.price,commissionSnapshot:p.commission,operationSnapshot:p.operation,conditionsSnapshot:conditions(p),events:[{actorId:a.id,text:action.message,at:now}]});
  if(p.ownerId)d.notifications.unshift({kind:'collaboration',id:'NOTICE-'+crypto.randomUUID(),actorId:p.ownerId,collaborationId:action.id,propertyId:p.id,propertyTitle:p.title,title:'Nueva solicitud de colaboración',message:a.name+': '+action.message,status:'Pendiente',createdAt:now});
 }else if(action.type==='respond'){
  const c=d.collaborations.find(x=>x.id===action.collaborationId);if(!c)throw Error('No encontramos esta solicitud.');
  if(action.status==='Pendiente'){
   if(c.senderId!==a.id||c.status!=='Aclaración')throw Error('Esta solicitud no espera una respuesta de tu perfil.');
   if(action.message.length<3)throw Error('Escribe tu respuesta.');c.status='Pendiente';c.clarification=action.message;
  }else{
   if(c.recipientId!==a.id||c.status!=='Pendiente')throw Error('Esta solicitud no está pendiente de tu respuesta.');
   if(action.status==='Aclaración'&&action.message.length<3)throw Error('Indica qué necesitas aclarar.');
   c.status=action.status;c.clarification=action.message;if(action.status==='Aceptada')c.acceptedAt=now;
  }
  const receiver=c.senderId===a.id?c.recipientId:c.senderId;if(receiver)d.notifications.unshift({kind:'collaboration',id:'NOTICE-'+crypto.randomUUID(),actorId:receiver,collaborationId:c.id,propertyId:c.propertyId,propertyTitle:d.properties.find(p=>p.id===c.propertyId)?.title||c.propertyId,title:({Aceptada:'Colaboración aceptada',Rechazada:'Colaboración rechazada',Aclaración:'Te pidieron una aclaración',Pendiente:'Respuesta a tu aclaración'}[action.status]),message:a.name+': '+(action.message||({Aceptada:'Aceptó las condiciones.',Rechazada:'Rechazó la colaboración.',Aclaración:'Pidió una aclaración.',Pendiente:'Respondió tu mensaje.'}[action.status])),status:c.status,createdAt:now});
  c.events??=[];c.events.push({actorId:a.id,text:action.message||({Aceptada:'Aceptó las condiciones de colaboración.',Rechazada:'Rechazó la solicitud.',Aclaración:'Pidió una aclaración.',Pendiente:'Respondió la aclaración.'}[action.status]),at:now});
 }else if(action.type==='save'){
  if(!d.properties.some(p=>p.id===action.propertyId))throw Error('No encontramos la propiedad.');
  d.saved[a.id]??=[];d.saved[a.id]=action.save?Array.from(new Set([...d.saved[a.id],action.propertyId])):d.saved[a.id].filter(x=>x!==action.propertyId);
 }else if(action.type==='report'){
  if(!d.properties.some(p=>p.id===action.propertyId))throw Error('No encontramos la propiedad.');
  if(!d.reports.some(r=>r.id===action.id))d.reports.push({id:action.id,propertyId:action.propertyId,actorId:a.id,text:action.message,at:now});
 }
 if(['property','property_status','requirement'].includes(action.type)){
  for(const r of d.requirements){if(r.status!=='Activo'||!r.alerts||!r.ownerId||profile(r.ownerId,d.profiles).active===false||(action.type==='requirement'&&r.id!==action.requirement.id))continue;
   for(const p of getMatches(r,d.properties.filter(p=>!p.ownerId||profile(p.ownerId,d.profiles).active!==false))){if(action.type==='property'&&p.id!==action.property.id||action.type==='property_status'&&p.id!==action.propertyId)continue;if(d.notifications.some(n=>n.kind!=='collaboration'&&n.requirementId===r.id&&n.propertyId===p.id))continue;
    d.notifications.unshift({id:'MATCH-'+crypto.randomUUID(),actorId:r.ownerId as ActorId,requirementId:r.id,propertyId:p.id,createdAt:now,propertyTitle:p.title,requirementReference:r.reference,reasons:criteriaLabels(requirementCriteria(r))});
   }
  }
 }
 d.version=data.version+1;return d;
}
export function forActor(data:DemoData,actorId:ActorId){
 return {notifications:(data.notifications||[]).filter(n=>n.actorId===actorId),properties:data.properties.map(p=>({...p,mine:p.ownerId===actorId})),requirements:data.requirements.filter(r=>r.ownerId===actorId),collaborations:data.collaborations.filter(c=>c.senderId===actorId||c.recipientId===actorId).map(c=>({...c,direction:c.recipientId===actorId?'Recibida' as const:'Enviada' as const,colleague:profile(c.senderId===actorId?c.recipientId!:c.senderId!,data.profiles).name})),saved:data.saved[actorId]||[]};
}
export function requestSummary(c:Collaboration){return `${money(c.priceSnapshot)} · ${c.status}`;}
