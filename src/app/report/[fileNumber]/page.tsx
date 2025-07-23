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
import { AlertCircle, User, FileText, Bot, Lightbulb, ShieldCheck, CalendarClock, LineChart, Stethoscope, Activity, FilePlus, BrainCircuit, Target, Shield, HeartPulse, Bone, Briefcase } from "lucide-react";
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
    const formattedText = text
      .replace(/【(.*?)】/g, '<strong>$1</strong>')
      .replace(/═══════════════════════════════════════/g, '<hr class="my-4 border-dashed border-border" />')
      .replace(/✓/g, '<span class="text-green-400 ml-2">✓</span>')
      .replace(/▸/g, '<span class="text-primary ml-2">▸</span>')
      .replace(/⚠️/g, '<span class="text-yellow-400 ml-2">⚠️</span>')
      .replace(/📅/g, '<span class="text-blue-400 ml-2">📅</span>')
      .replace(/📋/g, '<span class="text-indigo-400 ml-2">📋</span>')
      .replace(/\n/g, '<br />');
      
    return <div className="prose prose-sm max-w-none text-muted-foreground rtl:prose-rtl" dangerouslySetInnerHTML={{ __html: formattedText }} />;
};
  
  if (loading) {
     return (
        <div className="space-y-6">
          <Card className="bg-secondary/30 text-center p-8">
            <CardHeader>
              <div className="flex justify-center items-center mb-4">
                 <div className="relative w-24 h-24">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-primary/20 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="absolute inset-4 bg-card border-2 border-primary/50 rounded-full flex items-center justify-center">
                        <Bot className="text-primary w-12 h-12" />
                    </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-headline">
                جاري إنشاء تقرير التأهيل الطبي...
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
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-24 w-full" />
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
    <div className="space-y-8">
      <Card className="bg-secondary/30">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            {patientData && (
                <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><User />بيانات المريض</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">الاسم:</span>
                        <span>{patientData.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">العمر:</span>
                        <span>{patientData.age}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">الجنس:</span>
                        <span>{patientData.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">المهنة:</span>
                        <span>{patientData.job}</span>
                    </div>
                    <Separator/>
                    <div className="pt-2">
                        <strong className="block text-muted-foreground mb-2">الأعراض الرئيسية:</strong>
                        <p>{patientData.symptoms}</p>
                    </div>
                </CardContent>
                </Card>
            )}
            {patientData && (
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Activity />الحالة الوظيفية</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">تحكم الرقبة:</span><span>{patientData.neck}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">تحكم الجذع:</span><span>{patientData.trunk}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">الوقوف:</span><span>{patientData.standing}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">المشي:</span><span>{patientData.walking}</span></div>
                    </CardContent>
                </Card>
            )}
            {patientData && (
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-primary"><HeartPulse />التاريخ الطبي</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                         <div>
                            <strong className="flex items-center gap-2 text-muted-foreground mb-2"><Shield size={16}/>الأدوية</strong>
                            <p>{patientData.medications}</p>
                         </div>
                         <div>
                            <strong className="flex items-center gap-2 text-muted-foreground mb-2"><Bone size={16}/>الكسور</strong>
                            <p>{patientData.fractures}</p>
                         </div>
                    </CardContent>
                </Card>
            )}
        </div>
        
        <div className="lg:col-span-2 space-y-8">
            {rehabPlan && (
                <>
                <Card className="bg-secondary/20">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope /> التشخيص المبدئي</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{rehabPlan.initialDiagnosis}</p></CardContent>
                </Card>

                <Card className="bg-secondary/20">
                    <CardHeader><CardTitle className="flex items-center gap-2"><LineChart /> التوقع العلمي للحالة (Prognosis)</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{rehabPlan.prognosis}</p></CardContent>
                </Card>
                </>
            )}

            <Accordion type="multiple" className="space-y-8">
                {consideration && (
                    <Card>
                        <AccordionItem value="ai-analysis" className="border-b-0">
                            <AccordionTrigger className="p-6 hover:no-underline">
                                <CardTitle className="flex items-center gap-2 text-primary"><Lightbulb />تحليل الذكاء الاصطناعي للاعتبارات الطبية</CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <div className="space-y-4">
                                    <div>
                                    <h4 className="font-semibold mb-2">تأثير الأدوية:</h4>
                                    <p className="text-muted-foreground">{consideration.medicationsInfluence}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                    <h4 className="font-semibold mb-2">تأثير الكسور:</h4>
                                    <p className="text-muted-foreground">{consideration.fracturesInfluence}</p>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )}

                {rehabPlan && (
                    <>
                    <Card>
                         <AccordionItem value="rehab-plan" className="border-b-0">
                             <AccordionTrigger className="p-6 hover:no-underline">
                                <CardTitle className="flex items-center gap-2 text-primary"><Target /> الخطة التأهيلية المقترحة</CardTitle>
                             </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                {renderFormattedPlan(rehabPlan.rehabPlan)}
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <AccordionItem value="precautions" className="border-b-0">
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck size={20}/> الاحتياطات</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <p className="text-muted-foreground">{rehabPlan.precautions}</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                        <Card>
                             <AccordionItem value="appointments" className="border-b-0">
                                <AccordionTrigger className="p-6 hover:no-underline">
                                     <CardTitle className="flex items-center gap-2 text-base"><CalendarClock size={20}/> مواعيد المراجعة</CardTitle>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <p className="text-muted-foreground">{rehabPlan.reviewAppointments}</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                    </div>
                    </>
                )}
            </Accordion>
        </div>
      </div>
    </div>
  );
}
