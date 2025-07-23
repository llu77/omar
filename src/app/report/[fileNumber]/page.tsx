"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import type { PatientDataForAI } from "@/types";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateEnhancedRehabPlan, GenerateEnhancedRehabPlanOutput } from "@/ai/flows/generate-enhanced-rehab-plan";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileText, User, Calendar, Briefcase, Stethoscope, HeartPulse, Bone,
  Sparkles, CheckCircle, AlertTriangle, Info, Printer, Bot, ShieldCheck,
  BrainCircuit, Activity, Clock, Loader2, Database, Download
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type ReportGenerationState = 'idle' | 'fetching_db' | 'generating_ai' | 'done' | 'error';
type ReportSource = 'db' | 'new' | null;

function ReportView() {
  const params = useParams();
  const fileNumber = params.fileNumber as string;
  const router = useRouter();
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const [isSaving, startSavingTransition] = useTransition();

  const [patientData, setPatientData] = useState<PatientDataForAI | null>(null);
  const [report, setReport] = useState<GenerateEnhancedRehabPlanOutput | null>(null);
  const [generationState, setGenerationState] = useState<ReportGenerationState>('idle');
  const [reportSource, setReportSource] = useState<ReportSource>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const fetchReportFromDb = useCallback(async (fileNum: string) => {
    if (!user) return;
    setGenerationState('fetching_db');
    setError(null);
    try {
      const reportDocRef = doc(db, 'reports', fileNum);
      const docSnap = await getDoc(reportDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure the report belongs to the current user for security
        if (data.userId === user.uid) {
          setPatientData(data.patientData);
          setReport(data.report);
          setReportSource('db');
          setGenerationState('done');
          toast({
            title: "تم تحميل التقرير المحفوظ",
            description: "يتم عرض التقرير من قاعدة البيانات السحابية.",
          });
          return true;
        } else {
          setError("ليس لديك صلاحية لعرض هذا التقرير.");
          setGenerationState('error');
          return false;
        }
      }
      return false; // Document does not exist
    } catch (e: any) {
      console.error("Error fetching from DB:", e);
      setError("حدث خطأ أثناء محاولة جلب التقرير من قاعدة البيانات.");
      setGenerationState('error');
      return false;
    }
  }, [user, toast]);

  const generateNewReport = useCallback(async () => {
    try {
      const localData = localStorage.getItem(`report-${fileNumber}`);
      if (localData) {
        const parsedData: PatientDataForAI = JSON.parse(localData);
        setPatientData(parsedData);
        
        setGenerationState('generating_ai');
        setError(null);
        setReportSource('new');
        
        const generatedReport = await generateEnhancedRehabPlan(parsedData);
        setReport(generatedReport);
        
        setGenerationState('done');
        toast({
          title: "اكتمل إنشاء التقرير بنجاح",
          description: "تم تحليل بيانات المريض وتوليد خطة تأهيل مخصصة.",
        });
      } else {
        setError("لم يتم العثور على بيانات المريض للبدء. يرجى إنشاء تقييم جديد.");
        setGenerationState('error');
      }
    } catch (e: any) {
      console.error("AI flow error:", e);
      setGenerationState('error');
      setError("حدث خطأ أثناء توليد الخطة بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
      toast({
        variant: "destructive",
        title: "خطأ في الذكاء الاصطناعي",
        description: e.message || "فشل الاتصال بنماذج الذكاء الاصطناعي.",
      });
    }
  }, [fileNumber, toast]);


  useEffect(() => {
    if (fileNumber && user) {
      fetchReportFromDb(fileNumber).then(found => {
        if (!found) {
          generateNewReport();
        }
      });
    }
  }, [fileNumber, user, fetchReportFromDb, generateNewReport]);


  const handleSaveReport = () => {
    if (!report || !patientData || !user) return;

    startSavingTransition(async () => {
      try {
        const reportDocRef = doc(db, 'reports', patientData.fileNumber);
        await setDoc(reportDocRef, {
          userId: user.uid,
          fileNumber: patientData.fileNumber,
          patientName: patientData.name,
          createdAt: new Date(),
          patientData: patientData,
          report: report,
        });

        toast({
          title: "تم حفظ التقرير بنجاح",
          description: "يمكنك الآن العثور على هذا التقرير في قسم 'تقاريري'.",
        });
        setReportSource('db'); // After saving, it's now considered as from DB
      } catch (error) {
        console.error("Error saving report:", error);
        toast({
          variant: "destructive",
          title: "خطأ في الحفظ",
          description: "لم نتمكن من حفظ التقرير في السحابة. سيبقى التقرير متاحاً محلياً.",
        });
      }
    });
  };

  const renderStatus = () => {
    const statusMap = {
      idle: { icon: <Clock className="animate-spin" />, text: "في الانتظار...", bg: "bg-gray-100 dark:bg-gray-800" },
      fetching_db: { icon: <Database className="animate-pulse" />, text: "جاري البحث في قاعدة البيانات...", bg: "bg-blue-100 dark:bg-blue-900/30" },
      generating_ai: { icon: <Sparkles className="animate-pulse" />, text: "لم يتم العثور على تقرير محفوظ، جاري إنشاء تقرير جديد...", bg: "bg-purple-100 dark:bg-purple-900/30" },
      done: { icon: <CheckCircle className="text-green-500" />, text: `اكتمل التحميل بنجاح! (${reportSource === 'db' ? 'من السحابة' : 'تقرير جديد'})`, bg: "bg-green-100 dark:bg-green-900/30" },
      error: { icon: <AlertTriangle className="text-red-500" />, text: "حدث خطأ", bg: "bg-red-100 dark:bg-red-900/30" },
    };
    const currentStatus = statusMap[generationState];
    return (
      <Card className={`mb-8 ${currentStatus.bg}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="text-primary">{currentStatus.icon}</div>
          <div>
            <p className="font-semibold">{currentStatus.text}</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (loading || (!patientData && generationState !== 'error')) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              WASL AI Report
            </h1>
            <p className="text-muted-foreground mt-2">
              AI-Generated Report - WASL AI
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </Button>
            {generationState === 'done' && reportSource === 'new' && (
              <Button onClick={handleSaveReport} disabled={isSaving}>
                {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
                حفظ في السحابة
              </Button>
            )}
          </div>
        </div>
        <Separator className="my-6" />
      </header>

      {renderStatus()}

      <div className="space-y-8">
        {patientData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User />معلومات المريض</CardTitle>
              <CardDescription>رقم الملف: <Badge variant="secondary" className="font-mono">{patientData.fileNumber}</Badge></CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 text-sm">
              <div className="flex items-center gap-2"><User className="text-primary"/><strong>الاسم:</strong> {patientData.name}</div>
              <div className="flex items-center gap-2"><Calendar className="text-primary"/><strong>العمر:</strong> {patientData.age} سنة</div>
              <div className="flex items-center gap-2"><Stethoscope className="text-primary"/><strong>الجنس:</strong> {patientData.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
              <div className="flex items-center gap-2 col-span-2 md:col-span-3"><Briefcase className="text-primary"/><strong>المهنة:</strong> {patientData.job}</div>
              <div className="col-span-2 md:col-span-3">
                <p className="font-semibold mb-2 flex items-center gap-2"><Info className="text-primary"/>الأعراض الرئيسية:</p>
                <p className="text-muted-foreground bg-secondary/50 p-3 rounded-md">{patientData.symptoms}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Stethoscope />التشخيص والتوقعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">التشخيص الأولي</h3>
                <p className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">{report.initialDiagnosis}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">التنبؤ للحالة (Prognosis)</h3>
                <p className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">{report.prognosis}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity />خطة التأهيل الشاملة</CardTitle>
              <CardDescription>برنامج علاجي مفصل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-body bg-secondary/50 p-4 rounded-lg">{report.rehabPlan}</div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {report && (
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle />الاحتياطات والاعتبارات الطبية</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-semibold">الاحتياطات العامة</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {report.precautions}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2"><HeartPulse/>تأثير الأدوية</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {report.medicationsInfluence}
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2"><Bone/>تأثير الكسور</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {report.fracturesInfluence}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-lg font-semibold">جدول المتابعة والمراجعات</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {report.reviewAppointments}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

export default function ReportPage({ params }: { params: { fileNumber: string } }) {
  return <ReportView />;
}
