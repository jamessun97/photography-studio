import { env } from 'cloudflare:workers';
export function database() { if(!env.DB)throw new Error('学习档案暂时不可用');return env.DB; }
