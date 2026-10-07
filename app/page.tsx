import {Landing} from '@/components/landing';
import {getChatGPTUser,chatGPTSignInPath} from './chatgpt-auth';
import {accessFor} from '@/db/access-storage';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();let member=null;try{member=(await accessFor(user)).member}catch(e){console.error('Landing access unavailable',e)}return <Landing member={member} user={user} signInHref={chatGPTSignInPath('/ingresar')} registerHref='/registro'/>;}
