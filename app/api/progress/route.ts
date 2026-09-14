import { getChatGPTUser } from '../../chatgpt-auth';
import { database } from '../../../db/store';
import { emptyState, validState } from '../../state';
export const dynamic = 'force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return reply({error:'请先登录，再读取学习档案。'},401);
 try{const db=await database();const row=await db.prepare('SELECT data, revision FROM study_states WHERE user_id = ?').bind(user.userId).first<{data:string;revision:number}>();return reply(row?{state:JSON.parse(row.data),revision:row.revision}:{state:emptyState,revision:0});}catch{return reply({error:'档案暂时无法读取，请稍后重试。'},503);}
}
export async function PUT(request:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'请先登录，再保存学习档案。'},401);
 const origin=request.headers.get('origin');if(!origin || origin!==new URL(request.url).origin)return reply({error:'请求来源无效。'},403);
 try{
  const raw=await request.text();if(raw.length>1000000)return reply({error:'档案太大，请导出并分批整理。'},413);
  const {state,revision}=JSON.parse(raw);if(!validState(state)||!Number.isInteger(revision)||revision<0)return reply({error:'请检查日期、用时与必填内容；已复盘需有作品位置和复盘说明。'},400);
  const now=new Date().toISOString();
  const db=await database();
  const updated=revision===0
   ? await db.prepare('INSERT INTO study_states (user_id,data,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId,JSON.stringify(state),now).run()
   : await db.prepare('UPDATE study_states SET data=?, revision=revision+1, updated_at=? WHERE user_id=? AND revision=?').bind(JSON.stringify(state),now,user.userId,revision).run();
  if(!updated.meta.changes)return reply({error:'另一个页面已更新档案。请先导出当前草稿，再重新载入，避免覆盖。'},409);
  return reply({revision:revision+1});
 }catch(e){return reply({error:e instanceof SyntaxError?'记录格式无效。':'保存暂时失败，你的输入仍保留在本页。'},e instanceof SyntaxError?400:503);}
}
