"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadAllReports(user.uid);
  }, [user, authLoading, router]);

  const loadAllReports = async (userId: string) => {
    setIsLoadingReports(true);
    setError(null);
    const reportsMap = new Map<string, SavedReport>();

    // 1. Load from localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('report-')) {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.fileNumber && data.name) {
             const createdAt = data.createdAt ? new Date(data.createdAt) : new Date(0);
            reportsMap.set(data.fileNumber, {
              fileNumber: data.fileNumber,
              patientName: data.name,
              createdAt: createdAt,
              source: 'local',
            });
          }
        }
      }
    } catch (e) { 
      console.error('Error parsing local reports:', e);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل قراءة بعض التقارير المحلية.' });
    }

    // 2. Load from Firebase and merge/overwrite
    try {
      const q = query(collection(db, 'reports'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = (data.createdAt as Timestamp)?.toDate() || new Date();
        reportsMap.set(data.fileNumber, {
          fileNumber: data.fileNumber,
          patientName: data.patientName,
          createdAt: createdAt,
          source: 'cloud',
        });
      });
    } catch (firebaseError: any) {
      console.error('Error loading cloud reports:', firebaseError);
      setError("فشل تحميل التقارير المحفوظة في السحابة. قد تكون هناك مشكلة في الاتصال أو الصلاحيات.");
    }
    
    const sortedReports = Array.from(reportsMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setAllReports(sortedReports);
    setIsLoadingReports(false);
  };

  const handleRetrieve = (e: React.FormEvent) => {
    e.preventDefault();
    startSearchTransition(() => {
      const trimmedFileNumber = fileNumber.trim();
      if (!trimmedFileNumber) {
        toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال رقم الملف." });
        return;
      }
      router.push(`/report/${trimmedFileNumber}`);
    });
  };

  const handleQuickAccess = (reportFileNumber: string) => {
    router.push(`/report/${reportFileNumber}`);
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-[450px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-primary/10">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-3">
            <div className="w-8 h-8"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></div>
            استعادة التقارير الطبية
          </CardTitle>
          <CardDescription className="text-lg">
            ابحث عن التقارير المحفوظة باستخدام رقم الملف أو تصفح التقارير الحديثة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRetrieve} className="space-y-2">
            <label htmlFor="fileNumber" className="text-sm font-medium">
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
                {isSearching ? <div className="h-5 w-5 animate-spin"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div> : <div className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>}
              </Button>
            </div>
          </form>
          
          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-semibold mb-4">التقارير الأخيرة</h3>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <div className="h-4 w-4"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg></div>
                <AlertTitle>خطأ في الاتصال</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
                          ? <div className="h-5 w-5 text-blue-500" title="محفوظ في السحابة"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg></div> 
                          : <div className="h-5 w-5 text-green-500" title="محفوظ محلياً"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg></div>}
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
