import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Calendar, 
  Play, 
  Edit, 
  Trash2,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects, type Project } from '@/hooks/useProjects';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

  const timeAgo = formatDistanceToNow(new Date(project.updated_at), { addSuffix: true });

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border">
        <CardContent className="p-0">
          {/* Thumbnail placeholder - could be replaced with actual thumbnails */}
          <div 
            className="h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-t-lg flex items-center justify-center"
            onClick={onSelect}
          >
            <Play className="h-8 w-8 text-primary/60" />
          </div>
          
          <div className="p-4" onClick={onSelect}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {project.name}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onSelect}>
                    <Edit className="h-4 w-4 mr-2" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {project.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                {project.aspect_ratio}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {project.video_style}
              </Badge>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="px-4 py-3 bg-muted/50 rounded-b-lg">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {timeAgo}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone and will permanently delete all project data including scenes, characters, and assets.
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