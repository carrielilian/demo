import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface AdminMenuNode {
  id: string;
  label: string;
  route?: string;
  children?: AdminMenuNode[];
}

export interface AdminCatalogOption {
  value: string;
  label: string;
  children?: AdminCatalogOption[];
}

export interface AdminUserAction {
  id: string;
  label: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface AdminShellProps {
  logoSrc?: string;
  logoAlt?: string;
  /** 用户在当前需求中明确指定的项目归属位置候选项。 */
  catalogOptions: AdminCatalogOption[];
  /** 当前项目归属位置的完整受控路径，不得使用 Skill 默认值。 */
  catalogPath: string[];
  onCatalogPathChange: (path: string[]) => void;
  menuTree: AdminMenuNode[];
  defaultRoute?: string;
  breadcrumbPrefix?: string[];
  userLabel: string;
  userActions?: AdminUserAction[];
  onDownload?: () => void;
  renderPage: (route: string) => ReactNode;
}

export type AdminButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

export interface AdminPageCardProps extends HTMLAttributes<HTMLElement> {
  layout?: 'default' | 'list';
}

export interface AdminEnumFilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AdminTableEnumFilterConfig {
  value?: string;
  options: AdminEnumFilterOption[];
  allLabel?: string;
  onChange: (value: string | undefined) => void;
}

export type AdminSortOrder = 'asc' | 'desc';

export interface AdminTableSort {
  key: string;
  order: AdminSortOrder;
}

export interface AdminTableColumn<T> {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T;
  width?: CSSProperties['width'];
  align?: 'left' | 'center' | 'right';
  className?: string;
  sortable?: boolean;
  enumFilter?: AdminTableEnumFilterConfig;
  render?: (row: T, rowIndex: number) => ReactNode;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface AdminScopeOption {
  value: string;
  label: string;
  children?: AdminScopeOption[];
}

export interface AdminScopeSelectProps {
  options: AdminScopeOption[];
  value: string[];
  onChange: (path: string[]) => void;
  className?: string;
}

export interface AdminSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AdminSelectProps {
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  placement?: 'down' | 'up';
  fill?: boolean;
}

export interface AdminRadioGroupProps {
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  name?: string;
  ariaLabel?: string;
  className?: string;
}

export interface AdminCheckboxGroupProps {
  value: string[];
  options: AdminSelectOption[];
  onChange: (value: string[]) => void;
  hint?: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export type AdminDatePickerType = 'date' | 'daterange' | 'datetimerange' | 'period';
export type AdminDateGranularity = 'day' | 'month' | 'year';

export interface AdminDatePickerProps {
  disabledDate?: (date: string) => boolean;
  type?: AdminDatePickerType;
  granularity?: AdminDateGranularity;
  showGranularity?: boolean;
  onGranularityChange?: (value: AdminDateGranularity) => void;
  value?: string | [string, string];
  onChange: (value: string | [string, string] | undefined) => void;
  placeholder?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  clearable?: boolean;
  className?: string;
}

export interface AdminQueryBarProps {
  scope?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  resultActions?: ReactNode;
  className?: string;
}

export interface AdminResultActionBarProps {
  children?: ReactNode;
  className?: string;
}

export interface AdminListActionBarProps {
  actions?: ReactNode;
  extra?: ReactNode;
  className?: string;
}

export type AdminStatusTone = 'gray' | 'green' | 'orange' | 'red';

export interface AdminStatusTagProps {
  tone: AdminStatusTone;
  children: ReactNode;
  className?: string;
}

export interface AdminTableLinkProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export interface AdminTypeTagProps {
  children: ReactNode;
  className?: string;
}

export interface ModalProps {
  open: boolean;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  closeOnMask?: boolean;
  closeOnEsc?: boolean;
  onClose: () => void;
}

export type AdminDrawerSize = 'large' | 'small';

export interface DrawerProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: AdminDrawerSize;
  width?: number | string;
  closeOnMask?: boolean;
  closeOnEsc?: boolean;
  onClose: () => void;
}

export interface AdminOperationLogItem {
  operator: string;
  time: string;
  action: string;
  tone: AdminStatusTone;
}

export interface AdminOperationLogProps {
  subjectLabel: string;
  subjectValue: string;
  rows: AdminOperationLogItem[];
}

export interface AdminChartPoint {
  x: string;
  y: number;
}

export interface AdminChartSeries {
  id: string;
  name: string;
  color?: string;
  points: AdminChartPoint[];
}

export type AdminLineChartPoint = AdminChartPoint;
export type AdminLineChartSeries = AdminChartSeries;

export interface AdminLineChartProps {
  periodText?: string;
  dimension?: string;
  dimensionOptions?: AdminSelectOption[];
  onDimensionChange?: (value: string) => void;
  series: AdminChartSeries[];
  selectedSeriesIds?: string[];
  onSelectedSeriesChange?: (ids: string[]) => void;
  valueFormat?: (value: number) => string;
}

export type AdminBarChartProps = AdminLineChartProps;

export interface AdminStatCardItem {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}

export interface AdminStatCardsProps {
  items: AdminStatCardItem[];
  ariaLabel?: string;
}

export interface AdminToast {
  id: string;
  message: ReactNode;
  tone?: 'success' | 'error' | 'warning' | 'info';
}

