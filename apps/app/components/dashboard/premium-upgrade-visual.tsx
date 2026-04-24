"use client";

import { ArrowUp } from "@/components/ui/icons";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

const data = [
  { week: "W1", free: 1.7, plus: 2.6 },
  { week: "W2", free: 2.5, plus: 4.1 },
  { week: "W3", free: 3.1, plus: 5.2 },
  { week: "W4", free: 3.8, plus: 6.4 },
  { week: "W5", free: 4.4, plus: 7.7 },
];

const chartConfig = {
  free: {
    label: "Free plan",
    color: "rgb(186 230 253 / 0.9)",
  },
  plus: {
    label: "Plus/Pro",
    color: "rgb(3 105 161)",
  },
} satisfies ChartConfig;

function PremiumTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number | string }>;
}) {
  if (!active || !payload?.length) return null;

  const sortedPayload = [...payload].sort((a, b) => {
    const aRank = a.dataKey === "plus" ? 0 : 1;
    const bRank = b.dataKey === "plus" ? 0 : 1;
    return aRank - bRank;
  });

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      {sortedPayload.map((item) => {
        const label = item.dataKey === "plus" ? "Plus/Pro" : "Free plan";
        return (
          <div key={String(item.dataKey)} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PremiumUpgradeVisual() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-sky-100/60 to-white p-3">
      <div className="pointer-events-none absolute -top-10 -right-8 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl sm:h-32 sm:w-32" />
      <div className="rounded-2xl border border-sky-200/80 bg-white/90 p-3 shadow-[0_16px_40px_-28px_rgba(2,132,199,0.75)] backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Interview Response Growth</p>
            <p className="text-[11px] text-slate-500 xl:hidden">AI projection</p>
            <p className="hidden text-xs text-slate-500 xl:block">Illustrative projection with AI-powered optimization</p>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 px-2.5 py-2 sm:px-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Free</p>
            <p className="text-sm font-semibold text-slate-700">Baseline</p>
          </div>
          <div className="rounded-lg border border-sky-200 bg-sky-100/60 px-2.5 py-2 sm:px-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Plus / Pro</p>
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700">
              <ArrowUp className="h-3.5 w-3.5" />
              Faster results
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-sky-100 bg-white px-2 pb-1 pt-2">
          <ChartContainer
            config={chartConfig}
            className="h-[92px] !w-full !aspect-auto !justify-start xl:h-[112px]"
          >
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="fillFree" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-free)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-free)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPlus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-plus)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--color-plus)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgb(226 232 240)" strokeDasharray="3 3" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis hide domain={[0, 8]} />
              <ChartTooltip
                content={<PremiumTooltipContent />}
                cursor={false}
              />
              <Area
                type="linear"
                dataKey="free"
                stroke="var(--color-free)"
                fill="url(#fillFree)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="linear"
                dataKey="plus"
                stroke="var(--color-plus)"
                fill="url(#fillPlus)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
