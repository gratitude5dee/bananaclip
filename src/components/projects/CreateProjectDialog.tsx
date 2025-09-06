import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProjects } from '@/hooks/useProjects';
import { Video, Scissors, FileText, Wand2, Upload, Sparkles, ArrowLeft } from 'lucide-react';

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().optional(),
  aspect_ratio: z.enum(['16:9', '9:16', '1:1', '4:3']).default('16:9'),
  video_style: z.enum(['Cinematic', 'Documentary', 'Social Media', 'Educational', 'Commercial', 'Artistic']).default('Cinematic'),
  project_type: z.string().default('custom'),
});

type CreateProjectForm = z.infer<typeof CreateProjectSchema>;

interface ProjectType {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultSettings: Partial<CreateProjectForm>;
}

const projectTypes: ProjectType[] = [
  {
    id: 'video-translator',
    title: 'Video Translator',
    description: 'Translate videos to different languages with AI dubbing',
    icon: Video,
    defaultSettings: { aspect_ratio: '16:9', video_style: 'Documentary' },
  },
  {
    id: 'long-to-shorts',
    title: 'Long Video to Shorts',
    description: 'Transform long-form content into engaging shorts',
    icon: Scissors,
    defaultSettings: { aspect_ratio: '9:16', video_style: 'Social Media' },
  },
  {
    id: 'script-to-video',
    title: 'Script to Video',
    description: 'Generate videos from text scripts using AI',
    icon: FileText,
    defaultSettings: { aspect_ratio: '16:9', video_style: 'Educational' },
  },
  {
    id: 'ai-enhancement',
    title: 'AI Enhancement',
    description: 'Enhance existing videos with AI effects',
    icon: Wand2,
    defaultSettings: { aspect_ratio: '16:9', video_style: 'Cinematic' },
  },
  {
    id: 'media-upload',
    title: 'Upload & Edit',
    description: 'Upload your media and start editing',
    icon: Upload,
    defaultSettings: { aspect_ratio: '16:9', video_style: 'Cinematic' },
  },
  {
    id: 'custom',
    title: 'Custom Project',
    description: 'Start with a blank canvas',
    icon: Sparkles,
    defaultSettings: { aspect_ratio: '16:9', video_style: 'Cinematic' },
  },
];

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ open, onOpenChange }) => {
  const { createProject, isCreating } = useProjects();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  
  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      aspect_ratio: '16:9',
      video_style: 'Cinematic',
      project_type: 'custom',
    },
  });

  const handleTypeSelect = (type: ProjectType) => {
    setSelectedType(type.id);
    setShowTypeSelection(false);
    
    // Apply default settings for the selected type
    form.reset({
      ...form.getValues(),
      ...type.defaultSettings,
      project_type: type.id,
      name: type.id !== 'custom' ? `New ${type.title}` : '',
      description: type.description,
    });
  };

  const onSubmit = async (data: CreateProjectForm) => {
    try {
      await createProject({
        name: data.name,
        description: data.description,
        aspect_ratio: data.aspect_ratio,
        video_style: data.video_style,
      });
      
      // Reset form and close dialog
      form.reset();
      setSelectedType(null);
      setShowTypeSelection(true);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleBack = () => {
    setShowTypeSelection(true);
    setSelectedType(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setSelectedType(null);
      setShowTypeSelection(true);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {showTypeSelection ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Project</DialogTitle>
              <DialogDescription>
                Choose a project type to get started quickly with optimized settings.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {projectTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <Card 
                    key={type.id}
                    className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-2 hover:border-primary/50"
                    onClick={() => handleTypeSelect(type)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                            {type.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>Project Details</DialogTitle>
                  <DialogDescription>
                    Configure your {projectTypes.find(t => t.id === selectedType)?.title} project.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aspect_ratio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aspect Ratio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select aspect ratio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                            <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="video_style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select video style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cinematic">Cinematic</SelectItem>
                          <SelectItem value="Documentary">Documentary</SelectItem>
                          <SelectItem value="Social Media">Social Media</SelectItem>
                          <SelectItem value="Educational">Educational</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                          <SelectItem value="Artistic">Artistic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your project..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isCreating}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || !form.formState.isValid}
                    className="min-w-[120px] hover-glow"
                  >
                    {isCreating ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};