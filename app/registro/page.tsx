import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import {accessFor} from '@/db/access-storage';
import {Registration} from '@/components/registration';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{codigo?:string}>}){const params=await searchParams;return <Form code={typeof params.codigo==='string'?params.codigo.slice(0,80):''}/>;}
async function Form({code}:{code:string}){const user=await getChatGPTUser();const {member}=await accessFor(user);const path='/registro'+(code?'?codigo='+encodeURIComponent(code):'');return <Registration user={user} initialMember={member} code={code} signInHref={chatGPTSignInPath(path)}/>;}
