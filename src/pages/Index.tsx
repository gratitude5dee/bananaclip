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
import { Settings, Users, Sparkles, Target, Plus } from 'lucide-react';
import { NanoBananaStudio } from '@/components/studio/NanoBananaStudio';
import { AdBananaStudio } from '@/components/studio/AdBananaStudio';
import { NanoBananaApp } from '@/components/nano/NanoBananaApp';
import { ProjectSwitcher } from '@/components/projects/ProjectSwitcher';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectTemplates } from '@/components/projects/ProjectTemplates';

export type StudioTab = 'nano' | 'ad';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { currentProject } = useProjects();
  const { projectState, updateProject } = useProjectState();
  const [activeTab, setActiveTab] = useState<StudioTab>('nano');
  const [globalProgress, setGlobalProgress] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal via-brand-purple to-brand-pink p-8 md:p-12 text-center text-white mb-8">
              <div className="relative z-10">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  Nano-Banana Shorts Editor
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Transform your ideas into engaging short-form content with AI-powered video creation
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Project
                </Button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>

            {/* Templates Section */}
            <div className="mb-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Choose a Template</h2>
                <p className="text-muted-foreground text-lg">
                  Get started quickly with our pre-configured templates
                </p>
              </div>
              <ProjectTemplates onSelectTemplate={() => setShowCreateDialog(true)} />
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
