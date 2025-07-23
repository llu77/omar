"use client";

import { useEffect, useState, use } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PatientDataForAI } from "@/types";
import { considerPatientInfo } from "@/ai/flows/consider-patient-info";
import type { ConsiderPatientInfoOutput } from "@/ai/flows/consider-patient-info";
import { generateRehabPlan } from "@/ai/flows/generate-rehab-plan";
import type { GenerateRehabPlanOutput } from "@/ai/flows/generate-rehab-plan";
import { AlertCircle, User, FileText, Bot, Lightbulb, ShieldCheck, CalendarClock, LineChart, Briefcase, Stethoscope, Activity, FilePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ReportPage({
  params: paramsPromise,
}: {
  params: Promise<{ fileNumber: string }>;
}) {
  const params = use(paramsPromise);
  const [patientData, setPatientData] = useState<PatientDataForAI | null>(null);
  const [consideration, setConsideration] = useState<ConsiderPatientInfoOutput | null>(null);
  const [rehabPlan, setRehabPlan] = useState<GenerateRehabPlanOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fileNumber = params.fileNumber;
    if (!fileNumber) {
        setLoading(false);
        setError("رقم الملف غير موجود.");
        return;
    };

    const generateReports = async (data: PatientDataForAI) => {
      try {
        setLoading(true);
        setError(null);
        
        const [considerationResult, rehabPlanResult] = await Promise.all([
          considerPatientInfo(data),
          generateRehabPlan(data),
        ]);

        setConsideration(considerationResult);
        setRehabPlan(rehabPlanResult);
      } catch (aiError: any) {
        console.error("AI Generation Error:", aiError);
        setError(aiError.message || "حدث خطأ أثناء توليد التقرير بواسطة الذكاء الاصطناعي.");
      } finally {
        setLoading(false);
      }
    };

    try {
      const savedData = localStorage.getItem(`report-${fileNumber}`);
      if (!savedData) {
        throw new Error("لم يتم العثور على بيانات التقرير.");
      }
      const parsedData: PatientDataForAI = JSON.parse(savedData);
      setPatientData(parsedData);
      generateReports(parsedData);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, [params.fileNumber]);

  const renderFormattedPlan = (text: string) => {
    // Replace markdown-like bolding with strong tags
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const sections = formattedText.split(/(\d+\.\s+**Week \d+.*)/).filter(Boolean);

    if (sections.length <= 1) {
        return <div dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />;
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            {Array.from({ length: Math.ceil(sections.length / 2) }).map((_, index) => {
                const title = sections[index * 2];
                const content = sections[index * 2 + 1];

                return (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-lg font-semibold" dangerouslySetInnerHTML={{ __html: title }} />
                        <AccordionContent>
                           <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
};
  
  if (loading) {
     return (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-headline flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot />
                  جاري إنشاء تقرير التأهيل الطبي...
                </div>
                <Skeleton className="h-8 w-40" />
              </CardTitle>
              <CardDescription>
                يقوم الذكاء الاصطناعي بتحليل البيانات الآن. قد يستغرق هذا بضع لحظات.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
        </div>
      )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>خطأ في عرض التقرير</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText />
              تقرير التأهيل الطبي
            </div>
            {patientData && <Badge variant="secondary" className="text-lg font-mono">{patientData.fileNumber}</Badge>}
          </CardTitle>
          <CardDescription>
            هذا التقرير تم إنشاؤه بواسطة الذكاء الاصطناعي ويجب مراجعته من قبل أخصائي مؤهل.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {patientData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User />ملخص بيانات المريض</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              <div><strong className="block text-muted-foreground">الاسم</strong> {patientData.name}</div>
              <div><strong className="block text-muted-foreground">العمر</strong> {patientData.age}</div>
              <div><strong className="block text-muted-foreground">الجنس</strong> {patientData.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
              <div><strong className="block text-muted-foreground">المهنة</strong> {patientData.job}</div>
              <div className="col-span-full"><strong className="block text-muted-foreground">الأعراض</strong> {patientData.symptoms}</div>
              <Separator className="col-span-full my-2"/>
              <div><strong className="block text-muted-foreground">تحكم الرقبة</strong> {patientData.neck}</div>
              <div><strong className="block text-muted-foreground">تحكم الجذع</strong> {patientData.trunk}</div>
              <div><strong className="block text-muted-foreground">الوقوف</strong> {patientData.standing}</div>
              <div><strong className="block text-muted-foreground">المشي</strong> {patientData.walking}</div>
              <Separator className="col-span-full my-2"/>
              <div className="col-span-full"><strong className="block text-muted-foreground">الأدوية</strong> {patientData.medications}</div>
              <div className="col-span-full"><strong className="block text-muted-foreground">الكسور</strong> {patientData.fractures}</div>
          </CardContent>
        </Card>
      )}

      {consideration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent"><Lightbulb />اعتبارات الخطة العلاجية (تحليل أولي)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">تأثير الأدوية:</h4>
              <p className="text-muted-foreground">{consideration.medicationsInfluence}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">تأثير الكسور:</h4>
              <p className="text-muted-foreground">{consideration.fracturesInfluence}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {rehabPlan && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Stethoscope /> التشخيص المبدئي</CardTitle></CardHeader>
            <CardContent><p>{rehabPlan.initialDiagnosis}</p></CardContent>
          </Card>

           <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><LineChart /> التوقع العلمي للحالة</CardTitle></CardHeader>
            <CardContent><p>{rehabPlan.prognosis}</p></CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary"><FilePlus /> الخطة التأهيلية المقترحة</CardTitle>
            </CardHeader>
            <CardContent>
                {renderFormattedPlan(rehabPlan.rehabPlan)}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
              <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck size={20}/> الاحتياطات</CardTitle></CardHeader>
                  <CardContent><p>{rehabPlan.precautions}</p></CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock size={20}/> مواعيد المراجعة</CardTitle></CardHeader>
                  <CardContent><p>{rehabPlan.reviewAppointments}</p></CardContent>
              </Card>
          </div>
        </div>
      )}
    </div>
  );
}
