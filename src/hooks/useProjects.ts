import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  aspect_ratio: string;
  video_style: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    localStorage.getItem('currentProjectId')
  );

  // Fetch all user projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });

  // Get current project
  const currentProject = projects.find(p => p.id === currentProjectId);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; description?: string; aspect_ratio?: string; video_style?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description || null,
          aspect_ratio: projectData.aspect_ratio || '16:9',
          video_style: projectData.video_style || 'Cinematic',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCurrentProject(newProject.id);
      toast({
        title: "Project created",
        description: `${newProject.name} has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (currentProjectId === deletedId) {
        setCurrentProject(null);
      }
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set current project
  const setCurrentProject = useCallback((projectId: string | null) => {
    setCurrentProjectId(projectId);
    if (projectId) {
      localStorage.setItem('currentProjectId', projectId);
    } else {
      localStorage.removeItem('currentProjectId');
    }
  }, []);

  // Create project
  const createProject = useCallback((projectData: { name: string; description?: string; aspect_ratio?: string; video_style?: string }) => {
    createProjectMutation.mutate(projectData);
  }, [createProjectMutation]);

  // Update project
  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    updateProjectMutation.mutate({ id, ...updates });
  }, [updateProjectMutation]);

  // Delete project
  const deleteProject = useCallback((projectId: string) => {
    deleteProjectMutation.mutate(projectId);
  }, [deleteProjectMutation]);

  return {
    projects,
    currentProject,
    currentProjectId,
    isLoading,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
  };
}