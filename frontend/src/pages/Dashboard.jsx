import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../state/AuthContext.jsx';

function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const isManager = useMemo(() => user?.role === 'Manager' || user?.role === 'Admin', [user]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (isManager && teamFilter) {
          params.teamId = teamFilter;
        }
        const response = await api.get('/api/v1/tasks', { params });
        setTasks(response.data?.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [isManager, teamFilter]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Welcome back, {user?.name}</h1>
          <p className="subtitle">
            Role: {user?.role} {user?.teamId ? `• Team: ${user.teamId}` : ''}
          </p>
        </div>
        <button type="button" className="secondary" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="card">
        <div className="section-header">
          <h2>Team Tasks</h2>
          {isManager && (
            <label className="field inline">
              <span>Filter by team</span>
              <input
                type="text"
                placeholder="team-frontend"
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
              />
            </label>
          )}
        </div>

        {loading && <p>Loading tasks…</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && tasks.length === 0 && (
          <p className="empty">No tasks found for your team.</p>
        )}

        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.taskId} className="task">
              <div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <div className="meta">
                <span>Status: {task.status}</span>
                <span>Priority: {task.priority}</span>
                {task.teamId && <span>Team: {task.teamId}</span>}
                {task.assigneeId && <span>Assignee: {task.assigneeId}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Dashboard;
