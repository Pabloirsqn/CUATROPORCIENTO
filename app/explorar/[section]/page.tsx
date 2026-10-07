import {chatGPTSignInPath} from '../../chatgpt-auth';
import {notFound} from 'next/navigation';
import {DemoProvider} from '@/components/platform-data';
import Platform from '@/components/platform';
import {guestDemo,guestMember} from '@/lib/guest-demo';
export default async function GuestSection({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!['inventario','solicitudes','alertas','colaboraciones','red','niveles'].includes(section))notFound();return <DemoProvider member={guestMember} guest initialData={guestDemo()}><Platform guestSignInHref={chatGPTSignInPath('/explorar/'+section+'?unirme=1')}/></DemoProvider>}
