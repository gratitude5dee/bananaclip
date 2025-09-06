import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Calendar, Copy, Trash2, FolderOpen, Play, Clock, HardDrive, Video, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';

interface Project {
  id: string;
  name: string;
  description?: string;
  aspect_ratio?: string;
  video_style?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const { deleteProject, createProject } = useProjects();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    deleteProject(project.id);
    setShowDeleteDialog(false);
  };

  const handleDuplicate = () => {
    createProject({
      name: `${project.name} (Copy)`,
      description: project.description || undefined,
      aspect_ratio: project.aspect_ratio,
      video_style: project.video_style,
    });
  };

  const getProjectTypeIcon = () => {
    // Determine project type based on project properties or description
    if (project.description?.toLowerCase().includes('short') || project.aspect_ratio === '9:16') {
      return <Video className="h-4 w-4" />;
    }
    if (project.description?.toLowerCase().includes('script')) {
      return <FileText className="h-4 w-4" />;
    }
    return <Video className="h-4 w-4" />;
  };

  const getProjectTypeColor = () => {
    if (project.description?.toLowerCase().includes('short') || project.aspect_ratio === '9:16') {
      return 'project-type-shorts';
    }
    if (project.description?.toLowerCase().includes('script')) {
      return 'project-type-script';
    }
    return 'project-type-video';
  };

  return (
    <>
      <Card className="group cursor-pointer transition-all duration-500 hover:shadow-card-hover bg-card/50 backdrop-blur-sm border-border/50 hover:border-border overflow-hidden">
        {/* Thumbnail Area */}
        <div className="relative aspect-video bg-gradient-to-br from-muted/20 via-card to-muted/10 overflow-hidden" onClick={onSelect}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
              <Play className="h-8 w-8 text-white/90" />
            </div>
          </div>
          
          {/* Project Type Badge */}
          <div className="absolute top-3 left-3">
            <div className={`px-2 py-1 rounded-full ${getProjectTypeColor()} flex items-center gap-1 text-xs font-medium backdrop-blur-sm border`}>
              {getProjectTypeIcon()}
              <span className="hidden sm:inline">
                {project.aspect_ratio === '9:16' ? 'Shorts' : 'Video'}
              </span>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 backdrop-blur-sm">
                  <MoreHorizontal className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-sm">
                <DropdownMenuItem onClick={onSelect} className="cursor-pointer">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)} 
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Area */}
        <CardContent className="p-4" onClick={onSelect}>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>

            {/* Metadata Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {project.aspect_ratio && project.aspect_ratio !== '16:9' && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-muted/50">
                    {project.aspect_ratio}
                  </Badge>
                )}
                {project.video_style && project.video_style !== 'Cinematic' && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-border/50">
                    {project.video_style}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>0 MB</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>0s</span>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border/30">
              <Calendar className="h-3 w-3" />
              <span>
                Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone and will permanently delete all project data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};