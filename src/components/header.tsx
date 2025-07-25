"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { 
  FilePlus2, 
  History, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon, 
  Stethoscope,
  LayoutDashboard,
  MessageSquare,
  Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const UserNavigation = [
  { name: "لوحة التحكم", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { name: "تقييم جديد", href: "/assessment", icon: <FilePlus2 className="h-4 w-4" /> },
  { name: "تقاريري", href: "/retrieve", icon: <History className="h-4 w-4" /> },
  { name: "الأهداف", href: "/goals", icon: <Target className="h-4 w-4" /> },
  { name: "التواصل", href: "/communication", icon: <MessageSquare className="h-4 w-4" /> },
  { name: "استشرني", href: "/consult", icon: <Stethoscope className="h-4 w-4" /> },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect runs only on the client, so we can safely set mounted to true
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "تم تسجيل الخروج",
        description: "إلى اللقاء!",
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تسجيل الخروج",
      });
    }
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };
  
  const renderAuthSection = () => {
    // On the server, or when loading, or before the client is mounted, render a placeholder.
    // This ensures the server-rendered HTML matches the initial client-rendered HTML.
    if (!mounted || loading) {
       return <Skeleton className="h-10 w-24 rounded-md" />;
    }

    // After mounting and once loading is false, render the actual content.
    if (user) {
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || 'المستخدم'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer">
                <LogOut className="ml-2 h-4 w-4"/>تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </>
      );
    }
    
    // Render for logged-out users
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost">
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
        <Button asChild>
          <Link href="/register">إنشاء حساب</Link>
        </Button>
      </div>
    );
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo className="h-8 w-8 text-primary" showText={false} />
              <span className="font-headline text-xl font-bold hidden sm:inline">WASL AI</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                {UserNavigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mounted ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle Theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
              </Button>
            ) : <Skeleton className="h-10 w-10 rounded-full"/> }
            
            <div className="flex items-center gap-2">{renderAuthSection()}</div>
          </div>
        </div>

        {mounted && user && mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 border-t">
            {UserNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-base font-medium rounded-md",
                  pathname.startsWith(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
