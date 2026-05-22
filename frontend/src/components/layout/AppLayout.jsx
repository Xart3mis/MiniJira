import { Outlet } from 'react-router-dom';
import { TooltipProvider } from '../ui/Tooltip';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import TaskPanel from '../tasks/TaskPanel';
import CreateTaskModal from '../tasks/CreateTaskModal';
import CommandPalette from '../ui/CommandPalette';
import useUiStore from '../../store/uiStore';

export default function AppLayout() {
  const { taskPanelOpen, createTaskOpen } = useUiStore();

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-brand-base">
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto relative">
            <Outlet />
          </main>
        </div>

        {taskPanelOpen && <TaskPanel />}
        {createTaskOpen && <CreateTaskModal />}
        <CommandPalette />
      </div>
    </TooltipProvider>
  );
}
