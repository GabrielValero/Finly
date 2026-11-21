import { useMemo } from 'react';
import { useUi } from '../store/ui';
import { isExcluded } from '../utils/categories';
import { resolveCategoryColor } from '../utils/categoryColor';
import { addMonths, dayOf, formatMonthLabel, MONTH_NAMES, monthOf, recentMonths, toLocalIso } from '../utils/dates';
import { donutSlices, legendPercents } from '../utils/donut';
import { reportHeadlineSegments, topCategoryInsight } from '../utils/humanVoice';
import { formatMoney } from '../utils/money';
import { expenseByCategory, expenseByTag, monthlyFlow, topSlices, totalsOf, type ReportTx } from '../utils/reports';
import { useAllCategoryRows, useRangeTagLinks, useRangeTransactions, useTags } from './useData';

const MONTHS_BACK = 6;

export function useReportsScreen() {
  const month = useUi((s) => s.selectedMonth);
  const setMonth = useUi((s) => s.setSelectedMonth);
  const fromMonth = addMonths(month, -(MONTHS_BACK - 1));
  const rows = useRangeTransactions(fromMonth, month);
  const links = useRangeTagLinks(fromMonth, month);
  const categories = useAllCategoryRows();
  const tags = useTags();
  const currentMonth = monthOf(`${dayOf(toLocalIso(new Date()))}T00:00:00`);

  return useMemo(() => {
    const txs: ReportTx[] = rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      accountCurrency: r.accountCurrency,
      amountMinor: r.amountMinor,
      rateScaled: r.rateScaled,
      categoryId: r.categoryId,
      occurredAt: r.occurredAt,
      excluded: isExcluded(r.excludeFromReports, r.parentExcludeFromReports),
    }));
    const inMonth = (m: string) => txs.filter((t) => monthOf(t.occurredAt) === m);
    const cur = inMonth(month);
    const prev = inMonth(addMonths(month, -1));
    const totals = totalsOf(cur);
    const prevTotals = totalsOf(prev);
    const net = totals.incomeUsdMinor - totals.expenseUsdMinor;
    const monthName = (m: string) => MONTH_NAMES[Number(m.slice(5, 7)) - 1]!.toLowerCase();
    const byCategory = expenseByCategory(cur, categories);
    const colorOf = new Map(categories.map((c) => [c.id, c.color]));
    const donutArcs = donutSlices(byCategory);
    const percents = legendPercents(donutArcs.map((s) => s.share));
    const arcs = donutArcs.map((s, i) => ({
      key: s.key,
      label: s.label,
      percent: percents[i]!.label,
      color: s.key === 'none' || s.key === 'others' ? null : resolveCategoryColor(colorOf.get(s.key) ?? null, s.key),
      startDeg: s.startDeg,
      endDeg: s.endDeg,
    }));

    const curIds = new Set(cur.map((t) => t.id));
    const slices = (list: ReturnType<typeof expenseByCategory>) =>
      topSlices(list, 8).map((s) => ({ key: s.key, label: s.label, amount: formatMoney(s.usdMinor, 'USD'), percent: Math.round(s.share * 100), share: s.share }));

    const flow = monthlyFlow(txs, month, MONTHS_BACK);
    const peak = Math.max(1, ...flow.flatMap((f) => [f.incomeUsdMinor, f.expenseUsdMinor]));

    return {
      monthLabel: formatMonthLabel(month),
      months: recentMonths(currentMonth, 12).map((m) => ({ value: m, label: formatMonthLabel(m) })),
      selectedMonth: month,
      setMonth,
      isEmpty: cur.length === 0,
      expense: formatMoney(totals.expenseUsdMinor, 'USD'),
      income: formatMoney(totals.incomeUsdMinor, 'USD'),
      net: `${net < 0 ? '-' : ''}${formatMoney(Math.abs(net), 'USD')}`,
      netPositive: net >= 0,
      headline: reportHeadlineSegments({ monthName: monthName(month), prevMonthName: monthName(addMonths(month, -1)), expense: formatMoney(totals.expenseUsdMinor, 'USD'), expenseMinor: totals.expenseUsdMinor, prevExpenseMinor: prevTotals.expenseUsdMinor }),
      donut: { arcs, total: formatMoney(totals.expenseUsdMinor, 'USD') },
      insight: topCategoryInsight(byCategory),
      unvalued: totals.unvalued,
      tags: slices(expenseByTag(cur, links.filter((l) => curIds.has(l.transactionId)), tags)),
      flow: flow.map((f) => ({
        month: f.month,
        label: formatMonthLabel(f.month).slice(0, 3),
        fullLabel: formatMonthLabel(f.month),
        incomeRatio: f.incomeUsdMinor / peak,
        expenseRatio: f.expenseUsdMinor / peak,
        incomeLabel: formatMoney(f.incomeUsdMinor, 'USD'),
        expenseLabel: formatMoney(f.expenseUsdMinor, 'USD'),
        selected: f.month === month,
      })),
    };
  }, [rows, links, categories, tags, month, currentMonth, setMonth]);
}
