"use client";

import { useState, useEffect, useTransition, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileText, User, Calendar, Briefcase, Stethoscope,
  AlertTriangle, Printer, Download, Loader2, Database, Zap, CheckCircle, Clock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type ReportGenerationState = 'idle' | 'checking_cache' | 'fetching_db' | 'generating_ai' | 'done' | 'error';

const PatientInfoCard = memo(({ patientData }: { patientData: PatientDataForAI }) => (
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
        <p className="font-semibold mb-2 flex items-center gap-2"><Stethoscope className="text-primary"/>الأعراض الرئيسية:</p>
        <p className="text-muted-foreground bg-secondary/50 p-3 rounded-md">{patientData.symptoms}</p>
      </div>
    </CardContent>
  </Card>
));
PatientInfoCard.displayName = 'PatientInfoCard';

const ReportSection = memo(({ title, content, icon }: { title: string; content: string; icon: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />
    </CardContent>
  </Card>
));
ReportSection.displayName = 'ReportSection';

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
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const saveReportToDb = useCallback(async (
    fileNum: string,
    patient: PatientDataForAI,
    reportData: GenerateEnhancedRehabPlanOutput,
    userId: string
  ) => {
    try {
      const reportDocRef = doc(db, 'reports', fileNum);
      await setDoc(reportDocRef, {
        userId,
        fileNumber: fileNum,
        patientName: patient.name,
        createdAt: new Date(),
        patientData: patient,
        report: reportData,
      });
      return true;
    } catch (e) {
      console.error('Save to DB failed:', e);
      toast({
        variant: "destructive",
        title: "فشل الحفظ في السحابة",
        description: "حدث خطأ أثناء محاولة حفظ التقرير. يرجى المحاولة مرة أخرى.",
      });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    if (!fileNumber || !user || loading) return;

    const loadData = async () => {
      setGenerationState('fetching_db');
      setProgress(25);

      try {
        const reportDocRef = doc(db, 'reports', fileNumber);
        const docSnap = await getDoc(reportDocRef);

        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          const data = docSnap.data();
          setPatientData(data.patientData);
          setReport(data.report);
          setGenerationState('done');
          setProgress(100);
          toast({ title: "تم استعادة التقرير من السحابة بنجاح" });
          return;
        }

        setGenerationState('checking_cache');
        setProgress(50);
        const localDataString = localStorage.getItem(`report-${fileNumber}`);
        
        if (!localDataString) {
          setError("لم يتم العثور على بيانات المريض. يرجى إنشاء تقييم جديد.");
          setGenerationState('error');
          router.push('/assessment');
          return;
        }
        
        const parsedData: PatientDataForAI = JSON.parse(localDataString);
        setPatientData(parsedData);
        
        setGenerationState('generating_ai');
        setProgress(75);

        const generatedReport = await generateEnhancedRehabPlan(parsedData);
        setReport(generatedReport);
        setProgress(100);
        setGenerationState('done');
        
        // Save the newly generated report to DB automatically
        await saveReportToDb(fileNumber, parsedData, generatedReport, user.uid);
        toast({
          title: "تم إنشاء التقرير وحفظه في السحابة بنجاح"
        });

      } catch (e: any) {
        console.error('Data loading/generation error:', e);
        setError(e.message || 'فشل تحميل أو توليد التقرير');
        setGenerationState('error');
      }
    };

    loadData();

  }, [fileNumber, user, loading, router, toast, saveReportToDb]);

  const handleManualSave = () => {
    if (!report || !patientData || !user) return;
    startSavingTransition(async () => {
      const success = await saveReportToDb(fileNumber, patientData, report, user.uid);
      if (success) {
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ التقرير في السحابة.",
        });
      }
    });
  };

  const StatusIndicator = useMemo(() => {
    const statusConfig: Record<ReportGenerationState, { icon: React.ElementType, text: string, color: string }> = {
      idle: { icon: Clock, text: "جاري التحضير...", color: "text-gray-500" },
      fetching_db: { icon: Database, text: "البحث في التقارير المحفوظة...", color: "text-blue-500" },
      checking_cache: { icon: Zap, text: "فحص البيانات المحلية...", color: "text-yellow-500" },
      generating_ai: { icon: Zap, text: "توليد تقرير جديد بالذكاء الاصطناعي...", color: "text-purple-500 animate-pulse" },
      done: { icon: CheckCircle, text: "اكتمل بنجاح!", color: "text-green-500" },
      error: { icon: AlertTriangle, text: "حدث خطأ", color: "text-red-500" },
    };

    const currentStatus = statusConfig[generationState];
    const Icon = currentStatus.icon;

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon className={`h-5 w-5 ${currentStatus.color}`} />
            <span className="font-medium">{currentStatus.text}</span>
          </div>
          {generationState !== 'done' && generationState !== 'error' && (
            <Progress value={progress} className="h-2" />
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </CardContent>
      </Card>
    );
  }, [generationState, progress, error]);

  if (loading || (!user && !loading) || generationState === 'idle') {
    return <LoadingSkeleton />;
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              تقرير WASL AI
            </h1>
            <p className="text-muted-foreground mt-2">
              تقرير مولد بالذكاء الاصطناعي - نظام WASL
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </Button>
            {report && (
              <Button onClick={handleManualSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
                حفظ
              </Button>
            )}
          </div>
        </div>
        <Separator className="my-6" />
      </header>

      {StatusIndicator}

      <div className="space-y-6">
        {patientData ? <PatientInfoCard patientData={patientData} /> : <Skeleton className="h-64" />}

        {report ? (
          <>
            <ReportSection
              title="التشخيص المبدئي والتوقعات"
              icon={<Stethoscope />}
              content={`<h3>التشخيص المبدئي</h3><p>${report.initialDiagnosis}</p><br/><h3>التوقعات</h3><p>${report.prognosis}</p>`}
            />

            <Card>
               <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> خطة التأهيل الشاملة</CardTitle></CardHeader>
               <CardContent>
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: report.rehabPlan.replace(/## /g, '<h3>').replace(/\n/g, '<br/>') }} />
               </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle />الاحتياطات والاعتبارات الطبية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="precautions" className="w-full">
                  <AccordionItem value="precautions">
                    <AccordionTrigger>الاحتياطات العامة</AccordionTrigger>
                    <AccordionContent>{report.precautions}</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="medications">
                    <AccordionTrigger>تأثير الأدوية</AccordionTrigger>
                    <AccordionContent>{report.medicationsInfluence}</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="fractures">
                    <AccordionTrigger>تأثير الكسور</AccordionTrigger>
                    <AccordionContent>{report.fracturesInfluence}</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="appointments">
                    <AccordionTrigger>جدول المتابعة</AccordionTrigger>
                    <AccordionContent>{report.reviewAppointments}</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </>
        ) : (
          generationState !== 'error' && <LoadingSkeleton />
        )}
      </div>
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <Skeleton className="h-12 w-1/2" />
      <Skeleton className="h-10 w-24" />
    </div>
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

export default function ReportPage() {
  return <ReportView />;
}
