import { cloudClient, cloudConfigured, json, sameOrigin, smallBody } from '@/lib/cloud';
import { emptyState, validState } from '../../state';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!cloudConfigured()) return json({ error: '云端档案尚未配置。' }, 503);
  try {
    const client = await cloudClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return json({ error: '登录已过期，请先导出草稿，再重新登录。' }, 401);
    const { data, error } = await client.from('study_states').select('data,revision').eq('user_id', user.id).maybeSingle();
    if (error) return json({ error: '档案暂时无法读取，请重试。' }, 503);
    if (data && !validState(data.data)) return json({ error: '云端档案格式异常，请保留本机备份。' }, 500);
    return json({ userId: user.id, state: data?.data ?? emptyState, revision: data?.revision ?? 0 });
  } catch { return json({ error: '档案暂时无法读取，请重试。' }, 503); }
}
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return json({ error: '请求来源无效。' }, 403);
  if (!cloudConfigured()) return json({ error: '云端档案尚未配置。' }, 503);
  try {
    const client = await cloudClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return json({ error: '登录已过期，请先导出草稿，再重新登录。' }, 401);
    const payload = await smallBody(request, 1000000);
    if (!payload || typeof payload !== 'object') return json({ error: '档案格式无效。' }, 400);
    const { state, revision } = payload;
    if (payload.userId !== user.id) return json({ error: '账号已变化，请导出草稿后重新登录。' }, 409);
    if (!validState(state) || !Number.isSafeInteger(revision) || revision < 0) return json({ error: '请检查日期、用时与必填内容；已复盘需有作品位置和复盘说明。' }, 400);
    const { data, error } = await client.rpc('save_study_state', { input_state: state, expected_revision: revision });
    if (error?.code === '40001') return json({ error: '另一设备已更新档案。请先导出本页草稿，再重新载入比较，避免覆盖。' }, 409);
    if (error || !data?.[0]) return json({ error: '保存未完成，输入仍在本页，请重试。' }, 503);
    return json({ userId: user.id, revision: data[0].revision });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'BODY_TOO_LARGE') return json({ error: '档案超过1MB，请先导出备份并整理。' }, 413);
    if (error instanceof SyntaxError || message === 'INVALID_BODY') return json({ error: '档案格式无效。' }, 400);
    return json({ error: '保存暂时失败，你的输入仍保留在本页。' }, 503);
  }
}
