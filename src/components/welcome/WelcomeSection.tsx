import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Target, Upload } from 'lucide-react';

export function WelcomeSection() {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-4xl">
          🍌
        </div>
        <div className="text-left">
          <h1 className="text-4xl font-bold text-foreground">Welcome to Banana Studio</h1>
          <p className="text-lg text-muted-foreground">AI-powered creative suite for content creators</p>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto mb-8">
        <p className="text-muted-foreground text-lg leading-relaxed">
          Transform your creative workflow with our AI-powered tools. Upload your content and let our intelligent systems help you create amazing videos, ads, and more.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Smart Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Drag and drop your content. Our AI automatically analyzes and prepares your files for editing.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">AI Enhancement</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Powered by advanced AI models that understand your content and suggest intelligent improvements.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">Creative Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Professional-grade editing tools simplified for creators of all skill levels.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}