import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { CreateProjectDialog } from './CreateProjectDialog';
import { 
  ChevronDown, 
  Plus, 
  FolderOpen, 
  Settings,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProjectSwitcher: React.FC = () => {
  const { projects, currentProject, setCurrentProject } = useProjects();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  const handleProjectSelect = (projectId: string) => {
    setCurrentProject(projectId);
  };

  const handleViewAllProjects = () => {
    navigate('/projects');
  };

  if (!currentProject && projects.length === 0) {
    return (
      <>
        <Button 
          variant="outline" 
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 min-w-[200px] justify-between">
            <div className="flex items-center gap-2 truncate">
              <FolderOpen className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {currentProject?.name || 'Select Project'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Switch Project</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleProjectSelect(project.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="truncate">{project.name}</span>
              </div>
              {currentProject?.id === project.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleViewAllProjects}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Projects
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
};