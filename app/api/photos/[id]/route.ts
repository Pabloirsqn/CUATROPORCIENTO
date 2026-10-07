import {requireMember} from '@/db/access-storage';
import {AccessError} from '@/lib/membership';
import {bindings} from '@/db/demo-storage';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{await requireMember(_request);const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('No encontrada',{status:404});const {db,bucket}=bindings();const row=await db.prepare('SELECT object_key, content_type FROM photo_uploads WHERE id = ?').bind(id).first<{object_key:string;content_type:string}>();if(!row)return new Response('No encontrada',{status:404});const object=await bucket.get(row.object_key);if(!object)return new Response('No encontrada',{status:404});return new Response(object.body,{headers:{'Content-Type':row.content_type,'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=86400','Content-Disposition':'inline'}})}catch(error){if(error instanceof AccessError)return new Response('Acceso no autorizado',{status:error.status});console.error('Photo load failed',error);return new Response('Fotografía temporalmente no disponible',{status:503})}
}
