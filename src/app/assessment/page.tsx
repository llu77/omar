"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { PatientDataForAI } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, Shield, User, FileText, Bot, Briefcase, 
  Stethoscope, Sparkles, UserCheck, HeartPulse, Bone,
  Brain, Loader2, Info, CheckCircle2, ArrowRight, ArrowLeft
} from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب (حرفين على الأقل)"),
  age: z.string().refine((val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0 && parseInt(val, 10) < 150, {
    message: "يجب أن يكون العمر رقمًا صحيحًا بين 1 و 150",
  }),
  gender: z.enum(["male", "female"], {
    required_error: "الجنس مطلوب",
  }),
  job: z.string().min(2, "المهنة مطلوبة"),
  symptoms: z.string().min(10, "يجب وصف الأعراض بشكل كافٍ (10 أحرف على الأقل)"),
  neck: z.enum(["yes", "partially", "no"], { required_error: "الحقل مطلوب" }),
  trunk: z.enum(["yes", "partially", "no"], { required_error: "الحقل مطلوب" }),
  standing: z.enum(["yes", "with assistance", "no"], {
    required_error: "الحقل مطلوب",
  }),
  walking: z.enum(["yes", "with assistance", "no"], {
    required_error: "الحقل مطلوب",
  }),
  medications: z.enum(["yes", "no"], { required_error: "الحقل مطلوب" }),
  medications_details: z.string().optional(),
  fractures: z.enum(["yes", "no"], { required_error: "الحقل مطلوب" }),
  fractures_details: z.string().optional(),
}).refine(data => data.medications !== 'yes' || (data.medications_details && data.medications_details.trim() !== ''), {
  message: 'يرجى تقديم تفاصيل عن الأدوية',
  path: ['medications_details'],
}).refine(data => data.fractures !== 'yes' || (data.fractures_details && data.fractures_details.trim() !== ''), {
  message: 'يرجى تقديم تفاصيل عن الكسور',
  path: ['fractures_details'],
});

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "المعلومات الأساسية", icon: UserCheck, fields: ['name', 'age', 'gender', 'job', 'symptoms'] },
  { id: 2, title: "التقييم الحركي", icon: Activity, fields: ['neck', 'trunk', 'standing', 'walking'] },
  { id: 3, title: "التاريخ الطبي", icon: HeartPulse, fields: ['medications', 'medications_details', 'fractures', 'fractures_details'] },
];

