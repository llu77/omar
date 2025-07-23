"use client";

import { useEffect, useState, use } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PatientDataForAI } from "@/types";
import { considerPatientInfo } from "@/ai/flows/consider-patient-info";
import type { ConsiderPatientInfoOutput } from "@/ai/flows/consider-patient-info";
import { generateRehabPlan } from "@/ai/flows/generate-rehab-plan";
import type { GenerateRehabPlanOutput } from "@/ai/flows/generate-rehab-plan";
import { AlertCircle, User, FileText, Bot, Lightbulb, Target, ShieldCheck, CalendarClock, LineChart } from "lucide-react";
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
        const [considerationResult, rehabPlanResult] = await Promise.all([
          considerPatientInfo(data),
          generateRehabPlan(data),
        ]);
        setConsideration(considerationResult);
        setRehabPlan(rehabPlanResult);
      } catch (aiError) {
        console.error("AI Generation Error:", aiError);
        setError("حدث خطأ أثناء توليد التقرير بواسطة الذكاء الاصطناعي.");
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

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((paragraph, index) => (
      <p key={index} className="mb-2">{paragraph}</p>
    ));
  };
  
  if (loading) {
     return (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-headline flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText />
                  تقرير التأهيل الطبي
                </div>
                <Skeleton className="h-8 w-40" />
              </CardTitle>
              <CardDescription>
                هذا التقرير تم إنشاؤه بواسطة الذكاء الاصطناعي ويجب مراجعته من قبل أخصائي مؤهل.
              </CardDescription>
            </CardHeader>
          </Card>
          <Skeleton className="h-40 w-full" />
          <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
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
              <div><strong className="block text-muted-foreground">تحكم الرقبة</strong> {patientData.neck}</div>
              <div><strong className="block text-muted-foreground">تحكم الجذع</strong> {patientData.trunk}</div>
              <div><strong className="block text-muted-foreground">الوقوف</strong> {patientData.standing}</div>
              <div><strong className="block text-muted-foreground">المشي</strong> {patientData.walking}</div>
              <div className="col-span-2 md:col-span-3 lg:col-span-4"><strong className="block text-muted-foreground">الأدوية</strong> {patientData.medications}</div>
              <div className="col-span-2 md:col-span-3 lg:col-span-4"><strong className="block text-muted-foreground">الكسور</strong> {patientData.fractures}</div>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary"><Bot />الخطة التأهيلية المقترحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground">
                  {renderFormattedText(rehabPlan.rehabPlan)}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
              <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><LineChart size={20}/> نسبة التحسن المتوقعة</CardTitle></CardHeader>
                  <CardContent><p>{rehabPlan.expectedRecoveryRate}</p></CardContent>
              </Card>
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
