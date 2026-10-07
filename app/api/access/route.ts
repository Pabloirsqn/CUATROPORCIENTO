import {accessFor,requestIdentity,mutateAccess} from '@/db/access-storage';
import {applyRegistration,memberFor,AccessError} from '@/lib/membership';
import {privateHeaders,apiError,jsonInput,checkSameOrigin} from '@/lib/api-errors';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return Response.json(await accessFor(requestIdentity(request)),{headers:privateHeaders})}catch(e){return apiError(e)}}
export async function POST(request:Request){try{checkSameOrigin(request);const user=requestIdentity(request);if(!user)throw new AccessError('Inicia sesión para registrar tu solicitud.',401);const input=await jsonInput(request);await accessFor(user);const data=await mutateAccess(d=>applyRegistration(d,user,input));return Response.json({user,member:memberFor(data,user)},{headers:privateHeaders})}catch(e){return apiError(e)}}