export default function AssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [fileNumber, setFileNumber] = useState("");
  const [user, loading] = useAuthState(auth);
  const [currentStep, setCurrentStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const year = new Date().getFullYear();
    const randomId = Math.floor(10000 + Math.random() * 90000);
    setFileNumber(`WSL-${year}-${randomId}`);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: "",
      gender: undefined,
      job: "",
      symptoms: "",
      medications: undefined,
      medications_details: "",
      fractures: undefined,
      fractures_details: "",
    },
    mode: "onTouched",
  });

  const watchedFields = useWatch({ control: form.control });

  useEffect(() => {
    const totalFields = Object.keys(form.getValues()).length - 2; // Exclude optional details fields initially
    const filledFields = Object.values(watchedFields).filter(value => value !== "" && value !== undefined).length;
    setFormProgress((filledFields / totalFields) * 100);
  }, [watchedFields, form]);
  

  const nextStep = async () => {
    const fieldsToValidate = steps[currentStep - 1].fields;
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  function onSubmit(values: FormValues) {
    startTransition(() => {
      try {
        const patientData: PatientDataForAI = {
          fileNumber,
          name: values.name,
          age: parseInt(values.age, 10),
          gender: values.gender,
          job: values.job,
          symptoms: values.symptoms,
          neck: values.neck,
          trunk: values.trunk,
          standing: values.standing,
          walking: values.walking,
          medications: values.medications === "yes" ? `نعم - ${values.medications_details}` : "لا",
          fractures: values.fractures === "yes" ? `نعم - ${values.fractures_details}` : "لا",
        };

        localStorage.setItem(`report-${fileNumber}`, JSON.stringify(patientData));
        toast({
          title: "تم حفظ البيانات بنجاح ✓",
          description: `جاري توجيهك لصفحة التقرير للملف رقم: ${fileNumber}`,
        });
        router.push(`/report/${fileNumber}`);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطأ في الحفظ المحلي",
          description: "لم نتمكن من حفظ بيانات النموذج. يرجى المحاولة مرة أخرى.",
        });
      }
    });
  }

  const radioOptions = {
    control: [
      { value: "yes", label: "تحكم كامل" },
      { value: "partially", label: "تحكم جزئي" },
      { value: "no", label: "لا يوجد تحكم" },
    ],
    assistance: [
      { value: "yes", label: "نعم، بشكل مستقل" },
      { value: "with assistance", label: "نعم، بمساعدة" },
      { value: "no", label: "لا" },
    ],
    yesNo: [
      { value: "yes", label: "نعم" },
      { value: "no", label: "لا" },
    ],
  };

  const renderRadioGroup = (name: keyof FormValues, options: {value: string; label: string}[]) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-wrap gap-4"
            >
              {options.map((option) => (
                <FormItem key={option.value} className="flex items-center space-x-2 space-x-reverse">
                  <FormControl>
                    <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                  </FormControl>
                  <FormLabel 
                    htmlFor={`${name}-${option.value}`} 
                    className="font-normal cursor-pointer"
                  >
                    {option.label}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
  
  if (loading || !user) {
    return (
      <div className="w-full mx-auto max-w-4xl space-y-8">
        <div className="text-center mb-10">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto mt-4" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto max-w-4xl">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <Logo className="w-24 h-24" showText={false} />
        </div>
        <h1 className="text-4xl font-bold font-headline flex items-center justify-center gap-3">
          <FileText className="text-primary" />
          نموذج تقييم المريض
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          نظام WASL AI لتوليد خطط تأهيلية مخصصة
        </p>
      </div>

      <div className="mb-8 p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">الخطوة الحالية: <span className="font-bold text-primary">{steps[currentStep - 1].title}</span></span>
          <span className="text-sm font-medium">{Math.round(formProgress)}%</span>
        </div>
        <Progress value={formProgress} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {currentStep === 1 && (
            <Card className="bg-card border-primary/20 shadow-lg animate-in fade-in-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                  <UserCheck />
                  المعلومات الأساسية والشخصية
                </CardTitle>
                <CardDescription>
                  يرجى إدخال البيانات الأساسية للمريض بدقة. هذه المعلومات هي حجر الأساس للخطة العلاجية.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المريض <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="الاسم الكامل" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>العمر <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input type="number" placeholder="بالسنوات" min="1" max="150" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجنس <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="job" render={({ field }) => (
                    <FormItem>
                      <FormLabel>مهنة المريض <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="مثال: موظف مكتبي، عامل بناء..." {...field} /></FormControl>
                      <FormDescription>المهنة    .</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div>
                    <FormLabel>رقم الملف</FormLabel>
                    <Input disabled value={fileNumber} className="mt-2 bg-muted/50 border-dashed font-mono" />
                    <FormDescription>يتم توليده تلقائياً ولا يمكن تغييره.</FormDescription>
                  </div>
                </div>
                <FormField control={form.control} name="symptoms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف الأعراض الرئيسية <span className="text-red-500">*</span></FormLabel>
                     <FormControl><Textarea placeholder="يرجى وصف الأعراض بالتفصيل، مثل مكان الألم، طبيعته، ومتى يزداد..." {...field} rows={4} /></FormControl>
                     <FormDescription>كلما كان الوصف أكثر تفصيلاً، كانت الخطة أدق.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}/>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
             <Card className="bg-card border-primary/20 shadow-lg animate-in fade-in-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                  <Activity />
                  تقييم الحالة الوظيفية والحركية
                </CardTitle>
                <CardDescription>
                  تقييم القدرات الحركية الحالية للمريض   .
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                  <FormField control={form.control} name="neck" render={() => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg font-semibold"><Brain className="w-5 h-5" />التحكم بالرقبة <span className="text-red-500">*</span></FormLabel>
                      {renderRadioGroup("neck", radioOptions.control)}
                    </FormItem>
                  )}/>
                   <FormField control={form.control} name="trunk" render={() => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg font-semibold"><Activity className="w-5 h-5" />التحكم بالجذع <span className="text-red-500">*</span></FormLabel>
                      {renderRadioGroup("trunk", radioOptions.control)}
                     </FormItem>
                  )}/>
                   <FormField control={form.control} name="standing" render={() => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg font-semibold"><User className="w-5 h-5" />القدرة على الوقوف <span className="text-red-500">*</span></FormLabel>
                      {renderRadioGroup("standing", radioOptions.assistance)}
                     </FormItem>
                  )}/>
                  <FormField control={form.control} name="walking" render={() => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg font-semibold"><Activity className="w-5 h-5" />القدرة على المشي <span className="text-red-500">*</span></FormLabel>
                      {renderRadioGroup("walking", radioOptions.assistance)}
                    </FormItem>
                  )}/>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="bg-card border-primary/20 shadow-lg animate-in fade-in-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary"><HeartPulse />التاريخ الطبي</CardTitle>
                <CardDescription>معلومات عن الأدوية والإصابات السابقة لتجنب أي موانع علاجية.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <FormField control={form.control} name="medications" render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-lg font-semibold"><Shield size={18}/>هل يتناول المريض أي أدوية؟ <span className="text-red-500">*</span></FormLabel>
                          {renderRadioGroup("medications", radioOptions.yesNo)}
                        </FormItem>
                      )}/>
                    {form.watch("medications") === 'yes' && (
                      <FormField control={form.control} name="medications_details" render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-top-4">
                          <FormLabel>تفاصيل الأدوية <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Textarea placeholder="يرجى ذكر أسماء الأدوية والجرعات " {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    )}
                  </div>
                  <div className="space-y-4">
                    <FormField control={form.control} name="fractures" render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-lg font-semibold"><Bone size={18}/>هل يعاني المريض من أي كسور؟ <span className="text-red-500">*</span></FormLabel>
                        {renderRadioGroup("fractures", radioOptions.yesNo)}
                      </FormItem>
                    )}/>
                    {form.watch("fractures") === 'yes' && (
                      <FormField control={form.control} name="fractures_details" render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-top-4">
                          <FormLabel>تفاصيل الكسور <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Textarea placeholder="يرجى تحديد موقع الكسر ومرحلة الشفاء الحالية" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between mt-8">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" size="lg" onClick={prevStep}>
                <ArrowRight className="ml-2 h-5 w-5" />
                السابق
              </Button>
            ) : <div />}

            {currentStep < steps.length ? (
              <Button type="button" size="lg" onClick={nextStep}>
                التالي
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="lg" 
                disabled={isPending}
                className="min-w-[200px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري تحليل البيانات...
                  </>
                ) : (
                  <>
                    <Sparkles className="ml-2 h-5 w-5" />
                    توليد الخطة بالذكاء الاصطناعي
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
