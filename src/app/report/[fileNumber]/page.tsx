
"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '@/lib/firebase';
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
import { AlertCircle, Check, Loader2, Printer, UploadCloud } from "lucide-react";

type ReportData = PatientDataForAI & GenerateEnhancedRehabPlanOutput & { ownerId?: string; createdAt?: any };

type PageState = 'loading' | 'displaying' | 'error';

export default function ReportPage() {
  const { fileNumber } = useParams() as { fileNumber: string };
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadReport();
  }, [user, authLoading, fileNumber]);

  const loadReport = async () => {
    setPageState('loading');
    setErrorMessage(null);
  
    try {
      const reportDocRef = doc(db, "reports", fileNumber);
      const reportDoc = await getDoc(reportDocRef);
  
      if (reportDoc.exists()) {
        const data = reportDoc.data() as ReportData;
        setReportData(data);
        setPageState('displaying');
        toast({ title: "تم استعراض التقرير بنجاح", description: "تم تحميل التقرير من السحابة." });
      } else {
        throw new Error("لم يتم العثور على التقرير. قد يكون الرقم غير صحيح أو لم يتم إنشاؤه بعد.");
      }
    } catch (error: any) {
      console.error("Error loading report:", error);
      let message = "حدث خطأ غير متوقع.";
       if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
          message = "ليس لديك الصلاحية لعرض هذا التقرير.";
      } else {
        message = error.message;
      }
      setErrorMessage(message);
      setPageState('error');
    }
  };
  

  const renderHeader = () => (
    <header className="flex flex-col sm:flex-row items-center justify-between mb-8 no-print">
      <h1 className="text-3xl font-bold text-primary mb-4 sm:mb-0">
        التقرير الطبي الشامل
      </h1>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.print()} disabled={pageState !== 'displaying'}>
           <Printer className="ml-2 h-4 w-4"/>
          طباعة / حفظ PDF
        </Button>
      </div>
    </header>
  );

  const renderPatientInfo = () => {
    if (pageState !== 'displaying' || !reportData) {
        return (
            <Card className="mb-8">
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>
        );
    }
    return (
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
    );
  }

  const renderAccordion = () => {
    if (pageState !== 'displaying' || !reportData) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }
    return (
        <Accordion type="multiple" defaultValue={["diagnosis", "plan", "precautions"]} className="w-full space-y-4">
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
    );
  }

  const renderBody = () => {
    if (pageState === 'loading') {
       return (
             <div className="space-y-6">
                <Skeleton className="h-32 w-full"/>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }
    if (pageState === 'error') {
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
    }
    
    return (
        <>
            {renderPatientInfo()}
            {renderAccordion()}
        </>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {renderHeader()}
      {renderBody()}
    </div>
  );
}
