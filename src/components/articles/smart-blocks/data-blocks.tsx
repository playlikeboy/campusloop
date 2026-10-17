"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type ChartBlock, type TableBlock, toNumber } from "@/lib/articles/smart-blocks";
import { BlockFrame, ToggleChip } from "./block-frame";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];

function ChartCanvas({ block, type }: { block: ChartBlock; type: ChartBlock["chartType"] }) {
  const data = block.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const s of block.series) row[s.name] = s.values[i];
    return row;
  });
  const fmt = (v: number) => `${v.toLocaleString("en-IN")}${block.unit ? ` ${block.unit}` : ""}`;
  const axis = { stroke: "var(--muted-foreground)", fontSize: 12, tickLine: false, axisLine: false } as const;
  const tooltip = (
    <Tooltip
      formatter={(v) => fmt(Number(v))}
      contentStyle={{ background: "var(--popover)", border: "none", borderRadius: 12, boxShadow: "0 4px 16px rgb(0 0 0 / 0.12)", color: "var(--popover-foreground)" }}
      cursor={{ fill: "var(--muted)", opacity: 0.4 }}
    />
  );
  const multi = block.series.length > 1;

  if (type === "pie") {
    const s = block.series[0];
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey={s.name} nameKey="label" innerRadius={60} outerRadius={105} paddingAngle={2} stroke="none">
            {data.map((d, i) => (
              <Cell key={String(d.label)} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          {tooltip}
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  const Chart = type === "line" ? LineChart : type === "area" ? AreaChart : BarChart;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <Chart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
        <YAxis {...axis} width={56} tickFormatter={(v) => Number(v).toLocaleString("en-IN")} />
        {tooltip}
        {multi && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {block.series.map((s, i) =>
          type === "line" ? (
            <Line key={s.name} dataKey={s.name} stroke={COLORS[i]} strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
          ) : type === "area" ? (
            <Area key={s.name} dataKey={s.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.18} strokeWidth={2} type="monotone" />
          ) : (
            <Bar key={s.name} dataKey={s.name} fill={COLORS[i]} radius={[6, 6, 0, 0]} maxBarSize={48} />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const na = toNumber(a[sort.col] ?? "");
      const nb = toNumber(b[sort.col] ?? "");
      const cmp = na !== null && nb !== null ? na - nb : (a[sort.col] ?? "").localeCompare(b[sort.col] ?? "");
      return cmp * sort.dir;
    });
  }, [rows, sort]);

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => {
              const active = sort?.col === i;
              const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
              return (
                <th key={h + i} scope="col" className="px-1 pb-2 text-left" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button
                    type="button"
                    onClick={() => setSort((s) => (s?.col === i ? (s.dir === 1 ? { col: i, dir: -1 } : null) : { col: i, dir: 1 }))}
                    className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                  >
                    {h}
                    <Icon className="size-3" aria-hidden />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, ri) => (
            <tr key={ri} className="border-t border-border/50">
              {r.map((c, ci) => (
                <td key={ci} className={`px-2 py-2 ${ci === 0 ? "font-medium text-foreground" : "text-muted-foreground"} ${toNumber(c) !== null ? "tabular-nums" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartBlockView({ block, raw }: { block: ChartBlock; raw: string }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [type, setType] = useState(block.chartType);
  const headers = ["", ...block.series.map((s) => s.name)];
  const rows = block.labels.map((l, i) => [l, ...block.series.map((s) => s.values[i].toLocaleString("en-IN"))]);
  return (
    <BlockFrame title={block.title} source={block.source} raw={raw} type="chart">
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Chart view">
        <ToggleChip active={view === "chart"} onClick={() => setView("chart")}>Chart</ToggleChip>
        <ToggleChip active={view === "table"} onClick={() => setView("table")}>Data</ToggleChip>
        {view === "chart" &&
          (["bar", "line", "area", ...(block.series.length === 1 ? (["pie"] as const) : [])] as const).map((t) => (
            <ToggleChip key={t} active={type === t} onClick={() => setType(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </ToggleChip>
          ))}
      </div>
      {view === "chart" ? <ChartCanvas block={block} type={type} /> : <DataTable headers={headers} rows={rows} />}
    </BlockFrame>
  );
}

export function TableBlockView({ block, raw }: { block: TableBlock; raw: string }) {
  const [view, setView] = useState<"table" | "chart">("table");
  // Chartable when every non-label column that has numbers is fully numeric.
  const numericCols = block.headers
    .map((_, i) => i)
    .filter((i) => i > 0 && block.rows.every((r) => toNumber(r[i] ?? "") !== null));
  const chart: ChartBlock | null =
    numericCols.length > 0 && block.rows.length >= 2
      ? {
          kind: "chart",
          chartType: "bar",
          labels: block.rows.map((r) => r[0]),
          series: numericCols.slice(0, 6).map((i) => ({ name: block.headers[i], values: block.rows.map((r) => toNumber(r[i]) as number) })),
        }
      : null;
  return (
    <BlockFrame
      title={block.title}
      source={block.source}
      raw={raw}
      type="table"
      actions={
        chart ? (
          <div className="flex gap-1.5" role="group" aria-label="Table view">
            <ToggleChip active={view === "table"} onClick={() => setView("table")}>Table</ToggleChip>
            <ToggleChip active={view === "chart"} onClick={() => setView("chart")}>Chart</ToggleChip>
          </div>
        ) : undefined
      }
    >
      {view === "chart" && chart ? <ChartCanvas block={chart} type="bar" /> : <DataTable headers={block.headers} rows={block.rows} />}
    </BlockFrame>
  );
}
