"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileSearch, Search, Loader2, Cloud, Database } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface SavedReport {
  fileNumber: string;
  patientName: string;
  createdAt: Date;
  source: 'local' | 'cloud';
}

export default function RetrievePage() {
  const [fileNumber, setFileNumber] = useState("");
  const [allReports, setAllReports] = useState<SavedReport[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadAllReports(user.uid);
    }
  }, [user, authLoading, router]);

  const loadAllReports = async (userId: string) => {
    setIsLoadingReports(true);
    const reportsMap = new Map<string, SavedReport>();

    // 1. Load from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('report-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.fileNumber && data.name) {
             const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
            reportsMap.set(data.fileNumber, {
              fileNumber: data.fileNumber,
              patientName: data.name,
              createdAt: createdAt,
              source: 'local',
            });
          }
        } catch (e) { console.error('Error parsing local report:', e); }
      }
    }

    // 2. Load from Firebase and merge
    try {
      const q = query(collection(db, 'reports'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = (data.createdAt as Timestamp)?.toDate() || new Date();
        reportsMap.set(data.fileNumber, { // Overwrites local if exists, as cloud is more authoritative
          fileNumber: data.fileNumber,
          patientName: data.patientName,
          createdAt: createdAt,
          source: 'cloud',
        });
      });
    } catch (error) {
      console.error('Error loading cloud reports:', error);
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: "فشل تحميل التقارير المحفوظة في السحابة. قد تظهر التقارير المحلية فقط."
      })
    }
    
    const sortedReports = Array.from(reportsMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setAllReports(sortedReports);
    setIsLoadingReports(false);
  };

  const handleRetrieve = (e: React.FormEvent) => {
    e.preventDefault();
    startSearchTransition(() => {
      if (!fileNumber.trim()) {
        toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال رقم الملف." });
        return;
      }
      const trimmedFileNumber = fileNumber.trim();
      router.push(`/report/${trimmedFileNumber}`);
    });
  };

  const handleQuickAccess = (reportFileNumber: string) => {
    router.push(`/report/${reportFileNumber}`);
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-2xl bg-card/80 backdrop-blur-sm border-primary/10">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-3">
            <FileSearch className="h-8 w-8" />
            استعادة التقارير الطبية
          </CardTitle>
          <CardDescription className="text-lg">
            ابحث عن التقارير المحفوظة باستخدام رقم الملف أو تصفح التقارير الحديثة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <form onSubmit={handleRetrieve} className="space-y-2">
              <label htmlFor="fileNumber" className="text-sm font-medium text-muted-foreground">
                البحث برقم الملف
              </label>
              <div className="flex gap-2">
                <Input
                  id="fileNumber"
                  type="text"
                  value={fileNumber}
                  onChange={(e) => setFileNumber(e.target.value)}
                  placeholder="مثال: WSL-2025-12345"
                  className="text-left text-lg font-mono"
                  dir="ltr"
                  disabled={isSearching}
                />
                <Button type="submit" size="lg" disabled={isSearching}>
                  {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                </Button>
              </div>
            </form>
          </div>
          
          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-semibold mb-4">التقارير الأخيرة</h3>
            {isLoadingReports ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : allReports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد تقارير محفوظة بعد.
              </p>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {allReports.map((report) => (
                  <Card 
                    key={report.fileNumber} 
                    className="cursor-pointer hover:bg-secondary/50 transition-colors animate-in fade-in-50"
                    onClick={() => handleQuickAccess(report.fileNumber)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        {report.source === 'cloud' 
                          ? <Cloud className="h-5 w-5 text-blue-500" title="محفوظ في السحابة" /> 
                          : <Database className="h-5 w-5 text-green-500" title="محفوظ محلياً" />}
                        <div>
                          <p className="font-semibold">{report.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            <Badge variant="outline" className="font-mono">{report.fileNumber}</Badge>
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(report.createdAt, { addSuffix: true, locale: arSA })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
