/** @name 内部事项提醒 */
import React, { useEffect, useRef, useState } from 'react';
import { AdminShell, AdminPageCard, AdminQueryBar, AdminButton, AdminListActionBar, AdminDataTable, AdminPagination, AdminDrawer, AdminDatePicker, AdminStatusTag, AdminToastViewport, type AdminTableColumn, type AdminToast } from './admin-template';
import { beijing, editable, processDue, seed, storageKey, validate, type Reminder, type Status } from './reminder-model';
import { MergedPage } from './merged-pages';
import './style.css';
const statuses: Status[] = ['待发送','已发送'];
const tones = { 待发送: 'orange', 已发送: 'green' } as const;
const empty = { title: '', body: '', emails: '', date: '' };
type FieldErrors = Partial<Record<keyof typeof empty, string>>;
const initial = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return seed();
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) throw new Error('invalid');
    const rows = saved.filter(r => r && !['发送失败','已取消'].includes(r.status));
    if (!Array.isArray(rows) || !rows.every(r => typeof r.id === 'string' && typeof r.title === 'string' && typeof r.body === 'string' && Array.isArray(r.emails) && r.emails.every((e: unknown) => typeof e === 'string') && typeof r.date === 'string' && Number.isFinite(Date.parse(r.date + 'T09:00:00+08:00')) && statuses.includes(r.status) && typeof r.createdAt === 'string')) throw new Error('invalid');
    return rows.map(r => ({ ...r, operator: typeof r.operator === 'string' ? r.operator : '演示管理员' })) as Reminder[];
  } catch { return seed(); }
};
export default function ReminderPage() {
  const [rows, setRows] = useState<Reminder[]>(initial), ref = useRef(rows);
  const [catalog, setCatalog] = useState(['4399','platform']);
  const [query, setQuery] = useState({ title: '' }), [applied, setApplied] = useState(query);
  const [composing, setComposing] = useState(false);
  const [range, setRange] = useState<[string,string]>(), [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1), [size, setSize] = useState(20);
  const [panel, setPanel] = useState<{ kind: '新增提醒' | '编辑' | '删除'; id?: string }>();
  const [draft, setDraft] = useState(empty), [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toasts, setToasts] = useState<AdminToast[]>([]), [now, setNow] = useState(Date.now());
  const lock = useRef(false);
  const toast = (message: string, tone: 'success' | 'error') => setToasts(v => [...v, { id: crypto.randomUUID(), message, tone }]);
  const commit = (next: Reminder[]) => { localStorage.setItem(storageKey, JSON.stringify(next)); ref.current = next; setRows(next); };
  useEffect(() => { if (composing) return; const timer = setTimeout(() => { setApplied(query); setPage(1); }, 300); return () => clearTimeout(timer); }, [query, composing]);
  useEffect(() => {
    const tick = () => { const time = Date.now(); setNow(time); const next = processDue(ref.current, time); if (next.some((r,i) => r !== ref.current[i])) { try { commit(next); } catch { toast('本地保存失败，请检查浏览器存储权限', 'error'); } } };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, []);

  const filtered = rows.filter(r => r.title.toLowerCase().includes(applied.title.trim().toLowerCase()) && (!status || r.status === status) && (!range || r.date >= range[0] && r.date <= range[1]));
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / size)));
  const open = (kind: '新增提醒' | '编辑' | '删除', row?: Reminder) => { setFieldErrors({}); setDraft(row ? { title: row.title, body: row.body, emails: row.emails.join('\n'), date: row.date } : empty); setPanel({ kind, id: row?.id }); };
  const updateDraft = (key: keyof typeof empty, value: string) => { setDraft(current => ({ ...current, [key]: value })); setFieldErrors(current => ({ ...current, [key]: undefined })); };
  const save = () => {
    if (!panel || lock.current) return; lock.current = true;
    if (panel.kind !== '删除') {
      const missing: FieldErrors = {
        title: draft.title.trim() ? undefined : '邮件标题不能为空',
        body: draft.body.trim() ? undefined : '邮件正文不能为空',
        emails: draft.emails.trim() ? undefined : '收件邮箱不能为空',
        date: draft.date ? undefined : '提醒日期不能为空',
      };
      if (Object.values(missing).some(Boolean)) {
        setFieldErrors(missing);
        toast('请完善信息', 'error');
        lock.current = false;
        return;
      }
    }
    try {
      const current = ref.current, existing = current.find(r => r.id === panel.id);
      if (panel.kind !== '新增提醒' && (!existing || !editable(existing))) throw new Error('该提醒已到发送时间或状态已变更，不能继续操作');
      if (panel.kind === '删除') {
        commit(current.filter(r => r.id !== panel.id));
      } else {
        const emails = validate(draft.title, draft.body, draft.emails, draft.date);
        const values = { title: draft.title.trim(), body: draft.body.trim(), emails, date: draft.date, operator: '演示管理员' };
        commit(panel.kind === '新增提醒' ? [{ ...values, id: crypto.randomUUID(), status: '待发送', createdAt: beijing(Date.now()) }, ...current] : current.map(r => r.id === panel.id ? { ...r, ...values } : r));
      }
      toast(panel.kind === '删除' ? '删除成功' : '保存成功', 'success'); setPanel(undefined);
      if (panel.kind === '新增提醒') { setQuery({ title: '' }); setApplied({ title: '' }); setRange(undefined); setStatus(undefined); setPage(1); }
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败，请重试';
      if (message.includes('邮箱')) setFieldErrors(current => ({ ...current, emails: message }));
      if (message.includes('日期') || message.includes('提醒时间')) setFieldErrors(current => ({ ...current, date: message }));
      toast(message === '请完善所有信息' ? '请完善信息' : message, 'error');
    } finally { lock.current = false; }
  };
  const columns: AdminTableColumn<Reminder>[] = [
    { key: 'title', title: '提醒标题', render: r => <span className="reminder-title" title={r.title}>{r.title}</span> },
    { key: 'date', title: '提醒时间', width: 190, render: r => r.date + ' 09:00' },
    { key: 'status', title: '状态', width: 140, enumFilter: { value: status, options: statuses.map(value => ({ value, label: value })), onChange: v => { setStatus(v); setPage(1); } }, render: r => <AdminStatusTag tone={tones[r.status]}>{r.status}</AdminStatusTag> },
    { key: 'created', title: '创建时间', width: 190, dataIndex: 'createdAt' },
    { key: 'operator', title: '操作人', width: 120, dataIndex: 'operator' },
    { key: 'actions', title: '操作', width: 210, render: r => <div className="reminder-actions">{editable(r, now) ? <><AdminButton variant="text" onClick={() => open('编辑', r)}>编辑</AdminButton><AdminButton variant="text" onClick={() => open('删除', r)}>删除</AdminButton></> : <span>-</span>}</div> },
  ];
  const form = panel?.kind === '新增提醒' || panel?.kind === '编辑';
  return <>
    <AdminShell catalogOptions={[
      { value: '4399', label: '四三九九', children: [{ value: 'platform', label: '平台管理' }, { value: 'game', label: '游戏管理' }] },
      { value: 'business', label: '业务中台', children: [{ value: 'finance', label: '财务中心' }] },
    ]} catalogPath={catalog} onCatalogPathChange={setCatalog} menuTree={[
      { id: 'auxiliary', label: '辅助功能管理', children: [{ id: 'reminders', label: '内部事项提醒', route: 'auxiliary/reminders' }] },
      { id: 'finance', label: '财务配置', children: [{ id: 'withdrawal-whitelist', label: '提现白名单设置', route: 'finance/withdrawal-whitelist' }, { id: 'withdrawal-rules', label: '不可提现判断条件', route: 'finance/withdrawal-rules' }] },
      { id: 'game', label: '游戏管理', children: [{ id: 'compliance', label: '合规化管理', children: [{ id: 'contracts', label: '合同管理', route: 'game/compliance/contracts' }] }] },
    ]} defaultRoute="auxiliary/reminders" userLabel="演示管理员" renderPage={route => route !== 'auxiliary/reminders' ? <MergedPage route={route} onCatalogChange={setCatalog} /> : <AdminPageCard layout="list">
      <AdminQueryBar>
        <input className="admin-control reminder-query" aria-label="提醒标题" placeholder="提醒标题" value={query.title} onChange={e => setQuery(v => ({ ...v, title: e.target.value }))} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} />
        <AdminDatePicker type="daterange" value={range} startPlaceholder="提醒开始日期" endPlaceholder="提醒结束日期" clearable onChange={v => { setRange(Array.isArray(v) ? v : undefined); setPage(1); }} />
      </AdminQueryBar>
      <AdminListActionBar actions={<AdminButton variant="primary" onClick={() => open('新增提醒')}>新增提醒</AdminButton>} />
      <AdminDataTable columns={columns} rows={filtered.slice((safePage - 1) * size, safePage * size)} rowKey={r => r.id} />
      <AdminPagination page={safePage} pageSize={size} total={filtered.length} onPageChange={setPage} onPageSizeChange={v => { setSize(v); setPage(1); }} />
    </AdminPageCard>} />
    <AdminDrawer open={!!panel} title={panel?.kind} size="small" onClose={() => setPanel(undefined)} footer={<><AdminButton variant="secondary" onClick={() => setPanel(undefined)}>取消</AdminButton><AdminButton variant="primary" onClick={save}>确认</AdminButton></>}>
      {form ? <>
        <p className="reminder-hint reminder-purpose">用于公司内部事项提醒，仅向下方填写的邮箱发送邮件。</p>
        <div className="admin-form">
        <label className="admin-form__label is-required" htmlFor="reminder-title">邮件标题</label><div className="admin-form__control reminder-form-control"><input id="reminder-title" className="admin-control" placeholder="请输入邮件标题，最多100字" maxLength={100} value={draft.title} onChange={e => updateDraft('title', e.target.value)} />{fieldErrors.title ? <p className="reminder-field-error">{fieldErrors.title}</p> : null}</div>
        <label className="admin-form__label is-required" htmlFor="reminder-body">邮件正文</label><div className="admin-form__control reminder-form-control"><textarea id="reminder-body" className="admin-control" rows={6} placeholder="请输入邮件正文，最多5000字" maxLength={5000} value={draft.body} onChange={e => updateDraft('body', e.target.value)} />{fieldErrors.body ? <p className="reminder-field-error">{fieldErrors.body}</p> : null}</div>
        <label className="admin-form__label is-required" htmlFor="reminder-emails">收件邮箱</label><div className="admin-form__control reminder-form-control"><textarea id="reminder-emails" className="admin-control" rows={3} placeholder="每行一个邮箱，重复邮箱将自动去重" value={draft.emails} onChange={e => updateDraft('emails', e.target.value)} />{fieldErrors.emails ? <p className="reminder-field-error">{fieldErrors.emails}</p> : null}</div>
        <span className="admin-form__label is-required">提醒日期</span><div className="admin-form__control reminder-date-field"><AdminDatePicker disabledDate={date => date <= beijing(Date.now()).slice(0, 10)} value={draft.date || undefined} placeholder="请选择提醒日期" onChange={v => updateDraft('date', typeof v === 'string' ? v : '')} />{fieldErrors.date ? <p className="reminder-field-error">{fieldErrors.date}</p> : null}<p className="reminder-hint">于所选日期上午09:00发送一次。<br />仅可选择明天及以后的日期。</p></div>
      </div></> : null}
      {panel?.kind === '删除' ? <p className="reminder-copy">确定删除提醒「{draft.title}」吗？删除后将不再发送，且无法恢复。</p> : null}
    </AdminDrawer>
    <AdminToastViewport toasts={toasts} onDismiss={id => setToasts(v => v.filter(r => r.id !== id))} />
  </>;
}











