"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch, ArrowLeft } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";

export default function RetrievePage() {
  const [fileNumber, setFileNumber] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const handleRetrieve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNumber.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال رقم الملف.",
      });
      return;
    }

    const reportData = localStorage.getItem(`report-${fileNumber.trim()}`);

    if (reportData) {
      toast({
        title: "تم العثور على التقرير",
        description: `جاري عرض تقرير الملف رقم: ${fileNumber.trim()}`,
      });
      router.push(`/report/${fileNumber.trim()}`);
    } else {
      toast({
        variant: "destructive",
        title: "لم يتم العثور على التقرير",
        description: "الرجاء التأكد من صحة رقم الملف.",
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-full">
        <Card className="w-full max-w-lg shadow-2xl bg-secondary/30 border-primary/20">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-3">
                <FileSearch />
                استعادة تقرير تأهيلي
            </CardTitle>
            <CardDescription>
                أدخل رقم الملف الخاص بالمريض لعرض التقرير المحفوظ.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleRetrieve} className="space-y-6">
            <div>
                <label htmlFor="fileNumber" className="block text-sm font-medium text-muted-foreground mb-2">
                رقم الملف
                </label>
                <Input
                id="fileNumber"
                type="text"
                value={fileNumber}
                onChange={(e) => setFileNumber(e.target.value)}
                placeholder="مثال: WSL-2024-12345"
                className="text-left text-lg"
                dir="ltr"
                />
            </div>
            <Button type="submit" className="w-full group" size="lg">
                عرض التقرير
                <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </Button>
            </form>
        </CardContent>
        </Card>
    </div>
  );
}
