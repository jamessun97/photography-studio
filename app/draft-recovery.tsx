'use client';
import { useEffect, useRef, useState } from 'react';
import { validState, type StudyState, type Practice, type Project } from './state';
type Draft = { state: StudyState; practice: Practice; project: Project; revision: number };
function validDraft(value: unknown): value is Draft {
  if (!value || typeof value !== 'object') return false;
  const d = value as Draft;
  return Number.isSafeInteger(d.revision) && d.revision >= 0 && validState(d.state) && !!d.practice && !!d.project && validState({ ...d.state, records: [{ ...d.practice, id: 'draft-practice', title: d.practice.title || '未命名草稿' }], projects: [{ ...d.project, id: 'draft-project', title: d.project.title || '未命名草稿' }] });
}
export default function DraftRecovery({ userId, snapshot, dirty, restore }: { userId: string; snapshot: Draft; dirty: boolean; restore: (draft: Draft) => void }) {
  const key = `photography-draft:${userId}`;
  const [found, setFound] = useState<Draft | null>(null);
  const [notice, setNotice] = useState('');
  const initialized = useRef(false);
  const wrote = useRef(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) { const d: unknown = JSON.parse(raw); if (validDraft(d)) setFound(d); else setNotice('本机草稿格式异常，未自动覆盖。'); } }
    catch { setNotice('此浏览器无法读取草稿。请使用导出备份。'); }
    initialized.current = true;
  }, [key]);
  useEffect(() => {
    if (!initialized.current || found) return;
    try {
      if (dirty) { localStorage.setItem(key, JSON.stringify(snapshot)); wrote.current = true; setNotice('未提交内容已暂存本机；点击保存后同步云端。'); }
      else if (wrote.current) { localStorage.removeItem(key); wrote.current = false; setNotice(''); }
    } catch { setNotice('本机草稿未能暂存，请导出备份。'); }
  }, [snapshot, dirty, found, key]);
  function download() {
    if (!found) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, state: found.state, drafts: { practice: found.practice, project: found.project } }, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = '摄影未提交草稿.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="draft-status" role="status">{notice}{found && <><p>发现此账号的本机草稿。{found.revision !== snapshot.revision ? '云端版本已变化，请下载草稿对照，避免覆盖新记录。' : '可以恢复上次未提交的输入。'}</p><button className="small-button" onClick={download}>下载草稿备份</button> <button className="small-button" disabled={dirty || found.revision !== snapshot.revision} onClick={() => { restore(found); setFound(null); }}>恢复输入</button> <button className="small-button" onClick={() => { setFound(null); setNotice('原草稿保留在本机；新输入暂存后会替换它。'); }}>继续当前档案</button></>}</div>;
}
