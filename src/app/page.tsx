import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { FileSearch, FilePlus2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center p-4">
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-2 bg-primary/20 rounded-full animate-pulse [animation-delay:0.2s]"></div>
        <div className="absolute inset-4 bg-card border-2 border-primary/50 rounded-full flex items-center justify-center">
            <Logo className="text-primary w-24 h-24" />
        </div>
      </div>
      
      <h1 className="text-5xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-r from-primary-foreground to-primary">
        وصّل للتأهيل الطبي
      </h1>
      <p className="mt-4 text-xl text-muted-foreground max-w-2xl">
        نظام الذكاء الاصطناعي المتقدم لتحليل بيانات المرضى وإنشاء خطط تأهيلية مخصصة وعلمية في لحظات.
      </p>
      
      <div className="mt-12 flex flex-col sm:flex-row gap-6">
        <Button asChild size="lg" className="flex-1 group transition-transform duration-300 hover:scale-105">
          <Link href="/assessment">
            بدء تقييم جديد
            <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="flex-1 transition-transform duration-300 hover:scale-105">
          <Link href="/retrieve">
            <FileSearch className="ml-2" />
            استعراض تقرير سابق
          </Link>
        </Button>
      </div>
    </div>
  );
}
