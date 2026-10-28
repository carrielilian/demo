import React, { useEffect, useMemo } from 'react';

const pageMap: Record<string, { file: string; cropShell: boolean; catalog: string[]; title: string }> = {
  'finance/withdrawal-whitelist': { file: '提现白名单设置.html', cropShell: true, catalog: ['business', 'finance'], title: '提现白名单设置' },
  'game/compliance/contracts': { file: '合同管理.html', cropShell: true, catalog: ['4399', 'game'], title: '合同管理' },
  'finance/withdrawal-rules': { file: '不可提现判断条件变更.html', cropShell: false, catalog: ['business', 'finance'], title: '不可提现判断条件变更' },
};

export function MergedPage({ route, onCatalogChange }: { route: string; onCatalogChange: (path: string[]) => void }) {
  const page = pageMap[route] ?? pageMap['finance/withdrawal-rules'];
  const source = useMemo(() => `/axure-adjust/${encodeURIComponent(page.file)}`, [page.file]);

  useEffect(() => onCatalogChange(page.catalog), [onCatalogChange, page.catalog]);

  return (
    <section className={`axure-embed${page.cropShell ? ' axure-embed--cropped' : ''}`} aria-label={page.title}>
      <iframe className="axure-embed__frame" src={source} title={page.title} />
    </section>
  );
}
