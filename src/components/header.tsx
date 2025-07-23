import Link from "next/link";
import { Stethoscope, FilePlus2, FileSearch, LogIn } from "lucide-react";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <Stethoscope className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold font-headline text-primary">
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
