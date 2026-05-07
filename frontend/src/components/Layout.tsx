import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-full w-full bg-background/50">
      <main className="h-full overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
