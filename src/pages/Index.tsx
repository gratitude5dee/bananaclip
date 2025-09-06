import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Target } from 'lucide-react';
import { NanoBananaApp } from '@/components/nano/NanoBananaApp';
import { AdBananaStudio } from '@/components/studio/AdBananaStudio';
import { Header } from '@/components/layout/Header';
import { WelcomeSection } from '@/components/welcome/WelcomeSection';
import { UploadZone } from '@/components/upload/UploadZone';
import { useMinimalAppState } from '@/hooks/useMinimalAppState';

export type StudioTab = 'nano' | 'ad';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { state, actions } = useMinimalAppState();
  
  // Local UI state
  const [activeTab, setActiveTab] = useState<StudioTab>('nano');
  const [globalProgress, setGlobalProgress] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      actions.setUser({
        id: user.id,
        email: user.email,
        plan: 'free' // Default plan
      });
    }
  }, [user, actions]);

  const handleFileSelect = (file: File) => {
    actions.setUploadFile(file);
    actions.setUploadStatus('uploading');
  };

  const handleUploadComplete = (file: File) => {
    actions.setUploadStatus('complete');
    // Auto-create a simple project for the user
    const projectName = file.name.split('.')[0];
    const projectType: StudioTab = file.type.startsWith('video/') ? 'nano' : 'ad';
    
    actions.setCurrentProject({
      id: Date.now().toString(),
      name: projectName,
      type: projectType
    });
    
    // Switch to the appropriate tab
    setActiveTab(projectType);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Banana Studio</h1>
          <p className="text-muted-foreground mb-6">Please sign in to continue</p>
          <button 
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const showStudioTabs = state.currentProject !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background/80 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {!showStudioTabs ? (
          // New User Experience - Upload First
          <div className="max-w-4xl mx-auto">
            <WelcomeSection />
            <UploadZone 
              onFileSelect={handleFileSelect}
              onUploadComplete={handleUploadComplete}
              className="max-w-2xl mx-auto"
            />
          </div>
        ) : (
          // Studio Interface After Upload
          <div className="max-w-7xl mx-auto">
            {/* Studio Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StudioTab)}>
              <div className="flex flex-col items-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  {state.currentProject?.name}
                </h2>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="nano" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Nano-Banana
                  </TabsTrigger>
                  <TabsTrigger value="ad" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    AdBanana
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Global Progress & Error Display */}
              {globalProgress > 0 && globalProgress < 100 && (
                <div className="max-w-md mx-auto mb-6">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Processing...</span>
                    <span>{globalProgress}%</span>
                  </div>
                  <Progress value={globalProgress} className="h-2" />
                </div>
              )}

              {globalError && (
                <Alert variant="destructive" className="max-w-md mx-auto mb-6">
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              )}

              {/* Tab Content */}
              <TabsContent value="nano" className="mt-0">
                <NanoBananaApp />
              </TabsContent>
              
              <TabsContent value="ad" className="mt-0">
                <AdBananaStudio 
                  projectState={{
                    projectName: state.currentProject?.name || 'Untitled',
                    aspectRatio: '16:9' as const,
                    cast: [],
                    assets: state.upload.file ? [URL.createObjectURL(state.upload.file)] : [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }}
                  onProgress={setGlobalProgress}
                  onError={setGlobalError}
                />
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <div className="fixed bottom-6 right-6">
              <button
                onClick={() => {
                  actions.setCurrentProject(null);
                  actions.resetUpload();
                }}
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:bg-card/80 transition-colors"
              >
                ← New Project
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;