"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ActivityDatum = {
  day: string;
  posts: number;
  comments: number;
  signups: number;
};

export function ActivityChart({ data }: { data: ActivityDatum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              fontSize: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-raised)",
              color: "var(--fg)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="posts" stroke="var(--chart-1)" fill="url(#gPosts)" strokeWidth={2} />
          <Area
            type="monotone"
            dataKey="comments"
            stroke="var(--chart-2)"
            fill="url(#gComments)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="signups"
            stroke="var(--chart-3)"
            fill="url(#gSignups)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
