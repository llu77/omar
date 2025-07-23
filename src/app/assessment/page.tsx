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
import { Activity, Shield, User, FileText, Bot, Briefcase, Stethoscope, Sparkles, UserCheck, HeartPulse, Bone } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  age: z.string().refine((val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0, {
    message: "يجب أن يكون العمر رقمًا موجبًا",
  }),
  gender: z.enum(["male", "female"], {
    required_error: "الجنس مطلوب",
  }),
  job: z.string().min(2, "المهنة مطلوبة"),
  symptoms: z.string().min(10, "يجب وصف الأعراض بشكل كافٍ"),
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

export default function AssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [fileNumber, setFileNumber] = useState("");
  const [user, loading] = useAuthState(auth);

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
  });

  const watchMedications = form.watch("medications");
  const watchFractures = form.watch("fractures");

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
    };
    
    startTransition(() => {
      try {
        localStorage.setItem(`report-${fileNumber}`, JSON.stringify(patientData));
        toast({
          title: "تم حفظ البيانات بنجاح",
          description: `جاري توليد التقرير للملف رقم: ${fileNumber}`,
        });
        router.push(`/report/${fileNumber}`);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطأ في الحفظ",
          description: "لم نتمكن من حفظ البيانات في المتصفح. قد تكون مساحة التخزين ممتلئة.",
        });
      }
    });
  }

  const radioOptions = {
    control: [
      { value: "yes", label: "نعم" },
      { value: "partially", label: "جزئياً" },
      { value: "no", label: "لا" },
    ],
    assistance: [
      { value: "yes", label: "نعم" },
      { value: "with assistance", label: "بمساعدة" },
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
                <FormLabel htmlFor={`${name}-${option.value}`} className="font-normal cursor-pointer">{option.label}</FormLabel>
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
        <Skeleton className="h-24 w-full" />
        <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-headline flex items-center justify-center gap-3">
            <FileText />
            نموذج تقييم المريض
        </h1>
        <p className="text-muted-foreground mt-2">
          الرجاء إدخال بيانات المريض بدقة لتوليد خطة تأهيلية مخصصة بواسطة الذكاء الاصطناعي.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
            
            <Card className="bg-secondary/30 border-primary/20">
                <CardHeader><CardTitle className="flex items-center gap-3 text-primary"><UserCheck />المعلومات الأساسية والشخصية</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>اسم المريض</FormLabel><FormControl><Input placeholder="الاسم الكامل" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="age" render={({ field }) => (
                            <FormItem><FormLabel>العمر</FormLabel><FormControl><Input type="number" placeholder="بالسنوات" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem><FormLabel>الجنس</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent>
                            </Select><FormMessage /></FormItem>
                        )}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="job" render={({ field }) => (
                            <FormItem><FormLabel>مهنة المريض</FormLabel><FormControl><Input placeholder="مثال: موظف مكتبي، عامل بناء..." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div>
                            <FormLabel>رقم الملف</FormLabel>
                            <Input disabled value={fileNumber} className="mt-2 bg-muted/50 border-dashed" />
                        </div>
                    </div>
                    <FormField control={form.control} name="symptoms" render={({ field }) => (
                        <FormItem><FormLabel>وصف الأعراض الرئيسية</FormLabel><FormControl><Textarea placeholder="يرجى وصف الأعراض بالتفصيل، مثل مكان الألم، طبيعته، ومتى يزداد..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-primary/20">
                <CardHeader><CardTitle className="flex items-center gap-3 text-primary"><Activity />تقييم الحالة الوظيفية والحركية</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormItem><FormLabel>التحكم بالرقبة</FormLabel>{renderRadioGroup("neck", radioOptions.control)}<FormMessage className="mt-2">{form.formState.errors.neck?.message}</FormMessage></FormItem>
                    <FormItem><FormLabel>التحكم بالجذع</FormLabel>{renderRadioGroup("trunk", radioOptions.control)}<FormMessage className="mt-2">{form.formState.errors.trunk?.message}</FormMessage></FormItem>
                    <FormItem><FormLabel>الوقوف</FormLabel>{renderRadioGroup("standing", radioOptions.assistance)}<FormMessage className="mt-2">{form.formState.errors.standing?.message}</FormMessage></FormItem>
                    <FormItem><FormLabel>المشي</FormLabel>{renderRadioGroup("walking", radioOptions.assistance)}<FormMessage className="mt-2">{form.formState.errors.walking?.message}</FormMessage></FormItem>
                </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-primary/20">
                <CardHeader><CardTitle className="flex items-center gap-3 text-primary"><HeartPulse />التاريخ الطبي</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Shield size={16}/> هل يتناول المريض أي أدوية؟</FormLabel>
                                {renderRadioGroup("medications", radioOptions.yesNo)}
                                <FormMessage className="mt-2">{form.formState.errors.medications?.message}</FormMessage>
                            </FormItem>
                            {watchMedications === 'yes' && (
                            <FormField control={form.control} name="medications_details" render={({ field }) => (
                                <FormItem className="mt-4"><FormLabel>تفاصيل الأدوية</FormLabel><FormControl><Textarea placeholder="يرجى ذكر أسماء الأدوية والجرعات" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            )}
                        </div>
                        <div>
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Bone size={16}/> هل يعاني المريض من أي كسور؟</FormLabel>
                                {renderRadioGroup("fractures", radioOptions.yesNo)}
                                <FormMessage className="mt-2">{form.formState.errors.fractures?.message}</FormMessage>
                            </FormItem>
                            {watchFractures === 'yes' && (
                            <FormField control={form.control} name="fractures_details" render={({ field }) => (
                                <FormItem className="mt-4"><FormLabel>تفاصيل الكسور</FormLabel><FormControl><Textarea placeholder="يرجى تحديد موقع الكسر وتاريخه" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || isPending} className="w-full md:w-auto">
                <Sparkles className="ml-2" />
                {isPending ? "جاري تحليل البيانات..." : "توليد الخطة التأهيلية بالذكاء الاصطناعي"}
              </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}

