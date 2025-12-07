import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ClientManagement } from './components/ClientManagement';
import { PurchaseManagement } from './components/PurchaseManagement';
import { InvoiceManagement } from './components/InvoiceManagement';
import { FinanceManagement } from './components/FinanceManagement';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { AnimatedBackground } from './components/AnimatedBackground';
import { PageTransition } from './components/PageTransition';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Toaster } from './components/ui/sonner';
import { getAuthUser } from './lib/auth';
import { API_BASE } from './lib/api/slices/base';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  } | null;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for saved authentication state on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const savedUser = getAuthUser();

      if (token && savedUser) {
        // Verify token is still valid
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (res.ok) {
            const user = await res.json();
            setAuthState({
              isAuthenticated: true,
              user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
              }
            });
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('authUser');
            localStorage.removeItem('fedhub_auth');
          }
        } catch (error) {
          console.error('Error verifying auth:', error);
          // Clear invalid auth
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('authUser');
          localStorage.removeItem('fedhub_auth');
        }
      } else {
        // Check legacy auth format
        const savedAuth = localStorage.getItem('fedhub_auth');
        if (savedAuth) {
          try {
            const parsedAuth = JSON.parse(savedAuth);
            if (parsedAuth.isAuthenticated && parsedAuth.user) {
              setAuthState(parsedAuth);
            }
          } catch (error) {
            console.error('Error parsing saved auth state:', error);
            localStorage.removeItem('fedhub_auth');
          }
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (credentials: { email: string; password: string; rememberMe: boolean }) => {
    // The Login component handles the actual API call and stores the token
    // We just need to update the state here
    const user = getAuthUser();
    if (user) {
      setAuthState({
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      });
    }
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('fedhub_auth');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
    setCurrentPage('dashboard');
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientManagement />;
      case 'purchases':
        return <PurchaseManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'finance':
        return <FinanceManagement />;
      case 'settings':
        return <Settings onLogout={handleLogout} userInfo={authState.user} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <AnimatedBackground />
      
      {/* Full Width Header */}
      <Header 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        user={authState.user}
        onLogout={handleLogout}
      />
      
      {/* Layout with Sidebar and Main Content */}
      <div className="flex-1 flex">
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          <PageTransition currentPage={currentPage}>
            {renderPage()}
          </PageTransition>
        </Layout>
      </div>
      
      <FloatingActionButton onPageChange={setCurrentPage} />
      <Toaster />
    </div>
  );
}
