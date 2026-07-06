import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { TrendingUp, Eye, Download, ArrowRight, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, Cell,
} from "recharts";

const shortName = (n) => {
  if (!n) return "";
  const s = n
    .replace(/Programming for Problem Solving Laboratory/i, "PPS Lab")
    .replace(/Programming for Problem Solving/i, "PPS")
    .replace(/Basics of Mechanical Engineering/i, "Mechanical")
    .replace(/Basics of Electrical Engineering/i, "Electrical")
    .replace(/Basic Electronics Lab/i, "Electronics Lab")
    .replace(/Basic Electronics/i, "Electronics")
    .replace(/Biological Science for Engineers/i, "Biology")
    .replace(/Environmental Science/i, "Env. Science")
    .replace(/Engineering Graphics/i, "Eng. Graphics")
    .replace(/Workshop Practice/i, "Workshop")
    .replace(/Communication Skill-I/i, "Communication")
    .replace(/Electrical Engineering Lab/i, "Electrical Lab");
  return s.length > 16 ? s.slice(0, 15) + "…" : s;
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card-glass px-4 py-3 text-xs" style={{ minWidth: 180 }}>
      <div className="font-display text-sm text-white font-semibold mb-1">{d.name}</div>
      <div className="text-white/60 font-mono">Sem {d.semester}{d.semester === 1 ? " (C)" : " (P)"}</div>
      <div className="mt-2 flex items-center gap-2 text-[#00E5D4]">
        <Eye className="w-3 h-3" /> {d.views} views
      </div>
      <div className="flex items-center gap-2 text-[#00B8FF]">
        <Download className="w-3 h-3" /> {d.downloads} downloads
      </div>
    </div>
  );
}

export default function TrendingChart() {
  const [data, setData] = useState([]);
  const [tick, setTick] = useState(0);

  const load = () => {
    api.get("/analytics/trending?limit=8").then(({ data }) => {
      setData(data.trending || []);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(() => {
      load();
      setTick((n) => n + 1);
    }, 8000); // live refresh every 8s
    return () => clearInterval(t);
  }, []);

  const chartData = data.map((d) => ({ ...d, shortName: shortName(d.name) }));
  const total = data.reduce((a, d) => a + (d.views + d.downloads), 0);

  return (
    <section className="relative px-6 py-16 md:py-24" data-testid="trending-section">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="chip mb-3">
              <span className="relative inline-flex w-2 h-2 mr-1">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#00E5D4] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5D4]" />
              </span>
              Live · Subject Demand
            </div>
            <h2 className="section-title text-3xl md:text-5xl font-bold">
              What BITians are <span className="text-[#00E5D4]">reading right now</span>
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#B0B8C5] max-w-2xl">
              Live tracker of the most-viewed & most-downloaded subjects across BITVERSE.
              Updates every few seconds.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <div className="text-xs font-mono uppercase tracking-widest text-white/50">Total activity</div>
              <div className="font-display text-2xl md:text-3xl font-bold neon-text tabular-nums">
                {total.toLocaleString()}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#00E5D4]/10 border border-[#00E5D4]/40 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#00E5D4] animate-pulse" />
            </div>
          </div>
        </div>

        <div className="card-glass p-4 md:p-8" data-testid="trending-chart-card">
          <div className="w-full" style={{ height: 360, minHeight: 360, minWidth: 320 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={360}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 55 }} key={tick}>
                <defs>
                  <linearGradient id="bar-cyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5D4" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#00B8FF" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#B0B8C5"
                  tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={70}
                  tickLine={false}
                />
                <YAxis
                  stroke="#B0B8C5"
                  tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,229,212,0.05)" }} />
                <Bar
                  dataKey="score"
                  fill="url(#bar-cyan)"
                  radius={[10, 10, 0, 0]}
                  isAnimationActive
                  animationDuration={900}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.slice(0, 4).map((d, i) => (
              <Link
                key={d.subject_id}
                to={`/notes/subject/${d.subject_id}`}
                className="file-row"
                data-testid={`trending-item-${i}`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#00E5D4]/10 border border-[#00E5D4]/30 flex items-center justify-center shrink-0 font-mono text-[#00E5D4] text-sm">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm text-white font-medium truncate">{d.name}</div>
                  <div className="text-[10px] font-mono text-white/50 mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{d.views}</span>
                    <span className="flex items-center gap-1"><Download className="w-2.5 h-2.5" />{d.downloads}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
