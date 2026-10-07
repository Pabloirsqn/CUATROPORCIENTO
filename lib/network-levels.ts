import type {Property} from './real-estate';

export const networkLevels = [
 {level:0,min:0,max:4,name:'En formación',range:'0–4'},
 {level:1,min:5,max:9,name:'Inmobiliaria Asociada',range:'5–9'},
 {level:2,min:10,max:29,name:'Inmobiliaria Consolidada',range:'10–29'},
 {level:3,min:30,max:49,name:'Inmobiliaria Destacada',range:'30–49'},
 {level:4,min:50,max:59,name:'Inmobiliaria Líder',range:'50–59'},
 {level:5,min:60,max:Infinity,name:'Inmobiliaria Élite',range:'60+'},
] as const;

export function inventoryStats(ownerId:string,properties:Property[]) {
 const active=properties.filter(p=>p.ownerId===ownerId&&p.status==='Disponible');
 const direct=active.filter(p=>p.direct).length;
 const tier=networkLevels.find(t=>direct>=t.min&&direct<=t.max)!;
 const next=networkLevels[tier.level+1];
 return {active:active.length,direct,shared:active.length-direct,exclusive:active.filter(p=>p.exclusive).length,tier,next,remaining:next?next.min-direct:0,progress:next?Math.min(100,Math.round(direct/next.min*100)):100};
}
