import {ProtectedPlatform} from '@/components/protected-platform';
export const dynamic='force-dynamic';
export default async function Page(){return <ProtectedPlatform adminOnly/>;}
