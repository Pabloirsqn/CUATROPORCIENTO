import {requireMember,authorizeActor} from '@/db/access-storage';
import {AccessError,type Member} from '@/lib/membership';
import {checkSameOrigin} from '@/lib/api-errors';
import type {DemoData} from '@/lib/demo-model';
import {readDemo,mutateDemo} from '@/db/demo-storage';
import {ZodError} from 'zod';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
function visible(data:DemoData,member:Member){data={...data,properties:data.properties.map(p=>data.profiles?.some(a=>a.id===p.ownerId&&a.active===false)&&p.status==='Disponible'?{...p,status:'Retirado' as const}:p)};if(member.role==='admin')return data;return {...data,requirements:data.requirements.filter(r=>r.ownerId===member.id),collaborations:data.collaborations.filter(c=>c.senderId===member.id||c.recipientId===member.id),notifications:(data.notifications||[]).filter(n=>n.actorId===member.id),saved:{[member.id]:data.saved[member.id]||[]},reports:data.reports.filter(r=>r.actorId===member.id)};}
export async function GET(request:Request){try{const member=await requireMember(request);return Response.json(visible(await readDemo(),member),{headers})}catch(error){if(error instanceof AccessError)return Response.json({error:error.message},{status:error.status,headers});console.error('Demo read failed',error);return Response.json({error:'No pudimos cargar la demo. Vuelve a intentar.'},{status:503,headers})}}
export async function POST(request:Request){
 if(!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Formato de solicitud no válido.'},{status:415,headers});
 try{checkSameOrigin(request);const member=await requireMember(request);const body=await request.text();if(body.length>120000)return Response.json({error:'La solicitud es demasiado grande.'},{status:413,headers});const input=JSON.parse(body);authorizeActor(member,input.actorId);return Response.json(visible(await mutateDemo(input),member),{headers});}
 catch(error){if(error instanceof AccessError)return Response.json({error:error.message},{status:error.status,headers});if(error instanceof ZodError)return Response.json({error:error.issues[0]?.message||'Revisa los datos.'},{status:400,headers});const message=error instanceof Error?error.message:'No se pudo guardar.';const domain=/superficie|terreno|fotografías|alerta|perfil|propiedad|propiedades|requerimiento|solicitud|fotografía|fotografías|respuesta|estado|operación|Escribe|Indica|portada|actualizó/i.test(message);if(!domain)console.error('Demo write failed',error);return Response.json({error:domain?message:'No pudimos guardar. Conservamos tu captura para que vuelvas a intentar.'},{status:domain?400:503,headers});}
}
