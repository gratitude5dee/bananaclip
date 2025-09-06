import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Scissors, FileText, Wand2, Upload, Sparkles } from 'lucide-react';

interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  popular?: boolean;
}

interface ProjectTemplatesProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
}

const templates: ProjectTemplate[] = [
  {
    id: 'video-translator',
    title: 'Video Translator',
    description: 'Translate videos to different languages with AI dubbing',
    icon: Video,
    color: 'project-type-video',
    popular: true,
  },
  {
    id: 'long-to-shorts',
    title: 'Long Video to Shorts',
    description: 'Transform long-form content into engaging shorts',
    icon: Scissors,
    color: 'project-type-shorts',
    popular: true,
  },
  {
    id: 'script-to-video',
    title: 'Script to Video',
    description: 'Generate videos from text scripts using AI',
    icon: FileText,
    color: 'project-type-script',
  },
  {
    id: 'ai-enhancement',
    title: 'AI Enhancement',
    description: 'Enhance existing videos with AI effects',
    icon: Wand2,
    color: 'project-type-video',
  },
  {
    id: 'media-upload',
    title: 'Upload & Edit',
    description: 'Upload your media and start editing',
    icon: Upload,
    color: 'project-type-video',
  },
  {
    id: 'creative-studio',
    title: 'Creative Studio',
    description: 'Start with a blank canvas for creative projects',
    icon: Sparkles,
    color: 'project-type-script',
  },
];

export const ProjectTemplates: React.FC<ProjectTemplatesProps> = ({ onSelectTemplate }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-white mb-2">Choose a Template</h2>
        <p className="text-white/70">Get started quickly with our pre-configured templates</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const IconComponent = template.icon;
          return (
            <Card 
              key={template.id} 
              className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 cursor-pointer group hover-lift"
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${template.color} transition-colors group-hover:scale-110 duration-300`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  {template.popular && (
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full border border-primary/30">
                      Popular
                    </span>
                  )}
                </div>
                
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-white transition-colors">
                  {template.title}
                </h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">
                  {template.description}
                </p>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-white border-white/20 hover:bg-white/10 hover:border-white/30"
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};