import { useState } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../hooks/useProjects';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';

export default function ProjectsPage() {
  const isManager = useAuthStore((s) => s.user?.role === 'Manager');
  const { data: projects = [], isLoading } = useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const handleEdit = (project) => {
    setEditProject(project);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditProject(null);
  };

  return (
    <div className="px-6 py-6 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-brand-silver">Projects</h1>
          <p className="text-sm text-brand-silver/35 mt-0.5">{projects.length} total</p>
        </div>
        {isManager && !formOpen && (
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => setFormOpen(true)}
          >
            New project
          </Button>
        )}
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-brand-overlay border border-[var(--border-default)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-brand-silver">
                  {editProject ? 'Edit project' : 'New project'}
                </h2>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 flex items-center justify-center rounded text-brand-silver/25 hover:text-brand-silver/60 hover:bg-brand-elevated transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <ProjectForm project={editProject} onClose={handleClose} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProjectList projects={projects} isLoading={isLoading} onEdit={handleEdit} />
    </div>
  );
}
