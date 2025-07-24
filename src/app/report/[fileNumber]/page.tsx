"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

import { generateEnhancedRehabPlan } from "@/ai/flows/generate-enhanced-rehab-plan";
import type { GenerateEnhancedRehabPlanOutput } from "@/types";
import type { PatientDataForAI } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { AlertCircle, Check, Loader2, Printer, Save, UploadCloud } from "lucide-react";

type ReportData = PatientDataForAI & GenerateEnhancedRehabPlanOutput;

type PageState = 'loading' | 'generating' | 'displaying' | 'error';

export default function ReportPage() {
  const { fileNumber } = useParams() as { fileNumber: string };
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadReport();
  }, [user, authLoading, fileNumber, router]);

  const loadReport = async () => {
    if (!user) return;
    setPageState('loading');
    setErrorMessage(null);
    setIsSaved(false);
  
    try {
      // 1. Try to fetch from Firestore first (from the new subcollection path)
      const reportDocRef = doc(db, "users", user.uid, "reports", fileNumber);
      const reportDoc = await getDoc(reportDocRef);
  
      if (reportDoc.exists()) {
        const data = reportDoc.data();
        // Convert Firestore Timestamp to JS Date object
        if (data.createdAt && data.createdAt instanceof Timestamp) {
            data.createdAt = data.createdAt.toDate();
        }
        setReportData(data as ReportData);
        setIsSaved(true);
        setPageState('displaying');
        toast({ title: "تم استعراض التقرير بنجاح", description: "تم تحميل التقرير المحفوظ من السحابة." });
        return;
      }
      
      // 2. If not in Firestore, check localStorage for patient data
      const localDataString = localStorage.getItem(`report-${fileNumber}`);
      if (!localDataString) {
        throw new Error("لم يتم العثور على بيانات التقييم لهذا الملف. يرجى البدء من جديد.");
      }
      
      const patientData: PatientDataForAI = JSON.parse(localDataString);
      
      // 3. Generate the report using AI
      setPageState('generating');
      const aiInput = {
        job: patientData.job,
        symptoms: patientData.symptoms,
        age: patientData.age,
        gender: patientData.gender,
        neck: patientData.neck,
        trunk: patientData.trunk,
        standing: patientData.standing,
        walking: patientData.walking,
        medications: patientData.medications,
        fractures: patientData.fractures,
      };
  
      const aiOutput = await generateEnhancedRehabPlan(aiInput);
      
      setReportData({ ...patientData, ...aiOutput });
      setPageState('displaying');
  
    } catch (error: any) {
      console.error("Error loading or generating report:", error);
      let message = "حدث خطأ غير متوقع.";
       if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
          message = "ليس لديك الصلاحية لعرض هذا التقرير أو حدث خطأ في الصلاحيات. تأكد من أن قواعد الأمان في Firebase صحيحة.";
      } else if (error.message && error.message.includes("not found")) {
        message = "لم يتم العثور على التقرير. قد يكون الرقم غير صحيح أو تم حذفه.";
      } else if (error.message && error.message.includes("AI")) {
        message = `فشل توليد التقرير بالذكاء الاصطناعي: ${error.message}`;
      } else {
        message = error.message;
      }
      setErrorMessage(message);
      setPageState('error');
    }
  };
  
  const handleSaveToCloud = () => {
    if (!reportData || !user) {
      toast({ variant: "destructive", title: "خطأ", description: "لا توجد بيانات لحفظها." });
      return;
    }

    startSavingTransition(async () => {
      try {
        // Use the new subcollection path for saving
        const reportDocRef = doc(db, "users", user.uid, "reports", reportData.fileNumber);
        
        // Remove userId as it's redundant now
        const { ...dataToSave } = {
          ...reportData,
          createdAt: Timestamp.now(),
        };

        await setDoc(reportDocRef, dataToSave);

        setIsSaved(true);
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ التقرير في حسابك السحابي.",
        });
      } catch (error) {
        console.error("Error saving to cloud:", error);
        toast({
          variant: "destructive",
          title: "فشل الحفظ",
          description: "لم نتمكن من حفظ التقرير في السحابة. تحقق من اتصالك بالإنترنت وقواعد الأمان.",
        });
      }
    });
  };

  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        );
      case 'generating':
        return (
          <Card className="flex flex-col items-center justify-center p-12 text-center bg-secondary/50 border-primary/20 animate-pulse">
            <Logo className="w-24 h-24 mb-6 animate-spin" showText={false} />
            <h2 className="text-2xl font-bold text-primary">جاري إنشاء التقرير الشامل...</h2>
            <p className="text-muted-foreground mt-2">يقوم نظام الذكاء الاصطناعي بتحليل البيانات لتوليد خطة تأهيلية دقيقة. قد تستغرق هذه العملية دقيقة.</p>
          </Card>
        );
      case 'error':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ فادح</AlertTitle>
            <AlertDescription>
              {errorMessage}
              <div className="mt-4">
                <Button onClick={() => router.push('/assessment')}>البدء من جديد</Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      case 'displaying':
        if (!reportData) return null;
        return (
          <>
            <header className="flex flex-col sm:flex-row items-center justify-between mb-8 no-print">
              <h1 className="text-3xl font-bold text-primary mb-4 sm:mb-0">
                التقرير الطبي الشامل
              </h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                   <Printer className="ml-2 h-4 w-4"/>
                  طباعة / حفظ PDF
                </Button>
                 {isSaved ? (
                  <Button disabled variant="secondary">
                     <Check className="ml-2 h-4 w-4"/>
                    تم الحفظ بنجاح
                  </Button>
                ) : (
                  <Button onClick={handleSaveToCloud} disabled={isSaving}>
                     {isSaving ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin"/>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="ml-2 h-4 w-4"/>
                        الحفظ في السحابة
                      </>
                    )}
                  </Button>
                )}
              </div>
            </header>

            {/* Patient Info Card */}
            <Card className="mb-8 print:shadow-none print:border">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-6 h-6 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6"/><path d="M22 16h-6"/></svg></div>
                  معلومات المريض
                </CardTitle>
                <CardDescription>ملخص بيانات التقييم الأساسي</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                  <div><strong className="block text-muted-foreground">اسم المريض:</strong> {reportData.name}</div>
                  <div><strong className="block text-muted-foreground">العمر:</strong> {reportData.age}</div>
                  <div><strong className="block text-muted-foreground">الجنس:</strong> {reportData.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
                  <div><strong className="block text-muted-foreground">رقم الملف:</strong> <span className="font-mono">{reportData.fileNumber}</span></div>
                  <div className="col-span-2"><strong className="block text-muted-foreground">الوظيفة:</strong> {reportData.job}</div>
                  <div className="col-span-2 md:col-span-4"><strong className="block text-muted-foreground">الأعراض الرئيسية:</strong> {reportData.symptoms}</div>
                </div>
              </CardContent>
            </Card>

            <Accordion type="multiple" defaultValue={["diagnosis", "plan", "precautions"]} className="w-full space-y-4">
              {/* Diagnosis */}
              <AccordionItem value="diagnosis">
                <Card className="print:shadow-none print:border">
                  <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                     <div className="flex items-center gap-3">
                      <div className="w-6 h-6 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
                      التشخيص الأولي والتوقعات
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <div className="space-y-4 prose prose-sm max-w-none">
                      <h4>التشخيص الوظيفي المبدئي:</h4>
                      <p>{reportData.initialDiagnosis}</p>
                      <h4>التوقعات المتوقعة (Prognosis):</h4>
                      <p>{reportData.prognosis}</p>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Rehab Plan */}
              <AccordionItem value="plan">
                <Card className="print:shadow-none print:border">
                  <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></div>
                      خطة التأهيل المقترحة (12 أسبوع)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: reportData.rehabPlan.replace(/\n/g, '<br />') }} />
                  </AccordionContent>
                </Card>
              </AccordionItem>

              {/* Precautions */}
              <AccordionItem value="precautions">
                <Card className="print:shadow-none print:border">
                  <AccordionTrigger className="px-6 text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg></div>
                      الاحتياطات والاعتبارات الهامة
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <div className="grid md:grid-cols-2 gap-6 prose prose-sm max-w-none">
                      <div>
                        <h4>الاحتياطات العامة:</h4>
                        <p>{reportData.precautions}</p>
                      </div>
                      <div>
                        <h4>تأثير الأدوية:</h4>
                        <p>{reportData.medicationsInfluence}</p>
                      </div>
                      <div>
                        <h4>اعتبارات الكسور:</h4>
                        <p>{reportData.fracturesInfluence}</p>
                      </div>
                      <div>
                        <h4>جدول المتابعة المقترح:</h4>
                        <p>{reportData.reviewAppointments}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          </>
        );
    }
  };

  return <div className="max-w-5xl mx-auto">{renderContent()}</div>;
}
