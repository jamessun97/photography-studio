import { cloudClient, cloudConfigured, json, sameOrigin, smallBody } from '@/lib/cloud';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!cloudConfigured()) return json({ configured: false, user: null });
  try {
    const client = await cloudClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error && error.status && error.status >= 500) return json({ error: '登录服务暂时不可用，请重试。' }, 503);
    return json({ configured: true, user: user ? { id: user.id, name: user.user_metadata?.username || '学习者' } : null });
  } catch { return json({ error: '无法检查登录状态，请重试。' }, 503); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: '请求来源无效。' }, 403);
  if (!cloudConfigured()) return json({ error: '云端账号尚未配置，原浏览器档案仍保留。' }, 503);
  try {
    const body = await smallBody(request, 4096); const client = await cloudClient();
    if (!body || typeof body !== 'object') return json({ error: '输入格式不正确。' }, 400);
    if (body.action === 'logout') {
      const { error } = await client.auth.signOut({ scope: 'local' });
      return error ? json({ error: '退出失败，请重试。' }, 503) : json({ ok: true });
    }
    if (body.action === 'password') {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return json({ error: '请重新登录或重新打开找回密码链接。' }, 401);
      if (typeof body.password !== 'string' || body.password.length < 6 || body.password.length > 128) return json({ error: '请输入6–128位密码。' }, 400);
      const { error } = await client.auth.updateUser({ password: body.password });
      return error ? json({ error: '密码未更新，请按身份服务的密码要求重试。' }, 400) : json({ ok: true });
    }
    if (typeof body.identifier !== 'string' || body.identifier.length > 254) return json({ error: '请输入账号或邮箱。' }, 400);
    const identifier = body.identifier.trim().toLowerCase();
    const email = identifier === process.env.STUDY_USERNAME?.toLowerCase() ? process.env.STUDY_EMAIL : identifier;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: '账号或密码不正确。' }, 400);
    if (body.action === 'recover') {
      const origin = process.env.STUDY_APP_URL;
      if (!origin) return json({ error: '找回密码功能尚未配置。' }, 503);
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${origin.replace(/\/$/, '')}/auth/confirm` });
      if (error) return json({ error: '请求暂未完成，请稍后重试。' }, error.status === 429 ? 429 : 503);
      return json({ ok: true, message: '如果邮箱对应有效账号，你会收到找回密码邮件。请在当前浏览器打开邮件链接。' });
    }
    if (body.action !== 'login' || typeof body.password !== 'string' || !body.password || body.password.length > 128) return json({ error: '请输入账号和密码。' }, 400);
    const { error } = await client.auth.signInWithPassword({ email, password: body.password });
    if (error) return json({ error: error.status === 429 ? '尝试过于频繁，请稍后再试。' : '账号或密码不正确，或登录服务暂不可用。' }, error.status === 429 ? 429 : 401);
    return json({ ok: true });
  } catch (error) {
    const invalid = error instanceof SyntaxError || (error instanceof Error && ['BODY_TOO_LARGE','INVALID_BODY'].includes(error.message));
    return json({ error: invalid ? '输入格式或长度不正确。' : '账号服务暂时不可用，请重试。' }, invalid ? 400 : 503);
  }
}
