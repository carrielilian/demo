export type Status = '待发送' | '已发送';
export interface Reminder { id: string; title: string; body: string; emails: string[]; date: string; status: Status; createdAt: string; operator: string; result?: string }
export const storageKey = 'notification-reminders-v1';
export const beijing = (time: number) => new Date(time + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
export const scheduledAt = (date: string) => Date.parse(date + 'T09:00:00+08:00');
export const editable = (row: Reminder, time = Date.now()) => row.status === '待发送' && scheduledAt(row.date) > time;
export function parseEmails(text: string) {
  const emails = [...new Set(text.split(/\r?\n/).map(value => value.trim()).filter(Boolean))];
  if (!emails.length) throw new Error('请完善信息');
  if (emails.some(value => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) throw new Error('请输入有效邮箱，每行一个');
  return emails;
}
export function validate(title: string, body: string, emails: string, date: string, time = Date.now()) {
  if (!title.trim() || !body.trim() || !emails.trim() || !date) throw new Error('请完善信息');
  if (title.trim().length > 100 || body.trim().length > 5000) throw new Error('标题最多100字，正文最多5000字');
  const parsed = parseEmails(emails);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(scheduledAt(date)) || beijing(scheduledAt(date)).slice(0,10) !== date || date <= beijing(time).slice(0, 10)) throw new Error('仅可选择明天及以后的日期');
  return parsed;
}
export function processDue(rows: Reminder[], time = Date.now()): Reminder[] {
  return rows.map(row => row.status === '待发送' && scheduledAt(row.date) <= time ? { ...row, status: '已发送', result: '模拟发送完成，未实际发送邮件。' } : row);
}
export function seed(time = Date.now()): Reminder[] {
  return Array.from({ length: 26 }, (_, i) => {
    const status: Status = i < 14 ? '待发送' : '已发送';
    return { id: 'demo-' + i, title: ['合同到期提醒','月度资料提交提醒','项目进度确认','报表核对提醒'][i % 4] + ' ' + (i + 1),
      body: '请及时查看相关事项，并在约定时间内完成处理。\n如已处理，请忽略此提醒。',
      emails: ['team' + (i + 1) + '@example.com', 'manager@example.com'],
      date: beijing(time + (status === '待发送' ? i + 1 : -i) * 86400000).slice(0,10),
      status, createdAt: beijing(time - (i + 30) * 86400000), operator: '演示管理员',
      result: status === '已发送' ? '模拟发送完成，未实际发送邮件。' : undefined };
  });
}




