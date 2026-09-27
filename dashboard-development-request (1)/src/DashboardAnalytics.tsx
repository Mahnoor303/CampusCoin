import { useMemo, useState } from "react";
import { Activity, GitBranch, Network, Orbit, Sparkles } from "lucide-react";
import { cn } from "./utils/cn";

export interface AnalyticsTransaction {
  id: number;
  date: string;
  title: string;
  category: string;
  amount: number;
  type: "Income" | "Expense";
}

export interface AnalyticsCategory {
  id: number;
  name: string;
  type: "Income" | "Expense";
  amount: number;
}

type ChartType = "Radial Histogram" | "EWMA" | "Dendrogram" | "Radial Tree";

const charts: { name: ChartType; icon: typeof Orbit; detail: string }[] = [
  { name: "Radial Histogram", icon: Orbit, detail: "Compare spending across categories in a circular view." },
  { name: "EWMA", icon: Activity, detail: "Smooth daily spending to make emerging trends easier to spot." },
  { name: "Dendrogram", icon: GitBranch, detail: "Explore how everyday spending categories group together." },
  { name: "Radial Tree", icon: Network, detail: "Follow money from income sources to expenses." },
];

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${Math.round(value)}`;
  }
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function arcPath(cx: number, cy: number, inner: number, outer: number, startAngle: number, endAngle: number) {
  const p1 = polar(cx, cy, outer, startAngle);
  const p2 = polar(cx, cy, outer, endAngle);
  const p3 = polar(cx, cy, inner, endAngle);
  const p4 = polar(cx, cy, inner, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

function shortLabel(value: string, max = 12) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

export default function DashboardAnalytics({
  transactions,
  categories,
  period,
  currency,
  title = "Explore your money patterns",
  description = "Four interactive views, built from your student income and spending history.",
}: {
  transactions: AnalyticsTransaction[];
  categories: AnalyticsCategory[];
  period: string;
  currency: string;
  title?: string;
  description?: string;
}) {
  const [activeChart, setActiveChart] = useState<ChartType>("Radial Histogram");
  const [focusedCategory, setFocusedCategory] = useState("");
  const [alpha, setAlpha] = useState(0.35);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState("");

  const expenseCategories = categories.filter((item) => item.type === "Expense");
  const incomeCategories = categories.filter((item) => item.type === "Income");
  const activeCategory = expenseCategories.find((item) => item.name === focusedCategory) ?? expenseCategories[0];
  const activeTreeNode = selectedNode || "All student finances";

  const dailySeries = useMemo(() => {
    const expenseByDate = new Map<string, number>();
    transactions
      .filter((transaction) => transaction.type === "Expense")
      .forEach((transaction) => {
        expenseByDate.set(transaction.date, (expenseByDate.get(transaction.date) ?? 0) + transaction.amount);
      });

    const daily = [...expenseByDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([date, value]) => ({ date, value }));

    let previous = 0;
    return daily.map((item, index) => {
      const average = index === 0 ? item.value : alpha * item.value + (1 - alpha) * previous;
      previous = average;
      return { ...item, average };
    });
  }, [transactions, alpha]);
  const activePoint = hoveredPoint === null ? undefined : dailySeries[hoveredPoint];

  const chartMeta = charts.find((chart) => chart.name === activeChart) ?? charts[0];

  return (
    <section className="mt-6 rounded-[28px] border border-black/[0.045] bg-[#f5f5f5] p-4 md:mt-7 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#e1694a]"><Sparkles size={14} /></span>
            Analytics area · {period} data
          </div>
          <h2 className="text-[21px] font-semibold tracking-[-0.035em] text-neutral-900 md:text-[25px]">{title}</h2>
          <p className="mt-1 text-[11px] text-neutral-500">{description}</p>
        </div>

        <div role="tablist" aria-label="Financial analytics visualization" className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-black/[0.06] bg-white p-1 scroll-thin">
          {charts.map((chart) => {
            const Icon = chart.icon;
            const selected = activeChart === chart.name;
            return (
              <button
                key={chart.name}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setActiveChart(chart.name);
                  setHoveredPoint(null);
                }}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold transition-all",
                  selected ? "bg-black text-white shadow-sm" : "text-neutral-500 hover:bg-[#f4f4f4] hover:text-black",
                )}
              >
                <Icon size={13} /> {chart.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="min-h-[280px] rounded-[22px] border border-black/[0.045] bg-white p-3 sm:p-5">
          {activeChart === "Radial Histogram" && (
            <div className="flex h-full min-h-[248px] flex-col">
              <div className="mb-1 flex items-start justify-between gap-3">
                <div><h3 className="text-[12px] font-semibold">Category spending distribution</h3><p className="mt-1 text-[9px] text-neutral-400">Select any spoke to inspect a category.</p></div>
                <span className="rounded-full bg-[#f5f5f5] px-3 py-1.5 text-[9px] font-medium text-neutral-500">{expenseCategories.length} categories</span>
              </div>
              {expenseCategories.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-[11px] text-neutral-400">Add an expense to see the radial histogram.</div>
              ) : (
                <div className="flex flex-1 items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 380 262" className="h-[250px] w-full max-w-[560px]" role="img" aria-label="Radial histogram of expenses by category">
                    <defs>
                      <linearGradient id="spokeFill" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#e1694a" stopOpacity="0.92" />
                        <stop offset="100%" stopColor="#f0906f" stopOpacity="0.78" />
                      </linearGradient>
                      <filter id="spokeShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#e1694a" floodOpacity="0.22" />
                      </filter>
                    </defs>
                    {[44, 66, 88, 110].map((ring) => (
                      <circle key={ring} cx="190" cy="131" r={ring} fill="none" stroke={ring === 44 ? "#ececec" : "#f2f2f2"} strokeWidth="1" strokeDasharray={ring === 44 ? undefined : "3 5"} />
                    ))}
                    {expenseCategories.map((category, index) => {
                      const count = expenseCategories.length;
                      const slice = (Math.PI * 2) / count;
                      const gap = slice * 0.22;
                      const startAngle = -Math.PI / 2 + index * slice + gap / 2;
                      const endAngle = -Math.PI / 2 + (index + 1) * slice - gap / 2;
                      const maxAmount = Math.max(...expenseCategories.map((item) => item.amount), 1);
                      const ratio = Math.max(category.amount / maxAmount, 0.1);
                      const inner = 46;
                      const outer = inner + ratio * 66;
                      const isSelected = activeCategory?.name === category.name;
                      const labelAngle = -Math.PI / 2 + (index + 0.5) * slice;
                      const label = polar(190, 131, 122, labelAngle);
                      const anchor = Math.cos(labelAngle) > 0.32 ? "start" : Math.cos(labelAngle) < -0.32 ? "end" : "middle";
                      return (
                        <g key={category.id} className="cursor-pointer" onClick={() => setFocusedCategory(category.name)} onMouseEnter={() => setFocusedCategory(category.name)}>
                          <title>{category.name}: {money(category.amount, currency)} · {Math.round(ratio * 100)}%</title>
                          <path
                            d={arcPath(190, 131, inner, outer, startAngle, endAngle)}
                            fill={isSelected ? "url(#spokeFill)" : "#e4e4e4"}
                            filter={isSelected ? "url(#spokeShadow)" : undefined}
                            stroke={isSelected ? "#e1694a" : "transparent"}
                            strokeWidth="1"
                            className="transition-all duration-500"
                          />
                          <text
                            x={label.x}
                            y={label.y}
                            textAnchor={anchor}
                            dominantBaseline="middle"
                            fontSize="8.5"
                            fontWeight={isSelected ? 700 : 500}
                            fill={isSelected ? "#c85b40" : "#8a8a8a"}
                          >
                            {shortLabel(category.name, 13)}
                          </text>
                        </g>
                      );
                    })}
                    <circle cx="190" cy="131" r="40" fill="#fcfcfc" stroke="#f0f0f0" />
                    <text x="190" y="120" textAnchor="middle" fontSize="8" fill="#a3a3a3">{shortLabel(activeCategory?.name ?? "Spending", 15)}</text>
                    <text x="190" y="135" textAnchor="middle" fontSize="13" fontWeight="700" fill="#171717">{money(activeCategory?.amount ?? 0, currency)}</text>
                    <text x="190" y="148" textAnchor="middle" fontSize="7" fill="#b8b8b8">
                      {activeCategory ? `${Math.round((activeCategory.amount / Math.max(expenseCategories.reduce((total, item) => total + item.amount, 0), 1)) * 100)}% of spending` : "select a spoke"}
                    </text>
                  </svg>
                </div>
              )}
            </div>
          )}

          {activeChart === "EWMA" && (
            <div className="flex h-full min-h-[248px] flex-col">
              <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-[12px] font-semibold">Daily outflow · smoothed trend</h3><p className="mt-1 text-[9px] text-neutral-400">EWMA reduces daily noise to reveal a steadier direction.</p></div>
                <label className="flex items-center gap-2 text-[9px] font-medium text-neutral-500">Smoothing <span className="font-bold text-[#e1694a]">{alpha.toFixed(2)}</span><input aria-label="EWMA smoothing factor" type="range" min="0.1" max="0.8" step="0.05" value={alpha} onChange={(event) => setAlpha(Number(event.target.value))} className="w-20 accent-[#e1694a]" /></label>
              </div>
              {dailySeries.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-[11px] text-neutral-400">Add expenses to calculate the EWMA trend.</div>
              ) : (
                <div className="flex flex-1 flex-col justify-end pt-2">
                  <svg viewBox="0 0 520 220" className="h-[218px] w-full" role="img" aria-label="Exponentially weighted moving average chart of daily expenses">
                    <defs>
                      <linearGradient id="ewmaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e1694a" stopOpacity="0.26" />
                        <stop offset="70%" stopColor="#e1694a" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#e1694a" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const max = Math.max(...dailySeries.flatMap((point) => [point.value, point.average]), 1) * 1.22;
                      const xAt = (index: number) => (dailySeries.length === 1 ? 270 : 46 + (index / (dailySeries.length - 1)) * 444);
                      const yAt = (value: number) => 172 - (value / max) * 132;
                      const smoothPath = dailySeries
                        .map((point, index) => ({ x: xAt(index), y: yAt(point.average) }))
                        .reduce((path, point, index, list) => {
                          if (index === 0) return `M ${point.x} ${point.y}`;
                          const previous = list[index - 1];
                          const midX = (previous.x + point.x) / 2;
                          return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
                        }, "");
                      const rawPath = dailySeries
                        .map((point, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(point.value)}`)
                        .join(" ");
                      const areaPath = `${smoothPath} L ${xAt(dailySeries.length - 1)} 178 L ${xAt(0)} 178 Z`;
                      return (
                        <>
                          {[0, 1, 2, 3].map((line) => (
                            <g key={line}>
                              <line x1="40" x2="500" y1={36 + line * 44} y2={36 + line * 44} stroke="#f1f1f1" strokeWidth="1" />
                              <text x="36" y={39 + line * 44} textAnchor="end" fontSize="7" fill="#c0c0c0">{money((max * (3 - line)) / 3, currency)}</text>
                            </g>
                          ))}
                          <line x1="40" x2="500" y1="178" y2="178" stroke="#e3e3e3" strokeWidth="1" />
                          <path d={areaPath} fill="url(#ewmaFill)" className="analytics-fade" />
                          <path d={rawPath} fill="none" stroke="#d6d6d6" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
                          <path d={smoothPath} fill="none" stroke="#e1694a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="analytics-line" />
                          {dailySeries.map((point, index) => (
                            <g key={point.date} onMouseEnter={() => setHoveredPoint(index)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                              <title>{point.date}: {money(point.value, currency)} daily · {money(point.average, currency)} EWMA</title>
                              <rect x={xAt(index) - 12} y="24" width="24" height="160" fill="transparent" />
                              <circle cx={xAt(index)} cy={yAt(point.value)} r="3" fill="#c9c9c9" stroke="white" strokeWidth="1.2" />
                              <circle cx={xAt(index)} cy={yAt(point.average)} r={hoveredPoint === index ? 6.5 : 4} fill="#e1694a" stroke="white" strokeWidth="2.4" className="transition-all duration-200" />
                              {hoveredPoint === index && (
                                <line x1={xAt(index)} x2={xAt(index)} y1={yAt(point.average)} y2="178" stroke="#e1694a" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                              )}
                            </g>
                          ))}
                          <text x="46" y="196" fontSize="7.5" fill="#a3a3a3">{dailySeries[0].date.slice(5)}</text>
                          <text x="490" y="196" fontSize="7.5" fill="#a3a3a3" textAnchor="end">{dailySeries[dailySeries.length - 1].date.slice(5)}</text>
                          <text x="46" y="12" fontSize="7.5" fill="#b0b0b0">Smoothed</text>
                          <text x="96" y="12" fontSize="7.5" fill="#c4c4c4">— — Actual</text>
                        </>
                      );
                    })()}
                  </svg>
                  <div className="mt-1 flex items-center gap-4 text-[9px] text-neutral-400"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e1694a]" />EWMA trend</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d4d4d4]" />Daily expense</span><span className="ml-auto">{activePoint ? `${activePoint.date} · ${money(activePoint.average, currency)} average` : `${dailySeries.length} active days`}</span></div>
                </div>
              )}
            </div>
          )}

          {activeChart === "Dendrogram" && (
            <div className="flex h-full min-h-[248px] flex-col">
              <div className="mb-1"><h3 className="text-[12px] font-semibold">How spending categories relate</h3><p className="mt-1 text-[9px] text-neutral-400">Select a leaf to inspect its share of recorded spending.</p></div>
              <div className="flex flex-1 items-center justify-center overflow-x-auto">
                <svg viewBox="0 0 520 260" className="h-[240px] min-w-[460px] w-full max-w-[580px]" role="img" aria-label="Interactive spending dendrogram">
                  <defs>
                    <linearGradient id="dendroLink" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#e1694a" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#e1694a" stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const groups = [
                      { name: "Campus", categories: expenseCategories.filter((item) => ["education", "transport"].includes(item.name.toLowerCase())) },
                      { name: "Everyday", categories: expenseCategories.filter((item) => ["food", "shopping"].includes(item.name.toLowerCase())) },
                      { name: "Lifestyle", categories: expenseCategories.filter((item) => ["entertainment", "health"].includes(item.name.toLowerCase())) },
                    ];
                    const assigned = new Set(groups.flatMap((group) => group.categories.map((item) => item.id)));
                    const extra = expenseCategories.filter((item) => !assigned.has(item.id));
                    if (extra.length) groups.push({ name: "Other", categories: extra });
                    const populated = groups.filter((group) => group.categories.length > 0);
                    const rootX = 52;
                    const rootY = 130;
                    const groupX = 176;
                    const leafX = 322;
                    const totalExpense = expenseCategories.reduce((total, item) => total + item.amount, 0);
                    return (
                      <>
                        {[0, 1, 2].map((ring) => (
                          <line key={ring} x1={leafX + 26} x2={leafX + 26} y1="22" y2="238" stroke="#f4f4f4" strokeWidth={ring} />
                        ))}
                        {populated.map((group, groupIndex) => {
                          const groupCount = populated.length;
                          const bandHeight = 216 / groupCount;
                          const groupY = 22 + bandHeight * groupIndex + bandHeight / 2;
                          const leafGap = Math.min(26, (bandHeight - 14) / Math.max(group.categories.length - 1, 1));
                          const firstLeafY = groupY - ((group.categories.length - 1) * leafGap) / 2;
                          const groupTotal = group.categories.reduce((total, item) => total + item.amount, 0);
                          return (
                            <g key={group.name}>
                              <path d={`M ${rootX} ${rootY} C ${(rootX + groupX) / 2} ${rootY}, ${(rootX + groupX) / 2} ${groupY}, ${groupX - 10} ${groupY}`} fill="none" stroke="url(#dendroLink)" strokeWidth="2.2" strokeLinecap="round" />
                              <circle cx={groupX - 10} cy={groupY} r="5.5" fill="#1c1c1c" stroke="white" strokeWidth="2" />
                              <text x={groupX + 2} y={groupY - 9} fontSize="8" fontWeight="700" fill="#3f3f3f">{group.name.toUpperCase()}</text>
                              <text x={groupX + 2} y={groupY + 1} fontSize="7" fill="#a8a8a8">{money(groupTotal, currency)}</text>
                              {group.categories.map((category, itemIndex) => {
                                const leafY = firstLeafY + itemIndex * leafGap;
                                const selected = selectedNode === category.name;
                                const share = totalExpense > 0 ? Math.round((category.amount / totalExpense) * 100) : 0;
                                const barWidth = Math.max(share * 1.4, selected ? 26 : 4);
                                return (
                                  <g key={category.id} className="cursor-pointer" onMouseEnter={() => setSelectedNode(category.name)} onClick={() => setSelectedNode(category.name)}>
                                    <title>{category.name}: {money(category.amount, currency)} · {share}% of spending</title>
                                    <path d={`M ${groupX - 10} ${groupY} C ${groupX + 44} ${groupY}, ${groupX + 48} ${leafY}, ${leafX - 12} ${leafY}`} fill="none" stroke={selected ? "#e1694a" : "#e6e6e6"} strokeWidth={selected ? 2.4 : 1.4} strokeLinecap="round" className="transition-all duration-300" />
                                    <circle cx={leafX - 12} cy={leafY} r={selected ? 5.5 : 4} fill={selected ? "#e1694a" : "#c6c6c6"} stroke="white" strokeWidth="1.6" className="transition-all duration-300" />
                                    <text x={leafX + 4} y={leafY - 1} fontSize="9" fontWeight={selected ? 700 : 500} fill={selected ? "#c85b40" : "#5f5f5f"}>{shortLabel(category.name, 16)}</text>
                                    <text x={leafX + 4} y={leafY + 8} fontSize="7" fill="#a8a8a8">{money(category.amount, currency)} · {share}%</text>
                                    <rect x="478" y={leafY - 6} width="34" height="4" rx="2" fill="#f0f0f0" />
                                    <rect x="478" y={leafY - 6} width={barWidth > 34 ? 34 : barWidth} height="4" rx="2" fill={selected ? "#e1694a" : "#d0d0d0"} className="transition-all duration-500" />
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })}
                        <circle cx={rootX} cy={rootY} r="11" fill="#e1694a" />
                        <circle cx={rootX} cy={rootY} r="4.5" fill="white" />
                        <text x={rootX} y={rootY + 26} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#8a8a8a">SPENDING</text>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {activeChart === "Radial Tree" && (
            <div className="flex h-full min-h-[248px] flex-col">
              <div className="mb-1"><h3 className="text-[12px] font-semibold">Money flow by category</h3><p className="mt-1 text-[9px] text-neutral-400">Choose a node to focus on an income or expense category.</p></div>
              <div className="flex flex-1 items-center justify-center overflow-hidden">
                <svg viewBox="0 0 460 264" className="h-[248px] w-full max-w-[560px]" role="img" aria-label="Interactive radial tree of student income and expenses">
                  <defs>
                    <linearGradient id="treeIncome" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2c2c2c" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#2c2c2c" stopOpacity="0.12" />
                    </linearGradient>
                    <linearGradient id="treeExpense" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#e1694a" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#e1694a" stopOpacity="0.14" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const groups = [
                      { name: "Income", color: "#1c1c1c", gradient: "treeIncome", rows: incomeCategories, up: true },
                      { name: "Expenses", color: "#e1694a", gradient: "treeExpense", rows: expenseCategories, up: false },
                    ];
                    const cx = 230;
                    const cy = 130;
                    const rootRadius = 38;
                    const parentRadius = 74;
                    const leafRadius = 116;
                    const totalIncome = Math.max(incomeCategories.reduce((total, item) => total + item.amount, 0), 1);
                    const totalExpense = Math.max(expenseCategories.reduce((total, item) => total + item.amount, 0), 1);
                    return (
                      <>
                        {[parentRadius, leafRadius].map((ring) => (
                          <circle key={ring} cx={cx} cy={cy} r={ring} fill="none" stroke="#f3f3f3" strokeWidth="1" strokeDasharray="3 6" />
                        ))}
                        {groups.map((group) => {
                          const groupIndex = group.up ? 0 : 1;
                          const angle = group.up ? -Math.PI / 2 : Math.PI / 2;
                          const parent = polar(cx, cy, parentRadius, angle);
                          const leaves = group.rows;
                          const span = Math.min(Math.PI * 0.92, 0.5 + leaves.length * 0.19);
                          const start = angle - span / 2;
                          const arcR = parentRadius - 11;
                          const arcStart = start - 0.09;
                          const arcEnd = start + span + 0.09;
                          const arcFrom = polar(cx, cy, arcR, arcStart);
                          const arcTo = polar(cx, cy, arcR, arcEnd);
                          const groupTotal = leaves.reduce((total, item) => total + item.amount, 0);
                          return (
                            <g key={group.name}>
                              <path
                                d={`M ${arcFrom.x} ${arcFrom.y} A ${arcR} ${arcR} 0 ${span + 0.18 > Math.PI ? 1 : 0} ${group.up ? 0 : 1} ${arcTo.x} ${arcTo.y}`}
                                fill="none"
                                stroke={group.color}
                                strokeOpacity="0.16"
                                strokeWidth="9"
                                strokeLinecap="round"
                              />
                              <path
                                d={`M ${polar(cx, cy, parentRadius - 4, start).x} ${polar(cx, cy, parentRadius - 4, start).y} A ${parentRadius - 4} ${parentRadius - 4} 0 0 ${group.up ? 0 : 1} ${polar(cx, cy, parentRadius - 4, start + span).x} ${polar(cx, cy, parentRadius - 4, start + span).y}`}
                                fill="none"
                                stroke="transparent"
                              />
                              <line x1={cx} y1={cy} x2={parent.x} y2={parent.y} stroke={`url(#${group.gradient})`} strokeWidth="3" strokeLinecap="round" />
                              <circle cx={parent.x} cy={parent.y} r="8.5" fill={group.color} stroke="white" strokeWidth="2.5" />
                              <text x={parent.x + (group.up ? 16 : 16)} y={parent.y + (group.up ? -6 : 6)} fontSize="9.5" fontWeight="700" fill={group.color}>{group.name}</text>
                              <text x={parent.x + 16} y={parent.y + (group.up ? 5 : 17)} fontSize="7.5" fill="#a8a8a8">
                                {money(groupTotal, currency)} · {groupTotal === totalIncome ? "100%" : Math.round((groupTotal / (groupIndex === 0 ? totalIncome : totalExpense)) * 100) + "%"}
                              </text>
                              {leaves.map((row, index) => {
                                const leafAngle = leaves.length <= 1 ? angle : start + (index / (leaves.length - 1)) * span;
                                const point = polar(cx, cy, leafRadius, leafAngle);
                                const anchor = Math.cos(leafAngle) > 0.28 ? "start" : Math.cos(leafAngle) < -0.28 ? "end" : "middle";
                                const labelX = point.x + Math.cos(leafAngle) * 11;
                                const labelY = point.y + Math.sin(leafAngle) * 11;
                                const selected = selectedNode === row.name;
                                return (
                                  <g key={row.id} className="cursor-pointer" onMouseEnter={() => setSelectedNode(row.name)} onClick={() => setSelectedNode(row.name)}>
                                    <title>{row.name}: {money(row.amount, currency)}</title>
                                    <path
                                      d={`M ${parent.x} ${parent.y} C ${(parent.x + point.x) / 2} ${parent.y}, ${(parent.x + point.x) / 2} ${point.y}, ${point.x} ${point.y}`}
                                      fill="none"
                                      stroke={selected ? "#e1694a" : group.up ? "#dcdcdc" : "#e9dedb"}
                                      strokeWidth={selected ? 2.4 : 1.5}
                                      strokeLinecap="round"
                                      className="transition-all duration-300"
                                    />
                                    <circle cx={point.x} cy={point.y} r={selected ? 6 : 4.5} fill={selected ? "#e1694a" : group.color} stroke="white" strokeWidth="2" className="transition-all duration-300" />
                                    <text x={labelX} y={labelY - 2} textAnchor={anchor} dominantBaseline="middle" fontSize="8.5" fontWeight={selected ? 700 : 500} fill={selected ? "#c85b40" : "#6b6b6b"}>{shortLabel(row.name, 14)}</text>
                                    <text x={labelX} y={labelY + 8} textAnchor={anchor} dominantBaseline="middle" fontSize="7" fill="#b0b0b0">{money(row.amount, currency)}</text>
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })}
                        <circle cx={cx} cy={cy} r={rootRadius} fill="#fbfbfb" stroke="#ececec" strokeWidth="1.5" />
                        <circle cx={cx} cy={cy} r={rootRadius - 6} fill="none" stroke="#f5f5f5" />
                        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="7" fill="#a3a3a3">STUDENT</text>
                        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#222">MONEY</text>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col justify-between rounded-[22px] bg-[#151515] p-5 text-white">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e1694a]" /> Live selection
            </div>
            <h3 className="mt-3 text-[19px] font-semibold tracking-tight">{activeChart}</h3>
            <p className="mt-2 text-[10px] leading-relaxed text-white/50">{chartMeta.detail}</p>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="text-[9px] uppercase tracking-[0.12em] text-white/35">Current focus</div>
            <div className="mt-1 text-[14px] font-semibold text-[#f1eee9]">
              {activeChart === "Radial Histogram" ? activeCategory?.name ?? "No categories" : activeChart === "EWMA" ? "Daily expense trend" : activeTreeNode}
            </div>
            <div className="mt-1 text-[10px] text-white/45">
              {activeChart === "Radial Histogram"
                ? `${expenseCategories.length} categories · ${money(expenseCategories.reduce((total, item) => total + item.amount, 0), currency)} total`
                : activeChart === "EWMA"
                  ? `${dailySeries.length} dates · smoothing ${alpha.toFixed(2)}`
                  : `${money(incomeCategories.reduce((total, item) => total + item.amount, 0), currency)} in · ${money(expenseCategories.reduce((total, item) => total + item.amount, 0), currency)} out`}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2.5 text-[9px]">
              <span className="text-white/40">Data range</span>
              <span className="font-semibold text-white/75">{period}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}