import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SavedChartBundle } from '../types/savedGraphData';

const CHART_MARGIN = { top: 8, right: 16, left: 0, bottom: 0 };

interface SavedChartsProps {
  bundle: SavedChartBundle;
}

export function SavedCharts({ bundle }: SavedChartsProps) {
  return (
    <div className="charts-grid">
      <ChartPanel title="Delay Cost for Repeatable Value" className="chart-wide">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={bundle.delayCostRepeatable} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="turn"
              domain={[1, 8]}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
              label={{ value: 'Turn', position: 'insideBottom', offset: -2 }}
            />
            <YAxis label={{ value: 'Cumulative recurring points', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="Achieved Value"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.35}
              strokeWidth={2}
              dot
            />
            <Area
              type="monotone"
              dataKey="Possible Value"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Cumulative Value">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={bundle.cumulativeValue} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="turn" label={{ value: 'Turn', position: 'insideBottom', offset: -2 }} />
            <YAxis label={{ value: 'Points', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type="monotone" dataKey="cumulative" stroke="var(--accent)" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Cumulative Flow Diagram">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={bundle.cumulativeFlow} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="turn" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="Completed"
              stackId="status"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.75}
            />
            <Area
              type="monotone"
              dataKey="In progress"
              stackId="status"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.75}
            />
            <Area
              type="monotone"
              dataKey="Not started"
              stackId="status"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.75}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Lead Time Histogram">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bundle.leadTimeHistogram} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="leadTime"
              allowDecimals={false}
              label={{ value: 'Lead time (turns)', position: 'insideBottom', offset: -2 }}
            />
            <YAxis
              allowDecimals={false}
              label={{ value: 'Completed cards', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Completed cards']}
              labelFormatter={(label) =>
                `Lead time: ${label} turn${Number(label) === 1 ? '' : 's'}`
              }
            />
            <Bar dataKey="count" fill="var(--accent)" name="Completed cards" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Delivery Risk Profile">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={bundle.deliveryRisk} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="turn"
              domain={[1, 8]}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
              allowDecimals={false}
              label={{ value: 'Turn', position: 'insideBottom', offset: -2 }}
            />
            <YAxis label={{ value: 'Value at risk', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value: number) => [value, 'Value at risk']}
              labelFormatter={(label) => `Turn ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Value at risk"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Score breakdown (cumulative)" className="chart-wide">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={bundle.scoreBreakdown} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="turn" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Completion points" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Recurring points" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Penalties" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel chart-panel ${className ?? ''}`}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}
