import React, {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type {
  AdminButtonVariant,
  AdminPageCardProps,
  AdminListActionBarProps,
  AdminQueryBarProps,
  AdminResultActionBarProps,
  AdminScopeOption,
  AdminScopeSelectProps,
  AdminSelectOption,
  AdminSelectProps,
  AdminRadioGroupProps,
  AdminCheckboxGroupProps,
  AdminStatusTagProps,
  AdminTableLinkProps,
  AdminTypeTagProps,
  AdminTableColumn,
  AdminTableEnumFilterConfig,
  AdminTableSort,
  AdminToast,
  AdminDatePickerProps,
  AdminDateGranularity,
  DrawerProps,
  ModalProps,
  PaginationProps,
  AdminOperationLogProps,
  AdminOperationLogItem,
  AdminLineChartProps,
  AdminBarChartProps,
  AdminStatCardsProps,
} from './types';

export function AdminPageCard({ layout = 'default', className = '', ...props }: AdminPageCardProps) {
  return <section className={`admin-page-card admin-page-card--${layout} ${className}`.trim()} {...props} />;
}

export function AdminStatCards({ items, ariaLabel }: AdminStatCardsProps) {
  return (
    <dl
      className="admin-stat-cards"
      aria-label={ariaLabel}
      style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div className="admin-stat-card" key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            <strong>{item.value}</strong>
            {item.hint ? <span>{item.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminQueryBar({
  scope,
  children,
  actions,
  resultActions,
  className = '',
}: AdminQueryBarProps) {
  return (
    <div className={`admin-query-bar ${className}`.trim()}>
      {hasContent(scope) ? (
        <div className={`admin-query-bar__scope${hasContent(children) ? ' admin-query-bar__scope--divided' : ''}`}>
          {scope}
        </div>
      ) : null}
      <div className="admin-query-bar__fields">{children}</div>
      {hasContent(actions) ? <div className="admin-query-bar__actions">{actions}</div> : null}
      {hasContent(resultActions) ? <div className="admin-query-bar__result-actions">{resultActions}</div> : null}
    </div>
  );
}

function hasContent(value: ReactNode): boolean {
  return Children.toArray(value).some((node) => {
    if (typeof node === 'string') return node.trim().length > 0;
    if (isValidElement(node) && node.type === Fragment) {
      return hasContent((node.props as { children?: ReactNode }).children);
    }
    return node !== null;
  });
}

export function AdminScopeSelect({
  options,
  value,
  onChange,
  className = '',
}: AdminScopeSelectProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(value[0] ?? options[0]?.value ?? '');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const platforms = options.map((option) => ({
    value: option.value,
    label: option.label,
    children: option.children?.map((child) => ({ value: child.value, label: child.label })),
  }));
  const selectedPlatform = platforms.find((option) => option.value === value[0]) ?? platforms[0];
  const previewPlatform = platforms.find((option) => option.value === preview) ?? selectedPlatform;
  const selectedType = selectedPlatform?.children?.find((option) => option.value === value[1]);
  const triggerLabel = selectedPlatform
    ? selectedType
      ? `${selectedPlatform.label}/${selectedType.label}`
      : selectedPlatform.label
    : '';

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (open) setPreview(value[0] ?? options[0]?.value ?? '');
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, left: rect.left });
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    };
    updatePosition();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const selectLeaf = (platform: AdminScopeOption, type?: AdminScopeOption) => {
    onChange(type ? [platform.value, type.value] : [platform.value]);
    close(true);
  };

  return (
    <div className={`admin-scope-select ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className={`admin-scope-select__trigger${open ? ' is-open' : ''}`}
        aria-label="业务范围"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{triggerLabel}</span>
        <svg className="admin-scope-select__chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open ? createPortal(
        <div
          ref={menuRef}
          className="admin-scope-select__menu"
          role="listbox"
          aria-label="业务范围"
          style={{ top: position.top, left: position.left }}
        >
          <div className="admin-scope-select__column">
            {platforms.map((platform) => {
              const active = platform.value === previewPlatform?.value;
              const selected = platform.value === selectedPlatform?.value;
              const hasChildren = Boolean(platform.children?.length);
              return (
                <button
                  key={platform.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`admin-scope-select__option${active || selected ? ' is-active' : ''}`}
                  onMouseEnter={() => setPreview(platform.value)}
                  onClick={() => {
                    if (hasChildren) setPreview(platform.value);
                    else selectLeaf(platform);
                  }}
                >
                  <span>{platform.label}</span>
                  {hasChildren ? <span className="admin-scope-select__arrow">›</span> : null}
                </button>
              );
            })}
          </div>
          {previewPlatform?.children?.length ? (
            <div className="admin-scope-select__column">
              {previewPlatform.children.map((type) => {
                const selected = previewPlatform.value === selectedPlatform?.value && type.value === selectedType?.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`admin-scope-select__option${selected ? ' is-active' : ''}`}
                    onClick={() => selectLeaf(previewPlatform, type)}
                  >
                    {selected ? <span className="admin-scope-select__check">✓</span> : null}
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

export function AdminSelect({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  placement = 'down',
  fill = false,
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 120 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const up = placement === 'up';

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.max(rect.width, 96);
      const menuHeight = menu?.offsetHeight ?? options.length * 32 + 12;
      setPosition({
        top: up ? Math.max(8, rect.top - menuHeight - 8) : rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        width,
      });
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    };
    updatePosition();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, options.length, up]);

  return (
    <div className={`admin-select${fill ? ' admin-select--fill' : ''} ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className={`admin-select__trigger${open ? ' is-open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label ?? ''}</span>
        <svg className="admin-select__chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? createPortal(
        <div
          ref={menuRef}
          className={`admin-select__menu${up ? ' admin-select__menu--up' : ''}`}
          role="listbox"
          style={{ top: position.top, left: position.left, minWidth: position.width }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className={`admin-select__option${option.value === value ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                close(true);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

export function AdminRadioGroup({
  value,
  options,
  onChange,
  name,
  ariaLabel,
  className = '',
}: AdminRadioGroupProps) {
  const autoName = useId();
  const groupName = name ?? autoName;

  return (
    <div className={`admin-choice ${className}`.trim()} role="radiogroup" aria-label={ariaLabel}>
      <div className="admin-choice__options">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label key={option.value} className={`admin-radio${checked ? ' is-checked' : ''}${option.disabled ? ' is-disabled' : ''}`}>
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />
              <span className="admin-radio__mark" aria-hidden="true" />
              <span className="admin-radio__text">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function AdminCheckboxGroup({
  value,
  options,
  onChange,
  hint,
  ariaLabel,
  className = '',
}: AdminCheckboxGroupProps) {
  return (
    <div className={`admin-choice ${className}`.trim()} role="group" aria-label={ariaLabel}>
      <div className="admin-choice__options">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label key={option.value} className={`admin-checkbox${checked ? ' is-checked' : ''}${option.disabled ? ' is-disabled' : ''}`}>
              <input
                type="checkbox"
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={() => {
                  onChange(checked ? value.filter((item) => item !== option.value) : [...value, option.value]);
                }}
              />
              <span className="admin-checkbox__mark" aria-hidden="true">
                <svg viewBox="0 0 12 12">
                  <path d="M2.4 6.2 5 8.8 9.6 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="admin-checkbox__text">{option.label}</span>
            </label>
          );
        })}
      </div>
      {hint ? <div className="admin-choice__hint">{hint}</div> : null}
    </div>
  );
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function formatDay(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseDay(value?: string) {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatMonth(year: number, month: number) {
  return `${year}-${padDatePart(month + 1)}`;
}

function parseMonth(value?: string) {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) return null;
  return { year: parts[0], month: parts[1] - 1 };
}

function parseYear(value?: string) {
  if (!value || !/^\d{4}$/.test(value)) return null;
  return Number(value);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function decadeStart(year: number) {
  return Math.floor(year / 10) * 10;
}

const MONTH_LABELS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const DAY_PRESETS: { id: 'yesterday' | 'd7' | 'd30' | 'd90'; label: string }[] = [
  { id: 'yesterday', label: '昨天' },
  { id: 'd7', label: '过去7天' },
  { id: 'd30', label: '过去30天' },
  { id: 'd90', label: '过去90天' },
];

function presetDayRange(id: (typeof DAY_PRESETS)[number]['id']): [string, string] {
  const today = startOfToday();
  if (id === 'yesterday') {
    const day = addDays(today, -1);
    return [formatDay(day), formatDay(day)];
  }
  const span = id === 'd7' ? 7 : id === 'd30' ? 30 : 90;
  return [formatDay(addDays(today, -span)), formatDay(addDays(today, -1))];
}

function shiftMonth(year: number, month: number, offset: number) {
  const date = new Date(year, month + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function monthCells(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { date: Date; current: boolean }[] = [];
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ date: new Date(year, month - 1, prevDays - firstWeekday + index + 1), current: false });
  }
  for (let day = 1; day <= days; day += 1) cells.push({ date: new Date(year, month, day), current: true });
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, cells.length - firstWeekday - days + 1), current: false });
  }
  return cells;
}

function CalendarIcon() {
  return (
    <svg className="admin-date-picker__icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="10.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 2v3M10.5 2v3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function DateClearIcon() {
  return (
    <svg className="admin-date-picker__clear-icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function AdminDatePicker({
  type = 'date',
  disabledDate,
  granularity: granularityProp,
  showGranularity = false,
  onGranularityChange,
  value,
  onChange,
  placeholder = '选择日期',
  startPlaceholder,
  endPlaceholder,
  clearable = false,
  className = '',
}: AdminDatePickerProps) {
  const isPeriod = type === 'period';
  const isDateTimeRange = type === 'datetimerange';
  const [innerGrain, setInnerGrain] = useState<AdminDateGranularity>(granularityProp ?? 'day');
  const grain = granularityProp ?? innerGrain;
  const isRange = type === 'daterange' || isDateTimeRange || isPeriod;
  const yearMode = isPeriod && grain === 'year';
  const monthMode = isPeriod && grain === 'month';
  const periodDay = isPeriod && grain === 'day';
  const [open, setOpen] = useState(false);
  const [yearField, setYearField] = useState<'start' | 'end'>('start');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [cursor, setCursor] = useState(() => {
    const raw = Array.isArray(value) ? value[0] : typeof value === 'string' ? value : undefined;
    const day = parseDay(raw);
    if (day) return { year: day.getFullYear(), month: day.getMonth() };
    const month = parseMonth(raw);
    if (month) return { year: month.year, month: month.month };
    const year = parseYear(raw);
    return { year: year ?? new Date().getFullYear(), month: new Date().getMonth() };
  });
  const [pendingStart, setPendingStart] = useState<string>();
  const [hoverDay, setHoverDay] = useState<string>();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const startYearRef = useRef<HTMLDivElement>(null);
  const endYearRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startValue = isRange && Array.isArray(value) ? value[0] : '';
  const endValue = isRange && Array.isArray(value) ? value[1] : '';
  const singleValue = !isRange && typeof value === 'string' ? value : '';
  const rangeStart = pendingStart ?? startValue;
  const rangeEnd = pendingStart ? hoverDay : endValue;
  const startText = startPlaceholder ?? (yearMode ? '开始年份' : monthMode ? '开始月份' : isDateTimeRange ? '开始时间' : '开始日期');
  const endText = endPlaceholder ?? (yearMode ? '结束年份' : monthMode ? '结束月份' : isDateTimeRange ? '结束时间' : '结束日期');
  const hasValue = Boolean(singleValue || startValue || endValue);
  const right = shiftMonth(cursor.year, cursor.month, 1);
  const rightYear = cursor.year + 1;
  const yearsOrigin = decadeStart(cursor.year);

  const close = (restoreFocus = false) => {
    setOpen(false);
    setPendingStart(undefined);
    setHoverDay(undefined);
    if (restoreFocus) window.setTimeout(() => rootRef.current?.querySelector('input')?.focus(), 0);
  };

  const clearButton = clearable ? (
    <button
      type="button"
      className="admin-date-picker__clear"
      aria-label="清空"
      disabled={!hasValue}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        if (!hasValue) return;
        onChange(undefined);
        close(true);
      }}
    >
      <DateClearIcon />
    </button>
  ) : null;

  const changeGrain = (next: AdminDateGranularity) => {
    if (granularityProp === undefined) setInnerGrain(next);
    onGranularityChange?.(next);
    onChange(undefined);
    close();
  };

  useEffect(() => {
    if (!open) return undefined;
    if (yearMode) {
      const seed = parseYear(yearField === 'end' ? endValue : startValue) ?? new Date().getFullYear();
      setCursor({ year: seed, month: 0 });
    } else if (monthMode) {
      const seed = parseMonth(startValue);
      setCursor({ year: seed?.year ?? new Date().getFullYear(), month: 0 });
    } else {
      const seed = parseDay(startValue || singleValue) ?? new Date();
      setCursor({ year: seed.getFullYear(), month: seed.getMonth() });
    }
    const updatePosition = () => {
      const anchor = yearMode
        ? (yearField === 'end' ? endYearRef.current : startYearRef.current)
        : triggerRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, left: rect.left });
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    };
    updatePosition();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [endValue, monthMode, open, singleValue, startValue, yearField, yearMode]);

  const pickRangeValue = (next: string) => {
    if (!isRange) {
      onChange(next);
      close(true);
      return;
    }
    if (!pendingStart) {
      setPendingStart(next);
      setHoverDay(next);
      return;
    }
    const start = pendingStart <= next ? pendingStart : next;
    const end = pendingStart <= next ? next : pendingStart;
    onChange([start, end]);
    close(true);
  };

  const pickYearValue = (year: number) => {
    const next = String(year);
    if (yearField === 'end') {
      onChange(startValue ? (startValue <= next ? [startValue, next] : [next, startValue]) : [next, next]);
    } else {
      onChange(endValue ? (next <= endValue ? [next, endValue] : [next, next]) : [next, next]);
    }
    close(true);
  };

  const inRange = (token: string) => {
    if (!rangeStart || !rangeEnd) return false;
    const from = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    const to = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
    return token > from && token < to;
  };

  const selectedToken = (token: string) => {
    if (pendingStart) return token === pendingStart || token === rangeEnd;
    return token === singleValue || token === startValue || token === endValue;
  };

  const renderMonth = (year: number, month: number) => (
    <div className="admin-date-picker__month">
      <div className="admin-date-picker__weekdays">
        {WEEKDAYS.map((label) => <span key={label}>{label}</span>)}
      </div>
      <div className="admin-date-picker__days">
        {monthCells(year, month).map((cell, index) => {
          if (!cell.current) {
            return <span key={`${year}-${month}-e${index}`} className="admin-date-picker__day is-empty" />;
          }
          const day = formatDay(cell.date);
          const today = day === formatDay(new Date());
          return (
            <button
              key={day}
              disabled={disabledDate?.(day)}
              type="button"
              className={`admin-date-picker__day${selectedToken(day) ? ' is-selected' : ''}${inRange(day) ? ' is-in-range' : ''}${today ? ' is-today' : ''}`}
              onMouseEnter={() => pendingStart && setHoverDay(day)}
              onClick={() => { if (!disabledDate?.(day)) pickRangeValue(day); }}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderMonthGrid = (year: number) => (
    <div className="admin-date-picker__pane">
      <div className="admin-date-picker__header">
        {year === cursor.year ? (
          <button type="button" aria-label="上一年" onClick={() => setCursor({ year: cursor.year - 1, month: 0 })}>«</button>
        ) : <span className="admin-date-picker__header-spacer" />}
        <strong>{year} 年</strong>
        {year === rightYear ? (
          <button type="button" aria-label="下一年" onClick={() => setCursor({ year: cursor.year + 1, month: 0 })}>»</button>
        ) : <span className="admin-date-picker__header-spacer" />}
      </div>
      <div className="admin-date-picker__months">
        {MONTH_LABELS.map((label, month) => {
          const token = formatMonth(year, month);
          return (
            <button
              key={token}
              type="button"
              className={`admin-date-picker__month-cell${selectedToken(token) ? ' is-selected' : ''}${inRange(token) ? ' is-in-range' : ''}`}
              onMouseEnter={() => pendingStart && setHoverDay(token)}
              onClick={() => pickRangeValue(token)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const rangeFields = (
    <div
      className={`admin-date-picker__range${open && !yearMode ? ' is-open' : ''}`}
      ref={triggerRef}
      onClick={() => {
        setOpen(true);
        setYearField('start');
      }}
    >
      <CalendarIcon />
      <input className="admin-date-picker__input" readOnly placeholder={startText} value={startValue} aria-label={startText} />
      <span className="admin-date-picker__separator">-</span>
      <input className="admin-date-picker__input" readOnly placeholder={endText} value={endValue} aria-label={endText} />
      {clearButton}
    </div>
  );

  const yearFields = (
    <div className="admin-date-picker__year-fields">
      <div
        className={`admin-date-picker__single${open && yearField === 'start' ? ' is-open' : ''}`}
        ref={startYearRef}
        onClick={() => {
          setYearField('start');
          setOpen(true);
        }}
      >
        <CalendarIcon />
        <input className="admin-date-picker__input" readOnly placeholder={startText} value={startValue} aria-label={startText} />
      </div>
      <span className="admin-date-picker__separator">~</span>
      <div
        className={`admin-date-picker__single${open && yearField === 'end' ? ' is-open' : ''}`}
        ref={endYearRef}
        onClick={() => {
          setYearField('end');
          setOpen(true);
        }}
      >
        <CalendarIcon />
        <input className="admin-date-picker__input" readOnly placeholder={endText} value={endValue} aria-label={endText} />
        {clearButton}
      </div>
    </div>
  );

  const singleFields = (
    <div className={`admin-date-picker__single${open ? ' is-open' : ''}`} ref={triggerRef} onClick={() => setOpen(true)}>
      <CalendarIcon />
      <input className="admin-date-picker__input" readOnly placeholder={placeholder} value={singleValue} aria-label={placeholder} />
      {clearButton}
    </div>
  );

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      className={`admin-date-picker__menu${periodDay ? ' admin-date-picker__menu--day' : ''}${monthMode ? ' admin-date-picker__menu--month' : ''}${yearMode ? ' admin-date-picker__menu--year' : ''}`}
      style={{ top: position.top, left: position.left }}
    >
      {periodDay ? (
        <>
          <div className="admin-date-picker__presets">
            {DAY_PRESETS.map((preset) => {
              const range = presetDayRange(preset.id);
              const active = startValue === range[0] && endValue === range[1];
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`admin-date-picker__preset${active ? ' is-active' : ''}`}
                  onClick={() => {
                    onChange(range);
                    close(true);
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div className="admin-date-picker__body">
            <div className="admin-date-picker__pane">
              <div className="admin-date-picker__header">
                <button type="button" aria-label="上一年" onClick={() => setCursor(shiftMonth(cursor.year, cursor.month, -12))}>«</button>
                <button type="button" aria-label="上一月" onClick={() => setCursor(shiftMonth(cursor.year, cursor.month, -1))}>‹</button>
                <strong>{cursor.year}年 {cursor.month + 1}月</strong>
              </div>
              {renderMonth(cursor.year, cursor.month)}
            </div>
            <div className="admin-date-picker__pane">
              <div className="admin-date-picker__header admin-date-picker__header--end">
                <strong>{right.year}年 {right.month + 1}月</strong>
                <button type="button" aria-label="下一月" onClick={() => setCursor(shiftMonth(cursor.year, cursor.month, 1))}>›</button>
                <button type="button" aria-label="下一年" onClick={() => setCursor(shiftMonth(cursor.year, cursor.month, 12))}>»</button>
              </div>
              {renderMonth(right.year, right.month)}
            </div>
          </div>
        </>
      ) : monthMode ? (
        <div className="admin-date-picker__body">
          {renderMonthGrid(cursor.year)}
          {renderMonthGrid(rightYear)}
        </div>
      ) : yearMode ? (
        <>
          <div className="admin-date-picker__header">
            <button type="button" aria-label="上一年代" onClick={() => setCursor({ year: yearsOrigin - 10, month: 0 })}>«</button>
            <strong>{yearsOrigin} 年 - {yearsOrigin + 9} 年</strong>
            <button type="button" aria-label="下一年代" onClick={() => setCursor({ year: yearsOrigin + 10, month: 0 })}>»</button>
          </div>
          <div className="admin-date-picker__years">
            {Array.from({ length: 10 }, (_, index) => yearsOrigin + index).map((year) => {
              const token = String(year);
              return (
                <button
                  key={token}
                  type="button"
                  className={`admin-date-picker__year-cell${selectedToken(token) ? ' is-selected' : ''}${inRange(token) ? ' is-in-range' : ''}`}
                  onClick={() => pickYearValue(year)}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="admin-date-picker__header">
            <button type="button" aria-label="上一年" onClick={() => setCursor(shiftMonth(cursor.year, cursor.month, -12))}>«</button>
            <button type="button" aria-label="上一月" onClick={() => setCursor(shiftMonth(cursor.year, cursor.month, -1))}>‹</button>
            <strong>{cursor.year}年{cursor.month + 1}月{isRange ? ` - ${right.year}年${right.month + 1}月` : ''}</strong>
            <button type="button" aria-label="下一月" onClick={() => setCursor(shiftMonth(cursor.year, cursor.month, 1))}>›</button>
            <button type="button" aria-label="下一年" onClick={() => setCursor(shiftMonth(cursor.year, cursor.month, 12))}>»</button>
          </div>
          <div className="admin-date-picker__body">
            {renderMonth(cursor.year, cursor.month)}
            {isRange ? renderMonth(right.year, right.month) : null}
          </div>
        </>
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <div
      className={`admin-date-picker admin-date-picker--${isPeriod ? `period admin-date-picker--${grain}` : type} ${className}`.trim()}
      ref={rootRef}
    >
      {isPeriod && showGranularity ? (
        <AdminSelect
          className="admin-date-picker__granularity"
          ariaLabel="时间粒度"
          value={grain}
          options={[
            { value: 'day', label: '按日' },
            { value: 'month', label: '按月' },
            { value: 'year', label: '按年' },
          ]}
          onChange={(next) => changeGrain(next as AdminDateGranularity)}
        />
      ) : null}
      {yearMode ? yearFields : isRange ? rangeFields : singleFields}
      {menu}
    </div>
  );
}

export function AdminResultActionBar({ children, className = '' }: AdminResultActionBarProps) {
  if (!hasContent(children)) return null;
  return <div className={`admin-result-action-bar ${className}`.trim()}>{children}</div>;
}

export function AdminListActionBar({ actions, extra, className = '' }: AdminListActionBarProps) {
  if (!hasContent(actions) && !hasContent(extra)) return null;
  return (
    <div className={`admin-list-action-bar ${className}`.trim()}>
      {hasContent(actions) ? <div className="admin-list-action-bar__actions">{actions}</div> : null}
      {hasContent(extra) ? <div className="admin-list-action-bar__extra">{extra}</div> : null}
    </div>
  );
}

export function AdminStatusTag({ tone, children, className = '' }: AdminStatusTagProps) {
  return (
    <span className={`admin-status-tag admin-status-tag--${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}

export function AdminTableLink({ href, onClick, children, className = '' }: AdminTableLinkProps) {
  const classNames = `admin-table-link ${className}`.trim();
  if (href) {
    return <a className={classNames} href={href} onClick={onClick}>{children}</a>;
  }
  return <button type="button" className={classNames} onClick={onClick}>{children}</button>;
}

export function AdminTypeTag({ children, className = '' }: AdminTypeTagProps) {
  return <span className={`admin-type-tag ${className}`.trim()}>{children}</span>;
}

function EmptyBoxIcon() {
  return (
    <svg className="admin-empty-state__icon" viewBox="0 0 79 86" aria-hidden="true">
      <defs>
        <linearGradient id="admin-empty-fill-a" x1="38.85%" y1="0%" x2="61.15%" y2="100%">
          <stop offset="0%" stopColor="#FCFCFD" />
          <stop offset="100%" stopColor="#EEEFF3" />
        </linearGradient>
        <linearGradient id="admin-empty-fill-b" x1="0%" y1="9.5%" x2="100%" y2="90.5%">
          <stop offset="0%" stopColor="#FCFCFD" />
          <stop offset="100%" stopColor="#E3E5EB" />
        </linearGradient>
      </defs>
      <ellipse cx="39.5" cy="82" rx="39.5" ry="4" fill="#EEEEEF" />
      <polygon points="13 58 53 58 42 45 2 45" fill="#DCDFE6" transform="translate(27.5 51.5) scale(1 -1) translate(-27.5 -51.5)" />
      <g transform="translate(34.5 31.5) scale(-1 1) rotate(-25) translate(-34.5 -31.5) translate(7 10)">
        <polygon points="0 3 18 3 23 7 5 7" fill="#DCDFE6" transform="translate(11.5 5) scale(1 -1) translate(-11.5 -5)" />
        <rect x="0" y="7" width="38" height="36" fill="#F2F3F5" />
        <rect x="38" y="7" width="17" height="36" fill="url(#admin-empty-fill-a)" transform="translate(46.5 25) scale(-1 1) translate(-46.5 -25)" />
        <polygon points="24 7 41 7 55 0 38 0" fill="#EBEDF0" transform="translate(39.5 3.5) scale(-1 1) translate(-39.5 -3.5)" />
      </g>
      <rect x="13" y="45" width="40" height="36" fill="url(#admin-empty-fill-b)" />
      <rect x="53" y="45" width="17" height="36" fill="#E9E9EB" />
      <polygon points="62 45 79 45 70 58 53 58" fill="#EBEDF0" transform="translate(66 51.5) scale(-1 1) translate(-66 -51.5)" />
    </svg>
  );
}

export function AdminButton({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: AdminButtonVariant }) {
  return (
    <button
      type={type}
      className={`admin-button admin-button--${variant} ${className}`.trim()}
      {...props}
    />
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M1.5 2h9L7 6v3.2l-2 1V6Z" fill="currentColor" />
    </svg>
  );
}

export function AdminTableEnumFilter({
  config,
  label,
}: {
  config: AdminTableEnumFilterConfig;
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const allLabel = config.allLabel ?? '全部';
  const options = [{ value: undefined, label: allLabel, disabled: false }, ...config.options];

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (config.value !== undefined && !config.options.some((option) => option.value === config.value)) {
      config.onChange(undefined);
    }
  }, [config]);

  useEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const field = trigger.closest('.admin-table__header-content') ?? trigger;
      const fieldRect = field.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth ?? 80;
      const fieldCenter = fieldRect.left + fieldRect.width / 2;
      const left = Math.max(8, Math.min(fieldCenter - menuWidth / 2, window.innerWidth - menuWidth - 8));
      setPosition({
        top: triggerRect.bottom + 8,
        left,
      });
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    };
    updatePosition();
    const focusTimer = window.setTimeout(() => {
      const selected = menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      selected?.focus();
      updatePosition();
    }, 0);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`admin-table-filter__trigger${config.value !== undefined ? ' is-active' : ''}`}
        aria-label={`筛选${label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <FilterIcon />
      </button>
      {open ? createPortal(
        <div
          ref={menuRef}
          className="admin-table-filter__menu admin-select__menu"
          role="listbox"
          aria-label={`${label}筛选`}
          style={{ top: position.top, left: position.left }}
        >
          {options.map((option) => {
            const selected = option.value === config.value;
            return (
              <button
                key={option.value ?? '__all__'}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                className={`admin-select__option${selected ? ' is-selected' : ''}`}
                onClick={() => {
                  config.onChange(option.value);
                  close(true);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>,
        document.body,
      ) : null}
    </>
  );
}

export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  loading = false,
  emptyText = '暂无数据',
  emptyIllustration = true,
  className = '',
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, rowIndex: number) => React.Key;
  sort?: AdminTableSort;
  onSortChange?: (sort: AdminTableSort | undefined) => void;
  loading?: boolean;
  emptyText?: ReactNode;
  emptyIllustration?: boolean;
  className?: string;
}) {
  return (
    <div className={`admin-table-wrap ${className}`.trim()} aria-busy={loading}>
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.className}
                style={{ width: column.width, textAlign: column.align ?? 'left' }}
              >
                <span className="admin-table__header-content">
                  <span>{column.title}</span>
                  {column.sortable ? (
                    <button
                      type="button"
                      className="admin-table-sort"
                      aria-label={`排序${typeof column.title === 'string' ? column.title : ''}`}
                      onClick={() => {
                        const active = sort?.key === column.key ? sort.order : undefined;
                        const next = active === 'asc' ? 'desc' : active === 'desc' ? undefined : 'asc';
                        onSortChange?.(next ? { key: column.key, order: next } : undefined);
                      }}
                    >
                      <i className={`admin-table-sort__caret admin-table-sort__caret--up${sort?.key === column.key && sort.order === 'asc' ? ' is-active' : ''}`} />
                      <i className={`admin-table-sort__caret admin-table-sort__caret--down${sort?.key === column.key && sort.order === 'desc' ? ' is-active' : ''}`} />
                    </button>
                  ) : null}
                  {column.enumFilter ? (
                    <AdminTableEnumFilter
                      config={column.enumFilter}
                      label={typeof column.title === 'string' ? column.title : '枚举字段'}
                    />
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading || rows.length === 0 ? (
            <tr>
              <td className="admin-table__state" colSpan={Math.max(columns.length, 1)}>
                {loading ? (
                  '加载中…'
                ) : (
                  <div className="admin-empty-state">
                    {emptyIllustration ? <EmptyBoxIcon /> : null}
                    <span>{emptyText}</span>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowKey(row, rowIndex)}>
                {columns.map((column) => {
                  const rawValue = column.dataIndex === undefined ? undefined : row[column.dataIndex];
                  const content = column.render
                    ? column.render(row, rowIndex)
                    : rawValue === null || rawValue === undefined || rawValue === ''
                      ? '-'
                      : String(rawValue);
                  return (
                    <td
                      key={column.key}
                      className={column.className}
                      style={{ textAlign: column.align ?? 'left' }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminOperationLog({ subjectLabel, subjectValue, rows }: AdminOperationLogProps) {
  const columns: AdminTableColumn<AdminOperationLogItem>[] = [
    { key: 'operator', title: '操作人员', dataIndex: 'operator' },
    { key: 'time', title: '操作时间', dataIndex: 'time' },
    {
      key: 'action',
      title: '操作',
      render: (row) => <AdminStatusTag tone={row.tone}>{row.action}</AdminStatusTag>,
    },
  ];
  return (
    <div className="admin-operation-log">
      <p className="admin-operation-log__subject">{`${subjectLabel}：${subjectValue || '-'}`}</p>
      <AdminDataTable
        columns={columns}
        rows={rows}
        rowKey={(row, index) => `${row.time}-${row.operator}-${index}`}
      />
    </div>
  );
}

const CHART_SERIES_COLORS = [
  '#4165D7',
  '#8FCE7A',
  '#E8C07A',
  '#B39DDB',
  '#F5A9B8',
  '#80CBC4',
  '#FFAB91',
  '#B0B4BA',
  '#C5E1A5',
  '#D7CCC8',
  '#81D4FA',
  '#CE93D8',
  '#A5D6A7',
  '#FFE082',
  '#9E9E9E',
];
const LINE_CHART_W = 960;
const LINE_CHART_H = 248;
const LINE_CHART_PL = 64;
const LINE_CHART_PR = 12;
const LINE_CHART_PT = 8;
const LINE_CHART_PB = 28;

function lineChartNiceMax(value: number) {
  if (value <= 0) return 1;
  const raw = value / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * mag * 5;
}

function lineChartAxisText(value: number) {
  if (value === 0) return '0';
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function lineChartValueText(value: number) {
  if (Number.isInteger(value)) return value.toLocaleString('en-US');
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineChartLabelIndexes(count: number) {
  if (count <= 8) return Array.from({ length: count }, (_, index) => index);
  const marks = new Set([0, count - 1]);
  for (let step = 1; step <= 6; step += 1) marks.add(Math.round(((count - 1) * step) / 7));
  return [...marks].sort((left, right) => left - right);
}

function lineChartBarPath(x: number, y: number, width: number, height: number) {
  if (height <= 0) return '';
  const radius = Math.min(2, width / 2, height);
  if (height <= radius) {
    return `M${x},${y + height}H${x + width}V${y}H${x}Z`;
  }
  return `M${x},${y + height}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + width - radius}Q${x + width},${y} ${x + width},${y + radius}V${y + height}Z`;
}

function ChartView({
  variant,
  periodText,
  dimension,
  dimensionOptions,
  onDimensionChange,
  series,
  selectedSeriesIds,
  onSelectedSeriesChange,
  valueFormat,
}: AdminLineChartProps & { variant: 'line' | 'bar' }) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [chartW, setChartW] = useState(LINE_CHART_W);
  const [internalSelected, setInternalSelected] = useState<string[]>(series[0] ? [series[0].id] : []);
  const [hoverIndex, setHoverIndex] = useState<number>();
  useLayoutEffect(() => {
    const node = plotRef.current;
    if (!node) return undefined;
    const update = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      if (next > 0) setChartW(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const selectedIds = selectedSeriesIds ?? internalSelected;
  const visible = series.filter((item) => selectedIds.includes(item.id));
  const formatValue = valueFormat ?? lineChartValueText;
  const colorOf = (item: (typeof series)[number], index: number) => item.color || CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];
  const axisPoints = (visible[0] ?? series[0])?.points ?? [];
  const yMax = lineChartNiceMax(Math.max(0, ...visible.flatMap((item) => item.points.map((point) => point.y))));
  const plotW = chartW - LINE_CHART_PL - LINE_CHART_PR;
  const plotH = LINE_CHART_H - LINE_CHART_PT - LINE_CHART_PB;
  const isBar = variant === 'bar';
  const groupCount = axisPoints.length;
  const barCount = Math.max(visible.length, 1);
  const slot = plotW / Math.max(groupCount, 1);
  const barGap = 2;
  const barW = Math.max(4, Math.min(22, (slot * 0.64 - barGap * Math.max(barCount - 1, 0)) / barCount));
  const clusterW = visible.length * barW + barGap * Math.max(visible.length - 1, 0);
  const xAt = (index: number, count: number) => (
    count <= 1 ? LINE_CHART_PL + plotW / 2 : LINE_CHART_PL + (index / Math.max(count - 1, 1)) * plotW
  );
  const markX = (index: number) => (isBar ? LINE_CHART_PL + (index + 0.5) * slot : xAt(index, axisPoints.length));
  const yAt = (value: number) => LINE_CHART_PT + plotH - (value / yMax) * plotH;
  const yTicks = [0, 1, 2, 3, 4, 5].map((step) => (yMax / 5) * step);
  const hoverX = hoverIndex === undefined ? undefined : markX(hoverIndex);
  const hoverY = hoverIndex === undefined ? undefined : Math.min(...visible.map((item) => yAt(item.points[hoverIndex]?.y ?? 0)));
  const showHeader = Boolean(periodText) || Boolean(dimensionOptions?.length);

  const toggleSeries = (id: string) => {
    const next = selectedIds.includes(id)
      ? (selectedIds.length === 1 ? selectedIds : selectedIds.filter((item) => item !== id))
      : [...selectedIds, id];
    if (!selectedSeriesIds) setInternalSelected(next);
    onSelectedSeriesChange?.(next);
  };

  const onPlotMove = (event: ReactMouseEvent<SVGRectElement>) => {
    if (!axisPoints.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * chartW;
    let nearest = 0;
    let distance = Infinity;
    axisPoints.forEach((_, index) => {
      const next = Math.abs(markX(index) - svgX);
      if (next < distance) {
        distance = next;
        nearest = index;
      }
    });
    setHoverIndex(nearest);
  };

  return (
    <div className={isBar ? 'admin-line-chart admin-bar-chart' : 'admin-line-chart'}>
      {showHeader ? (
        <div className="admin-line-chart__header">
          <span className="admin-line-chart__period">{periodText || ''}</span>
          {dimensionOptions?.length ? (
            <AdminSelect
              className="admin-line-chart__measure"
              ariaLabel="图表维度"
              value={dimension ?? dimensionOptions[0].value}
              options={dimensionOptions}
              onChange={(next) => onDimensionChange?.(next)}
            />
          ) : null}
        </div>
      ) : null}
      <div className="admin-line-chart__plot" ref={plotRef}>
        <svg viewBox={`0 0 ${chartW} ${LINE_CHART_H}`} preserveAspectRatio="none" role="img" aria-label={isBar ? '柱状图' : '折线图'}>
          {yTicks.map((tick) => {
            const y = yAt(tick);
            return (
              <g key={tick}>
                <line className="admin-line-chart__grid" x1={LINE_CHART_PL} y1={y} x2={chartW - LINE_CHART_PR} y2={y} />
                <text className="admin-line-chart__axis" x={LINE_CHART_PL - 8} y={y + 4} textAnchor="end">{lineChartAxisText(tick)}</text>
              </g>
            );
          })}
          {lineChartLabelIndexes(axisPoints.length).map((index) => (
            <text key={`x-${axisPoints[index].x}-${index}`} className="admin-line-chart__axis" x={markX(index)} y={LINE_CHART_H - 6} textAnchor="middle">
              {axisPoints[index].x}
            </text>
          ))}
          {hoverX === undefined ? null : <line className="admin-line-chart__cross" x1={hoverX} y1={LINE_CHART_PT} x2={hoverX} y2={LINE_CHART_PT + plotH} />}
          {isBar
            ? visible.map((item, seriesIndex) => {
                const color = colorOf(item, series.indexOf(item));
                return (
                  <g key={item.id}>
                    {item.points.map((point, pointIndex) => {
                      const height = Math.max(0, LINE_CHART_PT + plotH - yAt(point.y));
                      const x = markX(pointIndex) - clusterW / 2 + seriesIndex * (barW + barGap);
                      const d = lineChartBarPath(x, yAt(point.y), barW, height);
                      return d ? <path key={`${item.id}-${point.x}-${pointIndex}`} className="admin-bar-chart__bar" d={d} fill={color} /> : null;
                    })}
                  </g>
                );
              })
            : visible.map((item) => {
                const color = colorOf(item, series.indexOf(item));
                const points = item.points.map((point, pointIndex) => `${xAt(pointIndex, item.points.length)},${yAt(point.y)}`).join(' ');
                return (
                  <g key={item.id}>
                    {points ? <polyline className="admin-line-chart__line" points={points} stroke={color} /> : null}
                    {item.points.map((point, pointIndex) => (
                      <circle
                        key={`${item.id}-${point.x}-${pointIndex}`}
                        className="admin-line-chart__dot"
                        cx={xAt(pointIndex, item.points.length)}
                        cy={yAt(point.y)}
                        r="4"
                        stroke={color}
                      />
                    ))}
                  </g>
                );
              })}
          <rect
            className="admin-line-chart__hit"
            x={LINE_CHART_PL}
            y={LINE_CHART_PT}
            width={plotW}
            height={plotH}
            onMouseMove={onPlotMove}
            onMouseLeave={() => setHoverIndex(undefined)}
          />
        </svg>
        {hoverIndex !== undefined && hoverX !== undefined && visible.length ? (
          <div
            className={`admin-line-chart__tooltip${hoverX > chartW * 0.62 ? ' is-left' : ''}`}
            style={{ left: `${(hoverX / chartW) * 100}%`, top: `${((hoverY ?? LINE_CHART_PT) / LINE_CHART_H) * 100}%` }}
          >
            <strong>{axisPoints[hoverIndex]?.x}</strong>
            {visible.map((item) => (
              <span key={item.id}>
                <i style={{ background: colorOf(item, series.indexOf(item)) }} />
                {item.name}
                <b>{formatValue(item.points[hoverIndex]?.y ?? 0)}</b>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {series.length ? (
        <div className="admin-line-chart__legend">
          {series.map((item, index) => {
            const color = colorOf(item, index);
            const selected = selectedIds.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className={`admin-line-chart__legend-item${selected ? ' is-active' : ''}`}
                onClick={() => toggleSeries(item.id)}
              >
                <i style={{ background: color, borderColor: color }} />
                {item.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AdminLineChart(props: AdminLineChartProps) {
  return <ChartView variant="line" {...props} />;
}

export function AdminBarChart(props: AdminBarChartProps) {
  return <ChartView variant="bar" {...props} />;
}

function paginationItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 6, 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', total - 5, total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

function PagerChevron({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path
        d={direction === 'prev' ? 'M7.4 2.2 3.6 6l3.8 3.8' : 'M4.6 2.2 8.4 6l-3.8 3.8'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaginationSizeSelect({
  pageSize,
  options,
  onChange,
}: {
  pageSize: number;
  options: number[];
  onChange: (pageSize: number) => void;
}) {
  return (
    <AdminSelect
      className="admin-pagination__size"
      placement="up"
      ariaLabel="每页条数"
      value={String(pageSize)}
      options={options.map((option) => ({ value: String(option), label: `${option}条/页` }))}
      onChange={(next) => onChange(Number(next))}
    />
  );
}

export function AdminPagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [10, 20, 30, 50, 100, 200],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);

  return (
    <div className="admin-pagination" aria-label="分页">
      <span className="admin-pagination__total">共 {total} 条</span>
      {onPageSizeChange ? (
        <PaginationSizeSelect
          pageSize={pageSize}
          options={pageSizeOptions}
          onChange={(nextSize) => {
            onPageSizeChange(nextSize);
            onPageChange(1);
          }}
        />
      ) : null}
      <div className="admin-pagination__pages">
        <button
          type="button"
          className="admin-pagination__btn"
          aria-label="上一页"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <PagerChevron direction="prev" />
        </button>
        {paginationItems(safePage, pageCount).map((item, index) => (
          item === 'ellipsis' ? (
            <button key={`ellipsis-${index}`} type="button" className="admin-pagination__btn is-ellipsis" disabled tabIndex={-1}>…</button>
          ) : (
            <button
              key={item}
              type="button"
              className={`admin-pagination__btn${item === safePage ? ' is-current' : ''}`}
              aria-current={item === safePage ? 'page' : undefined}
              aria-label={`第 ${item} 页`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        ))}
        <button
          type="button"
          className="admin-pagination__btn"
          aria-label="下一页"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          <PagerChevron direction="next" />
        </button>
      </div>
    </div>
  );
}

let bodyLockCount = 0;
let previousBodyOverflow = '';

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) document.body.style.overflow = previousBodyOverflow;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.hasAttribute('hidden'));
}

function useAdminDialog(
  open: boolean,
  onClose: () => void,
  closeOnEsc: boolean,
) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockBodyScroll();

    const focusTimer = window.setTimeout(() => {
      const firstFocusable = panelRef.current ? getFocusableElements(panelRef.current)[0] : null;
      (firstFocusable ?? panelRef.current)?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEsc) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = getFocusableElements(panelRef.current);
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      unlockBodyScroll();
      previousFocus?.focus();
    };
  }, [closeOnEsc, open]);

  return panelRef;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function AdminModal({
  open,
  title,
  children,
  footer,
  width = 450,
  closeOnMask = true,
  closeOnEsc = true,
  onClose,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useAdminDialog(open, onClose, closeOnEsc);
  if (!open) return null;
  const panelStyle = { '--admin-overlay-width': typeof width === 'number' ? `${width}px` : width } as CSSProperties;

  return (
    <div
      className="admin-overlay"
      onMouseDown={(event) => {
        if (closeOnMask && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : '信息弹窗'}
        tabIndex={-1}
        style={panelStyle}
      >
        {title ? (
          <div className="admin-overlay__header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="admin-overlay__close" aria-label="关闭" onClick={onClose}><CloseIcon /></button>
          </div>
        ) : (
          <button type="button" className="admin-overlay__close admin-overlay__close--floating" aria-label="关闭" onClick={onClose}><CloseIcon /></button>
        )}
        <div className="admin-overlay__body">{children}</div>
        {footer ? <div className="admin-overlay__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AdminDrawer({
  open,
  title,
  children,
  footer,
  size = 'small',
  width,
  closeOnMask = true,
  closeOnEsc = true,
  onClose,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useAdminDialog(open, onClose, closeOnEsc);
  if (!open) return null;
  const resolvedWidth = width ?? (size === 'small' ? '38vw' : '62vw');
  const panelStyle = { '--admin-overlay-width': typeof resolvedWidth === 'number' ? `${resolvedWidth}px` : resolvedWidth } as CSSProperties;

  return (
    <div
      className="admin-overlay admin-overlay--drawer"
      onMouseDown={(event) => {
        if (closeOnMask && event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={panelRef}
        className="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={panelStyle}
      >
        <div className="admin-overlay__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="admin-overlay__close" aria-label="关闭" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="admin-overlay__body">{children}</div>
        {footer ? <div className="admin-overlay__footer">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function AdminToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: AdminToast[];
  onDismiss?: (id: string) => void;
}) {
  const started = useRef(new Set<string>());

  useEffect(() => {
    if (!onDismiss) return undefined;
    toasts.forEach((toast) => {
      if (started.current.has(toast.id)) return;
      started.current.add(toast.id);
      window.setTimeout(() => {
        onDismiss(toast.id);
        started.current.delete(toast.id);
      }, 2400);
    });
    return undefined;
  }, [onDismiss, toasts]);

  return (
    <div className="admin-toast-viewport" role="region" aria-label="通知">
      {toasts.map((toast) => {
        const tone = toast.tone === 'success' ? 'success' : 'error';
        return (
          <div
            key={toast.id}
            className={`admin-toast admin-toast--${toast.tone ?? 'info'}`}
            role={tone === 'error' ? 'alert' : 'status'}
          >
            <svg className="admin-toast__icon" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="8" fill="currentColor" />
              {tone === 'success' ? (
                <path d="M4.5 8.2 7 10.6 11.5 5.6" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

