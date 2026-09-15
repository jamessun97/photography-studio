import { validState, type StudyState } from './state';
export const LEGACY_KEY = 'photography-studio-progress-v1';
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => JSON.stringify(k)+':'+canonical(v)).join(',') + '}';
  return JSON.stringify(value);
}
export function importedState(value: unknown): StudyState {
  const candidate = value && typeof value === 'object' && 'state' in value ? value.state : value;
  if (!validState(candidate)) throw new Error('这不是有效的摄影学习档案。');
  return candidate;
}
export function mergeStudy(remote: StudyState, incoming: StudyState, revision: number, makeId: () => string = () => crypto.randomUUID()): StudyState {
  if (revision === 0) return structuredClone(incoming);
  const ids = new Set([...remote.records, ...remote.projects, ...incoming.records, ...incoming.projects].map(x => x.id));
  const fresh = () => { let id = makeId(); while (ids.has(id)) id = makeId(); ids.add(id); return id; };
  function merge<T extends { id: string; title: string }>(old: T[], added: T[]): T[] {
    const result = [...old];
    for (const entry of added) {
      const existing = result.find(x => x.id === entry.id);
      if (existing && canonical(existing) === canonical(entry)) continue;
      if (result.some(x => x.title === (entry.title + '（导入副本）').slice(0,200) && canonical({ ...x, id: entry.id, title: entry.title }) === canonical(entry))) continue;
      const collision = [...remote.records, ...remote.projects].some(x => x.id === entry.id);
      result.push(collision ? { ...entry, id: fresh(), title: (entry.title + '（导入副本）').slice(0,200) } : entry);
    }
    return result;
  }
  const result: StudyState = { ...remote, records: merge(remote.records, incoming.records), projects: merge(remote.projects, incoming.projects) };
  if (incoming.learning || remote.learning) result.learning = { cards: { ...incoming.learning?.cards, ...remote.learning?.cards }, decisions: { ...incoming.learning?.decisions, ...remote.learning?.decisions } };
  if (!validState(result)) throw new Error('合并后的记录超过容量或格式限制，请先导出两份档案。');
  return result;
}
