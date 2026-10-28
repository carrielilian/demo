import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  adminRouteToHash,
  equalAdminPath,
  findAdminMenuPath,
  findFirstAdminLeafRoute,
  flattenAdminCatalogOptions,
  getAdminAncestorIds,
  normalizeAdminRoute,
} from './route';
import type { AdminMenuNode, AdminShellProps } from './types';
import defaultPlatformLogo from './platform-logo.png';

function readHashRoute(): string {
  if (typeof window === 'undefined') return '';
  return normalizeAdminRoute(window.location.hash);
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg className="admin-shell__chevron" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <title>{expanded ? '收起' : '展开'}</title>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v11m0 0l-4-4m4 4l4-4M5 17v3h14v-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function useDismissableLayer(
  open: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement>,
) {
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [containerRef, onClose, open]);
}

export function AdminShell({
  logoSrc = defaultPlatformLogo,
  logoAlt = '后台品牌',
  catalogOptions,
  catalogPath,
  onCatalogPathChange,
  menuTree,
  defaultRoute,
  breadcrumbPrefix = [],
  userLabel,
  userActions = [],
  onDownload,
  renderPage,
}: AdminShellProps) {
  const firstRoute = useMemo(() => findFirstAdminLeafRoute(menuTree) ?? '', [menuTree]);
  const configuredDefault = normalizeAdminRoute(defaultRoute ?? '');
  const initialRoute = readHashRoute() || configuredDefault || firstRoute;
  const [currentRoute, setCurrentRoute] = useState(initialRoute);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const menuPath = useMemo(
    () => findAdminMenuPath(menuTree, currentRoute) ?? [],
    [currentRoute, menuTree],
  );
  const catalogLeaves = useMemo(() => flattenAdminCatalogOptions(catalogOptions), [catalogOptions]);
  const selectedCatalog = catalogLeaves.find((leaf) => equalAdminPath(leaf.path, catalogPath));
  const currentLeaf = menuPath[menuPath.length - 1];
  const breadcrumbItems = [...breadcrumbPrefix, ...menuPath.map((node) => node.label)];

  const closeCatalog = () => setCatalogOpen(false);
  const closeUser = () => setUserOpen(false);
  useDismissableLayer(catalogOpen, closeCatalog, catalogRef);
  useDismissableLayer(userOpen, closeUser, userRef);

  const navigate = (route: string) => {
    const normalized = normalizeAdminRoute(route);
    if (!normalized) return;
    setCurrentRoute(normalized);
    if (typeof window !== 'undefined' && window.location.hash !== adminRouteToHash(normalized)) {
      window.location.hash = `/${normalized}`;
    }
  };

  useEffect(() => {
    const onHashChange = () => setCurrentRoute(readHashRoute());
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentRoute || !findAdminMenuPath(menuTree, currentRoute)) return;
    if (readHashRoute() === currentRoute) return;
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${adminRouteToHash(currentRoute)}`,
    );
  }, [currentRoute, menuTree]);

  useEffect(() => {
    const currentPath = findAdminMenuPath(menuTree, currentRoute);
    if (currentPath) return;
    const validConfiguredDefault = configuredDefault && findAdminMenuPath(menuTree, configuredDefault)
      ? configuredDefault
      : '';
    const fallback = validConfiguredDefault || firstRoute;
    if (fallback && fallback !== currentRoute) navigate(fallback);
  }, [catalogPath, configuredDefault, currentRoute, firstRoute, menuTree]);

  useEffect(() => {
    const ancestorIds = getAdminAncestorIds(menuPath);
    if (!ancestorIds.length) return;
    setExpandedIds((previous) => {
      const next = new Set(previous);
      ancestorIds.forEach((id) => next.add(id));
      return next;
    });
  }, [menuPath]);

  const toggleMenu = (id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderMenuNodes = (nodes: AdminMenuNode[], depth = 0): React.ReactNode => (
    <ul className="admin-shell__menu-list" data-depth={depth}>
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const expanded = expandedIds.has(node.id);
        const active = !hasChildren && Boolean(node.route) && normalizeAdminRoute(node.route ?? '') === currentRoute;
        const rowStyle = { '--admin-menu-depth': depth } as CSSProperties;
        return (
          <li key={node.id} className="admin-shell__menu-item">
            {hasChildren ? (
              <button
                type="button"
                className={`admin-shell__menu-row admin-shell__menu-row--parent${depth === 0 ? ' admin-shell__menu-row--root' : ''}`}
                style={rowStyle}
                aria-expanded={expanded}
                onClick={() => toggleMenu(node.id)}
              >
                <span>{node.label}</span>
                <ChevronIcon expanded={expanded} />
              </button>
            ) : (
              <button
                type="button"
                className={`admin-shell__menu-row admin-shell__menu-row--leaf${depth === 0 ? ' admin-shell__menu-row--root' : ''}${active ? ' is-active' : ''}`}
                style={rowStyle}
                disabled={!node.route}
                aria-current={active ? 'page' : undefined}
                onClick={() => node.route && navigate(node.route)}
              >
                <span>{node.label}</span>
              </button>
            )}
            {hasChildren && expanded ? renderMenuNodes(node.children ?? [], depth + 1) : null}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__brand">
          <img className="admin-shell__logo" src={logoSrc} alt={logoAlt} />
        </div>
        <nav className="admin-shell__navigation" aria-label="后台菜单">
          {renderMenuNodes(menuTree)}
        </nav>
      </aside>

      <div className="admin-shell__main">
        <header className="admin-shell__header">
          <div className="admin-shell__header-left">
            <div className="admin-shell__catalog" ref={catalogRef}>
              <button
                type="button"
                className="admin-shell__catalog-trigger"
                aria-haspopup="listbox"
                aria-expanded={catalogOpen}
                onClick={() => {
                  setCatalogOpen((open) => !open);
                  setUserOpen(false);
                }}
              >
                <span>{selectedCatalog?.labels.join(' / ') ?? '请选择项目归属位置'}</span>
                <ChevronIcon expanded={catalogOpen} />
              </button>
              {catalogOpen ? (
                <div className="admin-shell__catalog-menu" role="listbox">
                  {catalogLeaves.map((leaf) => {
                    const selected = equalAdminPath(leaf.path, catalogPath);
                    return (
                      <button
                        type="button"
                        key={leaf.path.join('/')}
                        role="option"
                        aria-selected={selected}
                        className={`admin-shell__catalog-option${selected ? ' is-selected' : ''}`}
                        onClick={() => {
                          onCatalogPathChange(leaf.path);
                          closeCatalog();
                        }}
                      >
                        {leaf.labels.join(' / ')}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <nav className="admin-shell__breadcrumb" aria-label="面包屑">
              {breadcrumbItems.map((label, index) => (
                <React.Fragment key={`${label}-${index}`}>
                  {index > 0 ? <span className="admin-shell__breadcrumb-separator">/</span> : null}
                  <span aria-current={index === breadcrumbItems.length - 1 ? 'page' : undefined}>{label}</span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="admin-shell__header-actions">
            <button
              type="button"
              className="admin-shell__icon-button"
              aria-label="下载"
              onClick={onDownload}
            >
              <DownloadIcon />
            </button>
            <div className="admin-shell__user" ref={userRef}>
              <button
                type="button"
                className="admin-shell__user-trigger"
                aria-haspopup={userActions.length ? 'menu' : undefined}
                aria-expanded={userActions.length ? userOpen : undefined}
                onClick={() => {
                  if (!userActions.length) return;
                  setUserOpen((open) => !open);
                  setCatalogOpen(false);
                }}
              >
                <UserIcon />
                <span>{userLabel}</span>
                {userActions.length ? <ChevronIcon expanded={userOpen} /> : null}
              </button>
              {userOpen && userActions.length ? (
                <div className="admin-shell__user-menu" role="menu">
                  {userActions.map((action) => (
                    <button
                      type="button"
                      key={action.id}
                      role="menuitem"
                      disabled={action.disabled}
                      onClick={() => {
                        action.onSelect();
                        closeUser();
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="admin-shell__tabs" aria-label="当前页面">
          <span className="admin-shell__current-tab">{currentLeaf?.label ?? '未配置页面'}</span>
        </div>

        <main className="admin-shell__content" data-current-route={currentRoute}>
          {renderPage(currentRoute)}
        </main>
      </div>
    </div>
  );
}
