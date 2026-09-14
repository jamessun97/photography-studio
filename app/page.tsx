import Studio from './studio';
import { getChatGPTUser } from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){
 const localMode=process.env.VERCEL==='1';
 const user=localMode?null:await getChatGPTUser();
 return <Studio signedIn={!!user} localMode={localMode}/>;
}
