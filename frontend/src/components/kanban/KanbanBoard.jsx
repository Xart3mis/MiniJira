import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { STATUSES } from '../../lib/constants';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { useUpdateTask } from '../../hooks/useTasks';
import { useQueryClient } from '@tanstack/react-query';

export default function KanbanBoard({ tasks = [], isLoading, filters }) {
  const [activeTask, setActiveTask] = useState(null);
  const updateTask = useUpdateTask();
  const qc = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  const findTaskColumnByTaskId = useCallback(
    (taskId) => {
      for (const status of STATUSES) {
        if (tasksByStatus[status].some((t) => t.taskId === taskId)) return status;
      }
      return null;
    },
    [tasks]
  );

  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => t.taskId === active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const fromStatus = findTaskColumnByTaskId(active.id);
    let toStatus = over.id;

    if (!STATUSES.includes(toStatus)) {
      toStatus = findTaskColumnByTaskId(toStatus);
    }

    if (!fromStatus || !toStatus || fromStatus === toStatus) return;

    const prevData = qc.getQueryData(['tasks', filters]);

    qc.setQueryData(['tasks', filters], (old = []) =>
      old.map((t) => (t.taskId === active.id ? { ...t, status: toStatus } : t))
    );

    updateTask.mutate(
      { id: active.id, data: { status: toStatus } },
      {
        onError: () => {
          qc.setQueryData(['tasks', filters], prevData);
          toast.error('Failed to move task');
        },
      }
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 h-full pb-6">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            isLoading={isLoading}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150 }}>
        {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
