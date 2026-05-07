import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, 
  User, 
  Moon, 
  Sun, 
  Settings, 
  ChevronDown,
  Plus,
  Home,
  LogOut,
  ShoppingCart,
  FileText,
  Wallet,
  Building2,
  Truck,
  Users,
  Link2
} from 'lucide-react';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { GlassCard } from './GlassCard';
import { HeaderBackground } from './HeaderBackground';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: {
    email: string;
    role: string;
  } | null;
  onLogout?: () => void;
}

const quickActions = [
  { id: 'new-purchase', label: 'New Purchase', icon: Plus },
  { id: 'new-client', label: 'New Client', icon: User },
  { id: 'new-invoice', label: 'New Invoice', icon: Plus },
];

export function Header({ currentPage, onPageChange, user, onLogout }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'New purchase order approved', time: '2 min ago', unread: true },
    { id: 2, title: 'Invoice payment received', time: '1 hour ago', unread: true },
    { id: 3, title: 'Client registration completed', time: '3 hours ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const topMenus = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'finance', label: 'Finance', icon: Wallet },
  ] as const;
  const activeMenuClass =
    "!bg-gradient-to-b !from-zinc-800 !via-zinc-900 !to-black !text-amber-100 border border-zinc-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_8px_rgba(0,0,0,0.35)] hover:!from-zinc-700 hover:!via-zinc-800 hover:!to-zinc-950";
  const inactiveMenuClass =
    "bg-white/20 dark:bg-zinc-800/40 border border-amber-200/40 dark:border-amber-500/20 text-zinc-800 dark:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-700/50";

  return (
    <motion.header
      className="relative z-50 w-full shrink-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <GlassCard
        hover={false}
        className="rounded-none border-0 border-b border-amber-200/40 dark:border-amber-500/20 backdrop-blur-xl bg-gradient-to-r from-zinc-50/95 via-amber-50/70 to-zinc-100/95 dark:from-zinc-900/95 dark:via-zinc-800/90 dark:to-zinc-900/95 relative"
      >
        <HeaderBackground />
        <div className="flex h-20 items-center justify-between px-6 relative z-10">
          {/* Left Section - Company Branding */}
          <div className="flex items-center space-x-6">
            {/* Company Branding */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="p-0"
              >
                {!logoLoadFailed ? (
                  <img
                    src="/header-logo.png"
                    alt="FedHub logo"
                    className="w-10 h-10 object-contain"
                    onError={() => setLogoLoadFailed(true)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-zinc-500/60 bg-gradient-to-br from-zinc-300 to-zinc-500 dark:from-zinc-600 dark:to-zinc-800 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                  </div>
                )}
              </motion.div>
              <div>
                <p className="text-lg md:text-xl font-bold tracking-wide text-zinc-800 dark:text-amber-100">
                  Purchase Management System
                </p>
              </div>
            </motion.div>
          </div>

          {/* Center Section - Main Navigation */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-2 px-6">
            {topMenus.map((menu) => {
              const Icon = menu.icon;
              const isActive = currentPage === menu.id;
              return (
                <Button
                  key={menu.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(menu.id)}
                  className={isActive ? activeMenuClass : inactiveMenuClass}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {menu.label}
                </Button>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={
                    currentPage === 'settings' || currentPage === 'suppliers' || currentPage === 'clients'
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  className={
                    currentPage === 'settings' || currentPage === 'suppliers' || currentPage === 'clients'
                      ? activeMenuClass
                      : inactiveMenuClass
                  }
                >
                  <Settings className="h-4 w-4 mr-1.5" />
                  Settings
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-white/20">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onPageChange('settings')}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Enterprise Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange('suppliers')}>
                  <Truck className="h-4 w-4 mr-2" />
                  Suppliers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPageChange('clients')}>
                  <Users className="h-4 w-4 mr-2" />
                  Clients
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Section - Status, Actions and User Menu */}
          <motion.div
            className="flex items-center space-x-4"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >

            {/* Quick Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="bg-gradient-to-r from-zinc-900 to-zinc-700 text-amber-100 hover:from-zinc-800 hover:to-zinc-600 border-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Quick Actions
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-white/20">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickActions.map((action) => (
                  <DropdownMenuItem key={action.id} className="hover:bg-white/50 dark:hover:bg-gray-800/50">
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="relative overflow-hidden bg-white/20 dark:bg-zinc-800/40 border border-amber-200/40 dark:border-amber-500/20 hover:bg-white/40 dark:hover:bg-zinc-700/50"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isDarkMode ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </motion.div>
              </Button>
            </motion.div>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="relative bg-white/20 dark:bg-zinc-800/40 border border-amber-200/40 dark:border-amber-500/20 hover:bg-white/40 dark:hover:bg-zinc-700/50"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <motion.div
                        className="absolute -top-1 -right-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Badge className="h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-600">
                          {unreadCount}
                        </Badge>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-white/20">
                <div className="p-4 border-b border-white/20">
                  <h4 className="font-semibold">Notifications</h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      className="p-4 border-b border-white/10 hover:bg-white/30 dark:hover:bg-gray-800/30 cursor-pointer"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-white/20 dark:bg-zinc-800/40 border border-amber-200/40 dark:border-amber-500/20 hover:bg-white/40 dark:hover:bg-zinc-700/50 p-0">
                    <Avatar className="h-8 w-8">
                      {/* <AvatarImage src="/api/placeholder/32/32" alt="User" /> */}
                      <AvatarFallback className="bg-gradient-to-r from-zinc-900 to-zinc-700 text-amber-100">
                        {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-white/20" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.role || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'user@fedhubsoftware.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onPageChange('dashboard')}
                  className="hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onPageChange('settings')}
                  className="hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="hover:bg-white/50 dark:hover:bg-gray-800/50 text-red-600 dark:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </GlassCard>
    </motion.header>
  );
}