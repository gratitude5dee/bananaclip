import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjectState } from '@/hooks/useProjectState';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Settings, Users, Sparkles, Target, Plus, Search, Grid3X3, Filter, Trash2 } from 'lucide-react';
import { NanoBananaStudio } from '@/components/studio/NanoBananaStudio';
import { AdBananaStudio } from '@/components/studio/AdBananaStudio';
import { NanoBananaApp } from '@/components/nano/NanoBananaApp';
import { ProjectSwitcher } from '@/components/projects/ProjectSwitcher';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectTemplates } from '@/components/projects/ProjectTemplates';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export type StudioTab = 'nano' | 'ad';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { projects, currentProject, setCurrentProject, isLoading } = useProjects();
  const { projectState, updateProject } = useProjectState();
  const [activeTab, setActiveTab] = useState<StudioTab>('nano');
  const [globalProgress, setGlobalProgress] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark-bg">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center dark-bg">
        <Card className="w-full max-w-md dark-surface">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Please sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-bg flex flex-col">
      {/* Header */}
      <header className="border-b dark-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-display brand-teal">Banana Studio</h1>
              <Separator orientation="vertical" className="h-6" />
              <ProjectSwitcher />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">
                {user.email}
              </div>
              <Button onClick={signOut} variant="ghost" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-6">
        {!currentProject ? (
          <>
            {/* Hero Section */}
            <div className="gradient-hero mb-8">
              <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl font-display text-white mb-4">
                    <span className="text-white">Nano-Banana</span>{' '}
                    <span className="text-white/90">Shorts Editor</span>
                  </h1>
                  <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                    Transform your ideas into engaging short-form content with AI-powered video creation
                  </p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    size="lg"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-sm hover-glow"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Project
                  </Button>
                </div>
                
                {/* Project Templates */}
                <ProjectTemplates onSelectTemplate={() => setShowCreateDialog(true)} />
              </div>
            </div>

            {/* Projects Management Section */}
            <div className="container mx-auto px-4">
              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Your Projects
                    {projects.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({projects.length} project{projects.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </h2>
                  <div className="hidden sm:flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
              </div>

              {/* Projects Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <Skeleton className="h-48 w-full rounded-lg mb-3" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (() => {
                const filteredProjects = projects.filter(project =>
                  project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  project.description?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                return filteredProjects.length === 0 ? (
                  <div className="text-center py-16">
                    {projects.length === 0 ? (
                      <div className="animate-fade-in">
                        <div className="mx-auto w-20 h-20 gradient-card rounded-full flex items-center justify-center mb-6 shadow-card">
                          <Plus className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">No projects yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Create your first project using one of our templates above or start from scratch
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)} className="hover-glow">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Project
                        </Button>
                      </div>
                    ) : (
                      <div className="animate-fade-in">
                        <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search query or create a new project
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProjects.map((project, index) => (
                      <div 
                        key={project.id} 
                        className="animate-fade-in hover-lift" 
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <ProjectCard
                          project={project}
                          onSelect={() => setCurrentProject(project.id)}
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <>
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StudioTab)}>
              <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
                <TabsTrigger value="nano" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Nano-Banana
                </TabsTrigger>
                <TabsTrigger value="ad" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  AdBanana
                </TabsTrigger>
              </TabsList>

              {/* Global Progress & Error Display */}
              {globalProgress > 0 && globalProgress < 100 && (
                <div className="mt-4 max-w-md">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Generating...</span>
                    <span>{globalProgress}%</span>
                  </div>
                  <Progress value={globalProgress} className="h-2" />
                </div>
              )}

              {globalError && (
                <Alert variant="destructive" className="mt-4 max-w-md">
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              )}

              {/* Tab Content */}
              <div className="mt-6">
                <TabsContent value="nano" className="mt-0">
                  <NanoBananaApp />
                </TabsContent>
                
                <TabsContent value="ad" className="mt-0">
                  <AdBananaStudio 
                    projectState={projectState}
                    onProgress={setGlobalProgress}
                    onError={setGlobalError}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
};

export default Index;
