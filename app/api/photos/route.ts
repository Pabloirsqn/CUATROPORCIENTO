import {requireMember,authorizeActor} from '@/db/access-storage';
import {AccessError} from '@/lib/membership';
import {checkSameOrigin} from '@/lib/api-errors';
import {bindings} from '@/db/demo-storage';
export const dynamic='force-dynamic';
const maxBytes=8*1024*1024;
export function sniffImage(bytes:Uint8Array){
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
 return null;
}
export async function POST(request:Request){
 try{
  checkSameOrigin(request);const member=await requireMember(request);const actorId=request.headers.get('x-demo-profile')||member.id;authorizeActor(member,actorId);
  if(Number(request.headers.get('content-length')||0)>maxBytes+16384)return Response.json({error:'La imagen excede 8 MB.'},{status:413});
  const form=await request.formData();const file=form.get('photo');
  if(!(file instanceof File)||file.size===0||file.size>maxBytes)return Response.json({error:'Selecciona una imagen de hasta 8 MB.'},{status:400});
  const bytes=await file.arrayBuffer();const contentType=sniffImage(new Uint8Array(bytes));if(!contentType)return Response.json({error:'Usa fotografías JPG, PNG o WebP.'},{status:415});
  const {db,bucket}=bindings();const id=crypto.randomUUID(),key='property-photos/'+id;
  await bucket.put(key,bytes,{httpMetadata:{contentType}});
  try{await db.prepare('INSERT INTO photo_uploads (id, actor_id, object_key, content_type, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id,actorId,key,contentType,file.size,new Date().toISOString()).run()}catch(error){await bucket.delete(key);throw error;}
  return Response.json({id,url:'/api/photos/'+id,contentType,bytes:file.size},{headers:{'Cache-Control':'no-store'}});
 }catch(error){if(error instanceof AccessError)return Response.json({error:error.message},{status:error.status});console.error('Photo upload failed',error);return Response.json({error:'No se pudo guardar la fotografía. Tu selección sigue disponible para reintentar.'},{status:503})}
}
