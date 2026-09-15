'use client';
import { useEffect, useState } from 'react';
import { importedState, LEGACY_KEY, mergeStudy } from './sync-data';
import type { StudyState } from './state';
export default function ImportRecords({ data, revision, busy, save, userId }: { data: StudyState; revision: number; busy: boolean; save: (state: StudyState) => Promise<boolean>; userId: string }) {
  const [candidate, setCandidate] = useState<StudyState | null>(null);
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  const [legacy, setLegacy] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw && localStorage.getItem(`study-migrated:${userId}`) !== raw) { setCandidate(importedState(JSON.parse(raw))); setLegacy(true); }
    } catch { setNotice('检测旧记录时遇到问题；原数据未删除，可以选择导出的JSON文件。'); }
  }, [userId]);
  async function commit() {
    if (!candidate || working || busy) return;
    setWorking(true);
    try {
      const merged = mergeStudy(data, candidate, revision);
      if (await save(merged)) {
        if (legacy) { try { const raw = localStorage.getItem(LEGACY_KEY); if (raw) localStorage.setItem(`study-migrated:${userId}`, raw); } catch { /* Cloud readback is authoritative. */ } }
        setCandidate(null); setNotice('已导入并核对云端档案，原备份仍保留。');
      }
    } catch (error) { setNotice((error as Error).message); }
    finally { setWorking(false); }
  }
  return <details className="import-records" open={candidate ? true : undefined}><summary>迁入旧记录 / 导入备份</summary><p>选择本人的摄影档案。云端已有记录不会被空档案覆盖，同ID的不同内容保留为副本。已有周次、设备与相同复习卡以云端为准；备份中的未提交表单草稿不自动导入。</p><label className="field">选择学习档案 JSON<input type="file" accept=".json,application/json" disabled={busy || working} onChange={async e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; try { if (file.size > 1000000) throw new Error('请选择不超过1MB的档案。'); setCandidate(importedState(JSON.parse(await file.text()))); setLegacy(false); setNotice(''); } catch (error) { setNotice((error as Error).message); } }}/></label>{candidate && <><p>待迁入：第{candidate.week}课，{candidate.records.length}条练习，{candidate.projects.length}个项目；云端现有{data.records.length}条练习、{data.projects.length}个项目。</p><div className="button-row"><button className="small-button" disabled={busy || working} onClick={() => { setCandidate(null); setNotice('稍后可重新选择备份导入。'); }}>暂不导入</button><button className="action" disabled={busy || working} onClick={() => void commit()}>{working ? '正在迁入…' : '确认合并并同步'}</button></div></>}<p role="status">{notice}</p></details>;
}
