"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSearch, ArrowRight, Search, History, Database, Cloud } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface SavedReport {
  fileNumber: string;
  patientName: string;
  createdAt: Date;
  userId?: string;
}

export default function RetrievePage() {
  const [fileNumber, setFileNumber] = useState("");
  const [recentReports, setRecentReports] = useState<SavedReport[]>([]);
  const [cloudReports, setCloudReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadRecentReports();
      loadCloudReports();
    }
  }, [user]);

  const loadRecentReports = () => {
    const reports: SavedReport[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('report-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          reports.push({
            fileNumber: data.fileNumber,
            patientName: data.name,
            createdAt: new Date(data.createdAt || Date.now()),
          });
        } catch (e) {
          console.error('Error parsing report:', e);
        }
      }
    }
    setRecentReports(reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5));
  };

  const loadCloudReports = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const reports: SavedReport[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          fileNumber: data.fileNumber,
          patientName: data.patientName,
          createdAt: data.createdAt.toDate(),
          userId: data.userId
        });
      });
      
      setCloudReports(reports);
    } catch (error) {
      console.error('Error loading cloud reports:', error);
    }
  };

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNumber.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال رقم الملف.",
      });
      return;
    }

    setLoading(true);
    const trimmedFileNumber = fileNumber.trim();

    // البحث في localStorage أولاً
    const localReport = localStorage.getItem(`report-${trimmedFileNumber}`);
    
    if (localReport) {
      toast({
        title: "تم العثور على التقرير محلياً",
        description: `جاري عرض تقرير الملف رقم: ${trimmedFileNumber}`,
      });
      router.push(`/report/${trimmedFileNumber}`);
      return;
    }

    // البحث في Firebase
    try {
      const q = query(
        collection(db, 'reports'),
        where('fileNumber', '==', trimmedFileNumber),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const reportData = querySnapshot.docs[0].data();
        
        // حفظ التقرير محلياً للوصول السريع
        localStorage.setItem(`report-${trimmedFileNumber}`, JSON.stringify(reportData.patientData));
        
        toast({
          title: "تم العثور على التقرير في السحابة",
          description: `جاري عرض تقرير الملف رقم: ${trimmedFileNumber}`,
        });
        router.push(`/report/${trimmedFileNumber}`);
      } else {
        toast({
          variant: "destructive",
          title: "لم يتم العثور على التقرير",
          description: "الرجاء التأكد من صحة رقم الملف.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث عن التقرير.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccess = (reportFileNumber: string) => {
    router.push(`/report/${reportFileNumber}`);
  };

  if (authLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-2xl bg-secondary/30 border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-3">
            <FileSearch className="h-8 w-8" />
            استعادة التقارير الطبية
          </CardTitle>
          <CardDescription className="text-lg">
            ابحث عن التقارير المحفوظة باستخدام رقم الملف أو تصفح التقارير الحديثة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">
                <Search className="ml-2 h-4 w-4" />
                البحث
              </TabsTrigger>
              <TabsTrigger value="recent">
                <History className="ml-2 h-4 w-4" />
                الأحدث
              </TabsTrigger>
              <TabsTrigger value="cloud">
                <Cloud className="ml-2 h-4 w-4" />
                السحابة
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="mt-6">
              <form onSubmit={handleRetrieve} className="space-y-6">
                <div>
                  <label htmlFor="fileNumber" className="block text-sm font-medium text-muted-foreground mb-2">
                    رقم الملف
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
                      disabled={loading}
                    />
                    <Button type="submit" size="lg" disabled={loading}>
                      {loading ? (
                        <>جاري البحث...</>
                      ) : (
                        <>
                          بحث
                          <ArrowRight className="mr-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="recent" className="mt-6">
              <div className="space-y-3">
                {recentReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد تقارير محلية حديثة
                  </p>
                ) : (
                  recentReports.map((report) => (
                    <Card 
                      key={report.fileNumber} 
                      className="cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => handleQuickAccess(report.fileNumber)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold">{report.patientName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {report.fileNumber}
                            </Badge>
                            <Database className="h-3 w-3" />
                            محلي
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(report.createdAt, { 
                            addSuffix: true,
                            locale: arSA 
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="cloud" className="mt-6">
              <div className="space-y-3">
                {cloudReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد تقارير محفوظة في السحابة
                  </p>
                ) : (
                  cloudReports.map((report) => (
                    <Card 
                      key={report.fileNumber} 
                      className="cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => handleQuickAccess(report.fileNumber)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold">{report.patientName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {report.fileNumber}
                            </Badge>
                            <Cloud className="h-3 w-3" />
                            سحابي
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(report.createdAt, { 
                            addSuffix: true,
                            locale: arSA 
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}