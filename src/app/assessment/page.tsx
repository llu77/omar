"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  Brain, Loader2, Info, CheckCircle2
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
  name: z.string().min(2, "الاسم مطلوب"),
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
  { id: 1, title: "المعلومات الأساسية", icon: UserCheck },
  { id: 2, title: "التقييم الحركي", icon: Activity },
  { id: 3, title: "التاريخ الطبي", icon: HeartPulse },
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
      medications_details: "",
      fractures_details: "",
    },
    mode: "onChange",
  });

  const watchMedications = form.watch("medications");
  const watchFractures = form.watch("fractures");

  // حساب نسبة التقدم
  useEffect(() => {
    const subscription = form.watch((values) => {
      const fields = Object.keys(values);
      const filledFields = fields.filter(key => {
        const value = values[key as keyof typeof values];
        return value && value !== "";
      });
      setFormProgress((filledFields.length / fields.length) * 100);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  function onSubmit(values: FormValues) {
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
      createdAt: new Date().toISOString(),
      userId: user?.uid,
    };
    
    startTransition(() => {
      try {
        localStorage.setItem(`report-${fileNumber}`, JSON.stringify(patientData));
        toast({
          title: "تم حفظ البيانات بنجاح ✓",
          description: `جاري توليد التقرير بالذكاء الاصطناعي للملف رقم: ${fileNumber}`,
        });
        router.push(`/report/${fileNumber}`);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطأ في الحفظ",
          description: "لم نتمكن من حفظ البيانات. يرجى المحاولة مرة أخرى.",
        });
      }
    });
  }

  const radioOptions = {
    control: [
      { value: "yes", label: "نعم", color: "text-green-600" },
      { value: "partially", label: "جزئياً", color: "text-yellow-600" },
      { value: "no", label: "لا", color: "text-red-600" },
    ],
    assistance: [
      { value: "yes", label: "نعم", color: "text-green-600" },
      { value: "with assistance", label: "بمساعدة", color: "text-yellow-600" },
      { value: "no", label: "لا", color: "text-red-600" },
    ],
    yesNo: [
      { value: "yes", label: "نعم", color: "text-green-600" },
      { value: "no", label: "لا", color: "text-red-600" },
    ],
  };

  const renderRadioGroup = (name: keyof FormValues, options: {value: string; label: string; color: string}[]) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormControl>
          <RadioGroup
            onValueChange={field.onChange}
            defaultValue={field.value}
            className="flex flex-wrap gap-4"
          >
            {options.map((option) => (
              <FormItem key={option.value} className="flex items-center space-x-2 space-x-reverse">
                <FormControl>
                  <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                </FormControl>
                <FormLabel 
                  htmlFor={`${name}-${option.value}`} 
                  className={`font-normal cursor-pointer ${field.value === option.value ? option.color : ''}`}
                >
                  {option.label}
                </FormLabel>
              </FormItem>
            ))}
          </RadioGroup>
        </FormControl>
      )}
    />
  );

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center mb-8">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto max-w-5xl">
      {/* Header with Logo */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <Logo className="w-32 h-32" showText={false} />
        </div>
        <h1 className="text-4xl font-bold font-headline flex items-center justify-center gap-3">
          <FileText className="text-primary" />
          نموذج تقييم المريض
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          نظام الذكاء الاصطناعي الطبي لتوليد خطط تأهيلية مخصصة
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">نسبة إكمال النموذج</span>
          <span className="text-sm font-medium">{Math.round(formProgress)}%</span>
        </div>
        <Progress value={formProgress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                currentStep === step.id 
                  ? 'bg-primary text-primary-foreground' 
                  : currentStep > step.id
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                <step.icon className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">{step.title}</span>
                <span className="font-medium sm:hidden">{step.id}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-secondary'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <Card className="bg-secondary/30 border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                  <UserCheck />
                  المعلومات الأساسية والشخصية
                </CardTitle>
                <CardDescription>
                  يرجى إدخال البيانات الأساسية للمريض بدقة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المريض <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="الاسم الكامل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>العمر <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="بالسنوات" min="1" max="150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجنس <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الجنس" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormLabel>
                        مهنة المريض <span className="text-red-500">*</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="inline-block w-4 h-4 mr-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>المهنة مهمة لتخصيص البرنامج التأهيلي</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: موظف مكتبي، عامل بناء..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div>
                    <FormLabel>رقم الملف</FormLabel>
                    <Input disabled value={fileNumber} className="mt-2 bg-muted/50 border-dashed font-mono" />
                    <FormDescription>يتم توليده تلقائياً</FormDescription>
                  </div>
                </div>
                <FormField control={form.control} name="symptoms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      وصف الأعراض الرئيسية <span className="text-red-500">*</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="inline-block w-4 h-4 mr-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>كلما كان الوصف أكثر تفصيلاً، كلما كانت الخطة أدق</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="يرجى وصف الأعراض بالتفصيل، مثل مكان الألم، طبيعته، ومتى يزداد..." 
                        {...field} 
                        rows={4}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0} / 10 حرف (الحد الأدنى)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}/>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setCurrentStep(2)}
                    disabled={!form.getValues("name") || !form.getValues("age") || !form.getValues("gender") || !form.getValues("job") || !form.getValues("symptoms")}
                  >
                    التالي
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Functional Assessment */}
          {currentStep === 2 && (
            <Card className="bg-secondary/30 border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                  <Activity />
                  تقييم الحالة الوظيفية والحركية
                </CardTitle>
                <CardDescription>
                  تقييم القدرات الحركية الحالية للمريض
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    التحكم بالرقبة <span className="text-red-500">*</span>
                  </FormLabel>
                  {renderRadioGroup("neck", radioOptions.control)}
                  <FormMessage className="mt-2">{form.formState.errors.neck?.message}</FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    التحكم بالجذع <span className="text-red-500">*</span>
                  </FormLabel>
                  {renderRadioGroup("trunk", radioOptions.control)}
                  <FormMessage className="mt-2">{form.formState.errors.trunk?.message}</FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الوقوف <span className="text-red-500">*</span>
                  </FormLabel>
                  {renderRadioGroup("standing", radioOptions.assistance)}
                  <FormMessage className="mt-2">{form.formState.errors.standing?.message}</FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    المشي <span className="text-red-500">*</span>
                  </FormLabel>
                  {renderRadioGroup("walking", radioOptions.assistance)}
                  <FormMessage className="mt-2">{form.formState.errors.walking?.message}</FormMessage>
                </FormItem>
                <div className="md:col-span-2 flex justify-between mt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                    السابق
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setCurrentStep(3)}
                    disabled={!form.getValues("neck") || !form.getValues("trunk") || !form.getValues("standing") || !form.getValues("walking")}
                  >
                    التالي
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Medical History */}
          {currentStep === 3 && (
            <Card className="bg-secondary/30 border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                  <HeartPulse />
                  التاريخ الطبي
                </CardTitle>
                <CardDescription>
                  معلومات عن الأدوية والإصابات السابقة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Shield size={16}/>
                        هل يتناول المريض أي أدوية؟ <span className="text-red-500">*</span>
                      </FormLabel>
                      {renderRadioGroup("medications", radioOptions.yesNo)}
                      <FormMessage className="mt-2">{form.formState.errors.medications?.message}</FormMessage>
                    </FormItem>
                    {watchMedications === 'yes' && (
                      <FormField control={form.control} name="medications_details" render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-top-2">
                          <FormLabel>تفاصيل الأدوية <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="يرجى ذكر أسماء الأدوية والجرعات والغرض من كل دواء" 
                              {...field}
                              rows={3}
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    )}
                  </div>
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Bone size={16}/>
                        هل يعاني المريض من أي كسور؟ <span className="text-red-500">*</span>
                      </FormLabel>
                      {renderRadioGroup("fractures", radioOptions.yesNo)}
                      <FormMessage className="mt-2">{form.formState.errors.fractures?.message}</FormMessage>
                    </FormItem>
                    {watchFractures === 'yes' && (
                      <FormField control={form.control} name="fractures_details" render={({ field }) => (
                        <FormItem className="animate-in slide-in-from-top-2">
                          <FormLabel>تفاصيل الكسور <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="يرجى تحديد موقع الكسر وتاريخه ومرحلة الشفاء الحالية" 
                              {...field}
                              rows={3}
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    )}
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                    السابق
                  </Button>
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={form.formState.isSubmitting || isPending}
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
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}
<div className="flex justify-center mb-6">
  <Logo size={150} showText={false} />
</div>