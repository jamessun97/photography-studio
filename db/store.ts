type D1Env = { DB?: D1Database };

export async function database() {
 const load = new Function('return import("cloudflare:workers")') as () => Promise<{env:D1Env}>;
 const {env}=await load();
 if(!env.DB)throw new Error('学习档案暂时不可用');
 return env.DB;
}
