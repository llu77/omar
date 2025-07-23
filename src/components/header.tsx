import Link from "next/link";
import { FilePlus2, FileSearch, LogIn } from "lucide-react";
import { Button } from "./ui/button";
import { Logo } from "./logo";

export default function Header() {
  return (
    <header className="bg-background/75 backdrop-blur-sm shadow-md sticky top-0 z-40 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-primary/10 rounded-full flex items-center justify-center w-12 h-12 transition-transform duration-300 group-hover:scale-110">
                <Logo className="text-primary" />
            </div>
            <span className="text-2xl font-bold font-headline text-primary-foreground">
              وصّل للتأهيل الطبي
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/assessment">
                <FilePlus2 className="ml-2" />
                تقييم جديد
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/retrieve">
                <FileSearch className="ml-2" />
                استعادة تقرير
              </Link>
            </Button>
            <Button asChild>
                <Link href="/login">
                    <LogIn className="ml-2"/>
                    تسجيل الدخول
                </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
