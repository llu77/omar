"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { PatientDataForAI } from "@/types";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { considerPatientInfo, ConsiderPatientInfoOutput } from "@/ai/flows/consider-patient-info";
import { generateRehabPlan, GenerateRehabPlanOutput } from "@/ai/flows/generate-rehab-plan";
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
  BrainCircuit, Activity, Clock, Loader2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type ReportGenerationState = 'idle' | 'considering' | 'generating' | 'done' | 'error';

export default function ReportPage({ params }: { params: { fileNumber: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const [isSaving, startSavingTransition] = useTransition();

  const [patientData, setPatientData] = useState<PatientDataForAI | null>(null);
  const [considerations, setConsiderations] = useState<ConsiderPatientInfoOutput | null>(null);
  const [rehabPlan, setRehabPlan] = useState<GenerateRehabPlanOutput | null>(null);
  const [generationState, setGenerationState] = useState<ReportGenerationState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const runAIFlows = useCallback(async (data: PatientDataForAI) => {
    setGenerationState('considering');
    setError(null);
    try {
      const infoConsiderations = await considerPatientInfo(data);
      setConsiderations(infoConsiderations);
      
      setGenerationState('generating');
      const plan = await generateRehabPlan(data);
      setRehabPlan(plan);
      
      setGenerationState('done');
      toast({
        title: "اكتمل إنشاء التقرير بنجاح",
        description: "تم تحليل بيانات المريض وتوليد خطة تأهيل مخصصة.",
      });

    } catch (e: any) {
      console.error("AI flow error:", e);
      setGenerationState('error');
      setError("حدث خطأ أثناء توليد الخطة بالذكاء الاصطناعي. قد تكون هناك مشكلة في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
      toast({
        variant: "destructive",
        title: "خطأ في الذكاء الاصطناعي",
        description: e.message || "فشل الاتصال بنماذج الذكاء الاصطناعي.",
      });
    }
  }, [toast]);

  useEffect(() => {
    try {
      const data = localStorage.getItem(`report-${params.fileNumber}`);
      if (data) {
        const parsedData = JSON.parse(data);
        setPatientData(parsedData);
        if (generationState === 'idle') {
          runAIFlows(parsedData);
        }
      } else if (generationState !== 'done') {
        setGenerationState('error');
        setError("لم يتم العثور على بيانات المريض. قد تكون انتهت صلاحية الجلسة.");
      }
    } catch (e) {
      setGenerationState('error');
      setError("فشل في قراءة بيانات المريض من التخزين المحلي.");
    }
  }, [params.fileNumber, runAIFlows, generationState]);

  const handleSaveReport = () => {
    if (!rehabPlan || !patientData || !user) return;

    startSavingTransition(async () => {
      try {
        const reportDocRef = doc(db, 'reports', patientData.fileNumber);
        await setDoc(reportDocRef, {
          userId: user.uid,
          fileNumber: patientData.fileNumber,
          patientName: patientData.name,
          createdAt: new Date(),
          patientData: patientData,
          rehabPlan: rehabPlan,
          considerations: considerations,
        });

        toast({
          title: "تم حفظ التقرير بنجاح",
          description: "يمكنك الآن العثور على هذا التقرير في قسم 'تقاريري'.",
        });
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
      idle: { icon: <Clock className="animate-spin" />, text: "في انتظار بيانات المريض...", bg: "bg-gray-100 dark:bg-gray-800" },
      considering: { icon: <BrainCircuit className="animate-pulse" />, text: "تحليل الاعتبارات الطبية (الأدوية والكسور)...", bg: "bg-blue-100 dark:bg-blue-900/30" },
      generating: { icon: <Sparkles className="animate-pulse" />, text: "توليد خطة التأهيل المخصصة...", bg: "bg-purple-100 dark:bg-purple-900/30" },
      done: { icon: <CheckCircle className="text-green-500" />, text: "اكتمل التقرير بنجاح!", bg: "bg-green-100 dark:bg-green-900/30" },
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
              تقرير وصّل 
            </h1>
            <p className="text-muted-foreground mt-2">
              تقرير تم إنشاؤه بواسطة الذكاء الاصطناعي - وصّل
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </Button>
            {generationState === 'done' && (
              <Button onClick={handleSaveReport} disabled={isSaving}>
                {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="ml-2 h-4 w-4" />}
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

        {rehabPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Stethoscope />التشخيص والتوقعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">التشخيص الأولي</h3>
                <p className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">{rehabPlan.initialDiagnosis}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">التنبؤ للحالة (Prognosis)</h3>
                <p className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">{rehabPlan.prognosis}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {rehabPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity />خطة التأهيل الشاملة</CardTitle>
              <CardDescription>برنامج علاجي مفصل   </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap font-body text-sm bg-secondary/50 p-4 rounded-lg">{rehabPlan.rehabPlan}</div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {considerations && rehabPlan && (
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle />الاحتياطات والاعتبارات الطبية</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-semibold">الاحتياطات العامة</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {rehabPlan.precautions}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2"><HeartPulse/>تأثير الأدوية</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {considerations.medicationsInfluence}
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-semibold flex items-center gap-2"><Bone/>تأثير الكسور</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {considerations.fracturesInfluence}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-lg font-semibold">جدول المتابعة والمراجعات</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {rehabPlan.reviewAppointments}
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
