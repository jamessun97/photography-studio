export type Practice = { lessonId?:number; syllabusVersion?:string; id:string; module:number; date:string; hours:number; title:string; intention:string; evidence:string; reflection:string; feedback:string; next:string; status:string };
export type Project = {id:string;title:string;question:string;sequence:string;feedback:string;next:string};
export type StudyState = {week:number; equipment:string; records:Practice[]; projects:Project[]};
export const emptyState:StudyState = {week:1,equipment:'手机；计划购买单反，型号待定',records:[],projects:[]};
const string = (x:unknown,max=6000):x is string => typeof x==='string' && x.length<=max;
const object = (x:unknown):x is Record<string,unknown>=>!!x && typeof x==='object' && !Array.isArray(x);
export function validState(s:unknown):s is StudyState {
 if(!object(s)||!Number.isInteger(s.week)||Number(s.week)<1||Number(s.week)>24||!string(s.equipment,200)||!Array.isArray(s.records)||s.records.length>1000||!Array.isArray(s.projects)||s.projects.length>100) return false;
 const ids=new Set<string>();
 for(const r of s.records){ if(!object(r))return false;if(r.lessonId!==undefined&&(!Number.isInteger(r.lessonId)||Number(r.lessonId)<1||Number(r.lessonId)>24))return false;if(r.syllabusVersion!==undefined&&r.syllabusVersion!=='2026-v2')return false; if(!object(r)||!string(r.id,100)||!r.id||ids.has(r.id)||!Number.isInteger(r.module)||Number(r.module)<1||Number(r.module)>12||!string(r.date,10)||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date||typeof r.hours!=='number'||!Number.isFinite(r.hours)||r.hours<0||r.hours>24||!string(r.title,200)||!r.title.trim()||!['待点评','待重拍','已复盘'].includes(String(r.status))||!['intention','evidence','reflection','feedback','next'].every(k=>string(r[k]))) return false; if(r.status==='已复盘'&&(!String(r.evidence).trim()||!String(r.reflection).trim()))return false; ids.add(r.id); }
 for(const p of s.projects){if(!object(p)||!string(p.id,100)||!p.id||ids.has(p.id)||!string(p.title,200)||!p.title.trim()||!['question','sequence','feedback','next'].every(k=>string(p[k])))return false;ids.add(p.id);}
 return true;
}
