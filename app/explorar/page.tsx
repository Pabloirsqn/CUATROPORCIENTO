import {chatGPTSignInPath} from '../chatgpt-auth';
import {DemoProvider} from '@/components/platform-data';
import Platform from '@/components/platform';
import {guestDemo,guestMember} from '@/lib/guest-demo';
export default function GuestPage(){return <DemoProvider member={guestMember} guest initialData={guestDemo()}><Platform guestSignInHref={chatGPTSignInPath('/explorar?unirme=1')}/></DemoProvider>}
