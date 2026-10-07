import {conditions} from './real-estate';
import {seedDemo,profiles,type DemoData} from './demo-model';
import type {Member} from './membership';
export const guestMember:Member={id:'alejandro',email:'',name:'Invitado',agency:'Recorrido de ejemplo',phone:'',role:'advisor',status:'Pendiente',createdAt:'2026-10-07T00:00:00.000Z',updatedAt:'2026-10-07T00:00:00.000Z'};

// This public showcase is independent of member data and contains no contacts,
// uploaded photos, exact addresses, invitations or private collaboration records.
export function guestDemo():DemoData {
 const data=seedDemo();
 data.profiles=profiles.map(p=>({...p,email:'',active:true}));
 data.properties=data.properties.map((p,i)=>({...p,image:['/demo-photos/garden.jpg','/demo-photos/residence.jpg','/demo-photos/interior.jpg'][i%3],photos:[['/demo-photos/garden.jpg','/demo-photos/residence.jpg','/demo-photos/interior.jpg'][i%3]],direct:i!==1,confirmed:i===5?'Por reconfirmar':'Ejemplo',description:'Ficha ilustrativa del recorrido de invitado. '+p.description}));
 data.requirements=data.requirements.map(r=>({...r,ownerId:'alejandro',createdAt:'2026-10-07T01:00:00.000Z',updatedAt:'2026-10-07T01:00:00.000Z',history:[{at:'2026-10-07T01:00:00.000Z',text:'Búsqueda de ejemplo registrada',criteria:r.zones}]}));
 data.requirements.push({id:'REQ-GUEST-WAIT',ownerId:'alejandro',reference:'Casa con jardín · El Molino',operation:'Venta',type:'Casa',zones:['El Molino'],budget:5500000,beds:3,parking:2,garden:true,status:'Activo',flexBudget:false,alerts:true,createdAt:'2026-10-07T01:00:00.000Z',history:[{at:'2026-10-07T01:00:00.000Z',text:'Búsqueda de ejemplo en espera',criteria:['El Molino','Casa','Con jardín']} ]});
 data.collaborations=[{...data.collaborations[0],senderId:'alejandro',recipientId:'mariana',propertyId:'RCI-001',direction:'Enviada',colleague:'Mariana López',status:'Aceptada',requirementId:'REQ-01',message:'Tengo un cliente que busca una casa con jardín. ¿Coordinamos una visita?',acceptedAt:'7 oct · ejemplo',events:[{actorId:'alejandro',text:'Solicitó colaboración sobre la casa en Mayorazgo.',at:'2026-10-07T01:00:00.000Z'},{actorId:'mariana',text:'Aceptó las condiciones de colaboración.',at:'2026-10-07T01:15:00.000Z'}],priceSnapshot:6400000,commissionSnapshot:1.5,operationSnapshot:'Venta',conditionsSnapshot:conditions(data.properties[0])}];
 data.notifications=[{kind:'collaboration',id:'GUEST-NOTICE-1',actorId:'alejandro',collaborationId:data.collaborations[0].id,propertyId:'RCI-001',propertyTitle:'Casa con jardín en Mayorazgo',title:'Colaboración aceptada',message:'Ejemplo: Mariana aceptó las condiciones para coordinar la visita.',status:'Aceptada',createdAt:'2026-10-07T01:15:00.000Z'},{id:'GUEST-NOTICE-2',actorId:'alejandro',requirementId:'REQ-01',propertyId:'RCI-001',propertyTitle:'Casa con jardín en Mayorazgo',requirementReference:'Familia · zona norte',reasons:['Casa','Mayorazgo','Con jardín'],createdAt:'2026-10-07T01:10:00.000Z'}];
 return data;
}
