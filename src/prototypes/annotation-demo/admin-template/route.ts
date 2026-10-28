import type { AdminCatalogOption, AdminMenuNode } from './types';

export function normalizeAdminRoute(route: string): string {
  return route.trim().replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
}

export function adminRouteToHash(route: string): string {
  const normalized = normalizeAdminRoute(route);
  return normalized ? `#/${normalized}` : '#/';
}

export function findAdminMenuPath(
  nodes: AdminMenuNode[],
  route: string,
  ancestors: AdminMenuNode[] = [],
): AdminMenuNode[] | null {
  const normalized = normalizeAdminRoute(route);
  for (const node of nodes) {
    const path = [...ancestors, node];
    if (!node.children?.length && node.route && normalizeAdminRoute(node.route) === normalized) {
      return path;
    }
    if (node.children?.length) {
      const childPath = findAdminMenuPath(node.children, normalized, path);
      if (childPath) return childPath;
    }
  }
  return null;
}

export function findFirstAdminLeafRoute(nodes: AdminMenuNode[]): string | null {
  for (const node of nodes) {
    if (node.children?.length) {
      const childRoute = findFirstAdminLeafRoute(node.children);
      if (childRoute) return childRoute;
    } else if (node.route) {
      return normalizeAdminRoute(node.route);
    }
  }
  return null;
}

export function getAdminAncestorIds(path: AdminMenuNode[]): string[] {
  return path.slice(0, -1).map((node) => node.id);
}

export interface AdminCatalogLeaf {
  path: string[];
  labels: string[];
}

export function flattenAdminCatalogOptions(
  options: AdminCatalogOption[],
  valuePath: string[] = [],
  labelPath: string[] = [],
): AdminCatalogLeaf[] {
  return options.flatMap((option) => {
    const nextValues = [...valuePath, option.value];
    const nextLabels = [...labelPath, option.label];
    if (option.children?.length) {
      return flattenAdminCatalogOptions(option.children, nextValues, nextLabels);
    }
    return [{ path: nextValues, labels: nextLabels }];
  });
}

export function equalAdminPath(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
