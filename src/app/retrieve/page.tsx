
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db, auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { collection, query, getDocs, Timestamp, orderBy, where, limit, doc, getDoc } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Cloud, Database, FileSearch, Loader2, Search, ServerCrash } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";

interface SavedReport {
  fileNumber: string;
  name: string; // patient name
  createdAt: Date;
  source: 'local' | 'cloud';
}

const SourceIcon = React.memo(({ source }: { source: 'local' | 'cloud' }) => {
  if (source === 'cloud') {
    return <Cloud className="h-5 w-5 text-blue-500" title="محفوظ في السحابة"/>;
  }
  return <Database className="h-5 w-5 text-green-500" title="محفوظ محلياً"/>;
});
SourceIcon.displayName = 'SourceIcon';


export default function RetrievePage() {
  const [fileNumber, setFileNumber] = useState("");
  const [cloudReports, setCloudReports] = useState<SavedReport[]>([]);
  const [localReports, setLocalReports] = useState<SavedReport[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
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
    loadInitialReports();
  }, [user, authLoading, router]);

  const loadInitialReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch recent cloud reports
      const cloudQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
      const cloudSnapshot = await getDocs(cloudQuery);
      const fetchedCloudReports = cloudSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          fileNumber: doc.id,
          name: data.name,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          source: 'cloud' as const,
        };
      });
      setCloudReports(fetchedCloudReports);
      
      // Fetch local reports
      const local: SavedReport[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('report-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.fileNumber && data.name) {
              local.push({
                fileNumber: data.fileNumber,
                name: data.name,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date(0),
                source: 'local',
              });
            }
          } catch (e) {
            console.warn(`Could not parse local report from key ${key}:`, e);
          }
        }
      }
      setLocalReports(local.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

    } catch (err: any) {
      console.error("Error loading reports:", err);
      setError("فشل تحميل التقارير المحفوظة. قد تكون هناك مشكلة في الاتصال أو الصلاحيات.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrieve = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFileNumber = fileNumber.trim();
    if (!trimmedFileNumber) {
      toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال رقم الملف." });
      return;
    }

    startSearchTransition(async () => {
      try {
        const reportDocRef = doc(db, "reports", trimmedFileNumber);
        const reportDoc = await getDoc(reportDocRef);
        
        let reportExists = reportDoc.exists();
        if (!reportExists) {
            const localData = localStorage.getItem(`report-${trimmedFileNumber}`);
            if(localData) {
                reportExists = true;
            }
        }

        if (reportExists) {
          toast({ title: "تم العثور على التقرير", description: "جاري استعراض التقرير..." });
          router.push(`/report/${trimmedFileNumber}`);
        } else {
          toast({ variant: "destructive", title: "لم يتم العثور عليه", description: "لا يوجد تقرير بهذا الرقم محلياً أو في السحابة." });
        }
      } catch (err) {
        console.error("Error retrieving report:", err);
        toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء البحث عن التقرير." });
      }
    });
  };

  const handleQuickAccess = (reportFileNumber: string) => {
    router.push(`/report/${reportFileNumber}`);
  };

  const renderReportList = (reports: SavedReport[]) => (
    <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
      {reports.map((report) => (
        <Card 
          key={report.fileNumber} 
          className="cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => handleQuickAccess(report.fileNumber)}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <SourceIcon source={report.source} />
              <div>
                <p className="font-semibold">{report.name}</p>
                <div className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="font-mono">{report.fileNumber}</Badge>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {report.createdAt.getFullYear() > 2000 ? formatDistanceToNow(report.createdAt, { addSuffix: true, locale: arSA }) : 'بدون تاريخ'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-[450px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-50">
      <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-primary/10">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-3">
            <FileSearch className="w-8 h-8"/>
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
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin"/> : <Search className="w-5 h-5"/>}
              </Button>
            </div>
          </form>
          
          <Separator className="my-6" />

          {error && (
            <Alert variant="destructive" className="mb-4">
              <ServerCrash className="h-4 w-4"/>
              <AlertTitle>خطأ في الاتصال</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
             <div className="space-y-4">
               <Skeleton className="h-8 w-1/3" />
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
             </div>
          ) : (
            <>
              {cloudReports.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Cloud className="h-5 w-5 text-blue-500" />التقارير المشتركة (السحابة)</h3>
                  {renderReportList(cloudReports)}
                </div>
              )}

              {localReports.length > 0 && (
                <div className="mt-6">
                   <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Database className="h-5 w-5 text-green-500"/>التقارير المحفوظة محلياً</h3>
                   {renderReportList(localReports)}
                </div>
              )}

              {cloudReports.length === 0 && localReports.length === 0 && (
                 <div className="text-center text-muted-foreground py-8">
                   لا توجد تقارير محفوظة بعد.
                 </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

