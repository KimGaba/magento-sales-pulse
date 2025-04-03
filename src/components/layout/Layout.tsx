
import React from 'react';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavigationMenu } from './NavigationMenu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <NavigationMenu />
          </SidebarContent>
        </Sidebar>
        <div className="flex-1">
          <header className="border-b p-4 flex justify-between items-center">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold ml-2">Magento Sales Pulse</h1>
            </div>
          </header>
          <main className="container p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
