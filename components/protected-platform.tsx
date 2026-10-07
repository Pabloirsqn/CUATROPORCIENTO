import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {accessFor} from '@/db/access-storage';
import {Registration} from './registration';
import {DemoProvider} from './platform-data';
import Platform from './platform';
export async function ProtectedPlatform({adminOnly=false}:{adminOnly?:boolean}={}){const user=await getChatGPTUser();try{const {member}=await accessFor(user);if(!member||member.status!=='Activo')return <Registration user={user} initialMember={member} signInHref={chatGPTSignInPath('/ingresar')}/>;if(adminOnly&&member.role!=='admin')return <main className="registration-page"><h1>Este panel es para administradores.</h1><a className="btn" href="/inventario">Volver al inventario</a></main>;return <DemoProvider member={member}><Platform/></DemoProvider>}catch(error){console.error('Access unavailable',error);return <main className="registration-page"><h1>No pudimos consultar tu acceso.</h1><p>Tu registro se conserva. Vuelve a intentar en unos momentos.</p><a className="btn" href="/ingresar">Reintentar</a></main>}}
