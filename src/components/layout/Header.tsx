import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Branding */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-2xl">
                🍌
              </div>
              <div>
                <h1 className="text-2xl font-display text-foreground">Banana Studio</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Creative Suite</p>
              </div>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">
              {user?.email}
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}