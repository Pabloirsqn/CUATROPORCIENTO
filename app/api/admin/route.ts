import {readAccess,mutateAccess,requireAdmin} from '@/db/access-storage';
import {applyAdmin} from '@/lib/membership';
import {privateHeaders,apiError,jsonInput,checkSameOrigin} from '@/lib/api-errors';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{await requireAdmin(request);return Response.json(await readAccess(),{headers:privateHeaders})}catch(e){return apiError(e)}}
export async function POST(request:Request){try{checkSameOrigin(request);const actor=await requireAdmin(request);const input=await jsonInput(request);const data=await mutateAccess(d=>applyAdmin(d,actor,input));return Response.json(data,{headers:privateHeaders})}catch(e){return apiError(e)}}
