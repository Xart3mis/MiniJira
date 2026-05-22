import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash, PencilSimple, Check } from '@phosphor-icons/react';
import { useTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { Select } from '../ui/Select';
import Avatar from '../ui/Avatar';
import { SkeletonText } from '../ui/Skeleton';
import CommentSection from '../comments/CommentSection';
import ActivityLog from './ActivityLog';
import AttachmentGallery from '../upload/AttachmentGallery';
import FileUpload from '../upload/FileUpload';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { formatDate, cn } from '../../lib/utils';
import { STATUSES, STATUS_LABELS, PRIORITIES } from '../../lib/constants';
import Button from '../ui/Button';

const TABS = ['Details', 'Comments', 'Activity'];

export default function TaskPanel() {
  const { selectedTaskId, closeTaskPanel } = useUiStore();
  const { data: task, isLoading } = useTask(selectedTaskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { user } = useAuthStore();
  const isManager = user?.role === 'Manager';

  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useProjects();

  const [tab, setTab] = useState('Details');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSaveTitle = () => {
    if (titleDraft.trim() && titleDraft !== task.title) {
      updateTask.mutate({ id: task.taskId, data: { title: titleDraft.trim() } });
    }
    setEditingTitle(false);
  };

  const handleDelete = () => {
    deleteTask.mutate(task.taskId, {
      onSuccess: closeTaskPanel,
    });
  };

  const handleField = (field, value) => {
    updateTask.mutate({ id: task.taskId, data: { [field]: value } });
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed right-0 top-0 h-full w-[480px] max-w-full z-40 flex flex-col"
      style={{ background: '#131420', borderLeft: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-2">
          {task && <StatusBadge status={task.status} />}
          {task && <PriorityBadge priority={task.priority} />}
        </div>
        <div className="flex items-center gap-1">
          {isManager && task && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-rose hover:bg-[var(--accent-rose-muted)] transition-colors"
              aria-label="Delete task"
            >
              <Trash size={15} />
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-brand-silver/40">Delete?</span>
              <Button
                variant="danger"
                size="sm"
                loading={deleteTask.isPending}
                onClick={handleDelete}
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </Button>
            </div>
          )}
          <button
            onClick={closeTaskPanel}
            className="w-7 h-7 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-silver/60 hover:bg-brand-elevated transition-colors"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-5 py-5 space-y-4">
            <SkeletonText lines={1} />
            <SkeletonText lines={3} />
          </div>
        ) : !task ? (
          <div className="px-5 py-8 text-sm text-brand-silver/30 text-center">Task not found</div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
              {editingTitle ? (
                <div className="flex items-start gap-2">
                  <textarea
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveTitle(); }
                      if (e.key === 'Escape') setEditingTitle(false);
                    }}
                    rows={2}
                    className="flex-1 text-base font-medium text-brand-silver bg-brand-elevated rounded-md px-2 py-1.5 resize-none border border-brand-rose/40 focus:outline-none focus:ring-1 focus:ring-brand-rose/30"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="w-7 h-7 flex items-center justify-center rounded bg-brand-teal text-[#e8f0f0] mt-0.5 shrink-0"
                  >
                    <Check size={13} />
                  </button>
                </div>
              ) : (
                <div className="group flex items-start gap-2">
                  <h2 className="text-base font-medium text-brand-silver leading-snug flex-1">
                    {task.title}
                  </h2>
                  {isManager && (
                    <button
                      onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                      className="w-6 h-6 flex items-center justify-center rounded text-brand-silver/0 group-hover:text-brand-silver/30 hover:bg-brand-elevated transition-colors shrink-0 mt-0.5"
                      aria-label="Edit title"
                    >
                      <PencilSimple size={13} />
                    </button>
                  )}
                </div>
              )}

              {task.description && (
                <p className="text-sm text-brand-silver/45 mt-2 leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>

            <div className="px-5 py-3 border-b border-[var(--border-subtle)] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Status"
                  value={task.status}
                  onValueChange={(v) => handleField('status', v)}
                  options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                  disabled={!isManager && task.assigneeId !== user?.userId}
                />
                <Select
                  label="Priority"
                  value={task.priority}
                  onValueChange={(v) => handleField('priority', v)}
                  options={PRIORITIES.map((p) => ({ value: p, label: p }))}
                  disabled={!isManager}
                />
              </div>

              {isManager && (
                <Select
                  label="Assignee"
                  value={task.assigneeId ?? ''}
                  onValueChange={(v) => handleField('assigneeId', v)}
                  placeholder="Unassigned"
                  options={users.map((u) => ({ value: u.userId, label: u.name || u.email }))}
                />
              )}

              {!isManager && task.assigneeName && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-silver/40 uppercase tracking-wide">Assignee</span>
                  <Avatar name={task.assigneeName} size="xs" />
                  <span className="text-xs text-brand-silver/60">{task.assigneeName}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-silver/40 uppercase tracking-wide">Deadline</span>
                <span className="text-xs font-mono text-brand-silver/50">
                  {formatDate(task.deadline) || 'None'}
                </span>
              </div>

              {projects.length > 0 && (
                <Select
                  label="Project"
                  value={task.projectId ?? ''}
                  onValueChange={(v) => handleField('projectId', v)}
                  placeholder="No project"
                  options={projects.map((p) => ({ value: p.projectId, label: p.title }))}
                  disabled={!isManager}
                />
              )}
            </div>

            {task.imageUrl && (
              <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
                <AttachmentGallery imageUrl={task.imageUrl} taskId={task.taskId} />
              </div>
            )}

            {isManager && (
              <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
                <FileUpload taskId={task.taskId} currentImageUrl={task.imageUrl} />
              </div>
            )}

            <div className="flex border-b border-[var(--border-subtle)]">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 py-2.5 text-xs font-medium transition-colors duration-150',
                    tab === t
                      ? 'text-brand-silver border-b-2 border-brand-rose'
                      : 'text-brand-silver/35 hover:text-brand-silver/60'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="px-5 py-4">
              {tab === 'Comments' && <CommentSection taskId={task.taskId} />}
              {tab === 'Activity' && <ActivityLog taskId={task.taskId} />}
              {tab === 'Details' && (
                <div className="space-y-2">
                  <DetailRow label="Task ID" value={task.taskId?.slice(0, 8)} mono />
                  <DetailRow label="Team" value={task.teamId} />
                  <DetailRow label="Created" value={formatDate(task.createdAt)} mono />
                  <DetailRow label="Updated" value={formatDate(task.updatedAt)} mono />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
      <span className="text-xs text-brand-silver/35 uppercase tracking-wide">{label}</span>
      <span className={cn('text-xs text-brand-silver/55', mono && 'font-mono')}>{value}</span>
    </div>
  );
}
