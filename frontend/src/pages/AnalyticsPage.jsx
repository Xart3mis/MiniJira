import { useTasks } from '../hooks/useTasks';
import { useTeams } from '../hooks/useTeams';
import { useUsers } from '../hooks/useUsers';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import ActivityChart from '../components/dashboard/ActivityChart';
import { Skeleton } from '../components/ui/Skeleton';
import { STATUSES, STATUS_LABELS } from '../lib/constants';

const STATUS_PIE_COLORS = {
  ToDo: 'rgba(209,209,214,0.5)',
  InProgress: '#bf6d75',
  InReview: '#9c8191',
  Done: '#368c8a',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-overlay border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs shadow-xl">
      <p style={{ color: payload[0].payload.fill ?? '#d1d1d6' }}>
        {payload[0].name}: <span className="font-mono font-medium">{payload[0].value}</span>
      </p>
    </div>
  );
};

export default function AnalyticsPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: users = [] } = useUsers();

  const statusData = STATUSES.map((s) => ({
    name: STATUS_LABELS[s],
    value: tasks.filter((t) => t.status === s).length,
    fill: STATUS_PIE_COLORS[s],
  })).filter((d) => d.value > 0);

  const priorityData = ['High', 'Medium', 'Low'].map((p) => ({
    priority: p,
    count: tasks.filter((t) => t.priority === p).length,
  }));

  const teamData = teams.map((team) => {
    const tt = tasks.filter((t) => t.teamId === team.teamId);
    return {
      name: team.name,
      open: tt.filter((t) => t.status !== 'Done').length,
      done: tt.filter((t) => t.status === 'Done').length,
    };
  }).filter((t) => t.open + t.done > 0);

  if (isLoading) {
    return (
      <div className="px-6 py-6 max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-[1100px] mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-brand-silver">Analytics</h1>
        <p className="text-sm text-brand-silver/35 mt-0.5">
          {tasks.length} tasks across {teams.length} teams
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-4">
            Task activity — 14 days
          </h2>
          <ActivityChart tasks={tasks} />
        </section>

        <section>
          <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-4">
            Status distribution
          </h2>
          {statusData.length === 0 ? (
            <p className="text-xs text-brand-silver/25 py-12 text-center">No tasks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-brand-silver/50">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section>
          <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-4">
            Priority breakdown
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priorityData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(209,209,214,0.06)" vertical={false} />
              <XAxis
                dataKey="priority"
                tick={{ fill: 'rgba(209,209,214,0.65)', fontSize: 11, fontFamily: 'DM Sans' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(209,209,214,0.55)', fontSize: 10, fontFamily: 'DM Mono' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(209,209,214,0.04)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                <Cell fill="#bf6d75" />
                <Cell fill="rgba(209,209,214,0.35)" />
                <Cell fill="#368c8a" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {teamData.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-brand-silver/40 uppercase tracking-widest mb-4">
              Team task load
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={teamData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  type="number"
                  tick={{ fill: 'rgba(209,209,214,0.55)', fontSize: 10, fontFamily: 'DM Mono' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'rgba(209,209,214,0.45)', fontSize: 11, fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(209,209,214,0.04)' }} />
                <Bar dataKey="open" name="Open" stackId="a" fill="#bf6d75" />
                <Bar dataKey="done" name="Done" stackId="a" fill="#368c8a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}
      </div>
    </div>
  );
}
