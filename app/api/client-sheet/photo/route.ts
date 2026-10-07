import {requireMember} from '@/db/access-storage';
import {AccessError} from '@/lib/membership';
import {readDemo} from '@/db/demo-storage';
import {sampleImages} from '@/lib/real-estate';
import {propertyPhotoUrls,propertyPhotoSource} from '@/lib/client-sheet';
export const dynamic='force-dynamic';

// Keep downloads working for clients that still have the previous script.
// Known starter photos now live in the Site's static assets, eliminating the
// external Worker fetch that failed in production.
export async function GET(request:Request){
 try{
  await requireMember(request);
  const params=new URL(request.url).searchParams;
  const rawIndex=params.get('index');
  if(!rawIndex||!/^\d$/.test(rawIndex))return new Response('Fotografía no válida.',{status:400});
  const p=(await readDemo()).properties.find(p=>p.id===params.get('propertyId'));
  const source=p&&propertyPhotoUrls(p)[Number(rawIndex)];
  if(!source||!sampleImages.includes(source))return new Response('Fotografía no encontrada.',{status:404});
  return new Response(null,{status:307,headers:{Location:propertyPhotoSource(source),'Cache-Control':'private, max-age=300'}});
 }catch(error){if(error instanceof AccessError)return new Response('Acceso no autorizado',{status:error.status});console.error('Client sheet photo resolution failed',error);return new Response('No se pudo cargar la fotografía. Intenta de nuevo.',{status:503})}
}
