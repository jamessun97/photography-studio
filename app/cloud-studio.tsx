'use client';
import { useEffect, useRef, useState } from 'react';
import Studio from './studio';
type User = { id: string; name: string };
export default function CloudStudio({ configured }: { configured: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!configured);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function session() {
    try {
      const response = await fetch('/api/account', { cache: 'no-store' });
      const body = await response.json() as { error?: string; user: User | null };
      if (!response.ok) throw new Error(body.error);
      setUser(body.user); setReady(true);
    } catch { setMessage('无法检查登录状态。请检查网络后重试。'); }
  }
  useEffect(() => {
    const account = new URLSearchParams(location.search).get('account');
    if (account === 'password') setMode('password');
    if (account === 'expired') setMessage('链接已失效，请重新申请找回密码邮件。');
    if (configured) void session();
  }, [configured]);
  async function submit(action: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, identifier, password: action === 'login' || action === 'password' ? password : undefined }) });
      const body = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error);
      setPassword('');
      if (action === 'recover') setMessage(body.message || '请检查邮箱。');
      else if (action === 'password') { setMode('login'); setMessage('密码已更新。'); history.replaceState(null, '', '/'); }
      else if (action === 'logout') { setUser(null); setMode('login'); }
      else await session();
    } catch (error) { setMessage(error instanceof Error ? error.message : '操作失败，请重试。'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (!configured) return <><div className="account-banner" role="status">云端同步尚未启用。当前记录仍保存在此浏览器，可导出备份。</div><Studio signedIn={false} localMode/></>;
  if (!ready) return <main className="account-screen"><div className="account-card account-loading"><p className="eyebrow">观照 · 摄影研习室</p><span className="account-orbit" aria-hidden="true"/><h1>正在连接学习档案</h1><p role="status">{message || '正在检查登录状态…'}</p>{message && <button className="action" onClick={() => void session()}>重试</button>}</div></main>;
  if (user && mode !== 'password') return <><div className="account-banner"><span>账号：{user.name} · 云端学习档案</span><button className="small-button" disabled={busy} onClick={() => { if (window.confirm('退出前请保存或导出未提交内容。现在退出此设备吗？')) void submit('logout'); }}>退出登录</button><span role="status">{message}</span></div><Studio key={user.id} signedIn userId={user.id}/></>;
  const isLogin = mode === 'login';
  const title = mode === 'password' ? '设置新密码' : mode === 'recover' ? '找回密码' : '继续你的创作';
  const intro = mode === 'password' ? '设置后，请回到登录页继续学习。' : mode === 'recover' ? '输入账号或邮箱，我们会把重设链接发到你的找回邮箱。' : '登录同一账号，在手机和电脑之间延续你的学习档案。';
  return <main className="account-screen"><div className="account-wordmark"><span className="account-mark" aria-hidden="true">◒</span><span>观照</span><i>摄影研习室</i></div><div className="account-layout"><section className="account-intro"><p className="eyebrow">你的摄影学习档案</p><h1>让每一次观看，<em>留下痕迹。</em></h1><p>练习、选片和复盘会跟随账号保存。换一台设备，也能从上一次的判断继续。</p><div className="account-stats" aria-label="学习档案功能"><span><b>24</b>周创作路线</span><span><b>∞</b>设备间续学</span></div></section><section className="account-card"><p className="eyebrow">{isLogin ? '欢迎回来' : '学习档案'}</p><h2>{title}</h2><p className="account-description">{intro}</p><form onSubmit={e => { e.preventDefault(); void submit(mode); }}>
    {mode !== 'password' && <label className="field">账号或邮箱<input autoComplete="username" required maxLength={254} placeholder="输入账号或邮箱" value={identifier} onChange={e => setIdentifier(e.target.value)}/></label>}
    {mode !== 'recover' && <label className="field">{mode === 'password' ? '新密码' : '密码'}<input type="password" autoComplete={mode === 'password' ? 'new-password' : 'current-password'} required minLength={mode === 'password' ? 6 : 1} maxLength={128} placeholder={mode === 'password' ? '至少 6 个字符' : '输入密码'} value={password} onChange={e => setPassword(e.target.value)}/></label>}
    <button className="action account-submit" disabled={busy}>{busy ? '正在处理…' : mode === 'recover' ? '发送找回邮件' : mode === 'password' ? '保存新密码' : '进入研习室 →'}</button>
    <p className="account-message" role="status" aria-live="polite">{message}</p>
  </form><button className="account-link" disabled={busy} onClick={() => { setMode(isLogin ? 'recover' : 'login'); setPassword(''); setMessage(''); }}>{isLogin ? '忘记密码？' : '返回登录'}</button><p className="muted account-note">首次登录后可以预览并迁入此浏览器的旧记录。照片原片仍由自己的图库保管。</p></section></div></main>;
}
