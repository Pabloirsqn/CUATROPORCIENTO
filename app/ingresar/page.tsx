import {requireChatGPTUser} from '../chatgpt-auth';
import {accessFor} from '@/db/access-storage';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page(){const user=await requireChatGPTUser('/ingresar');const {member}=await accessFor(user);redirect(member?.status==='Activo'?'/inventario':'/registro');}
