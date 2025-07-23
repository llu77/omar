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
import { Activity, Shield, User, FileText, Bot } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  age: z.string().refine((val) => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0, {
    message: "يجب أن يكون العمر رقمًا موجبًا",
  }),
  gender: z.enum(["male", "female"], {
    required_error: "الجنس مطلوب",
  }),
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
}).refine(data => data.medications === 'no' || (data.medications === 'yes' && data.medications_details && data.medications_details.trim() !== ''), {
  message: 'يرجى تقديم تفاصيل عن الأدوية',
  path: ['medications_details'],
}).refine(data => data.fractures === 'no' || (data.fractures === 'yes' && data.fractures_details && data.fractures_details.trim() !== ''), {
  message: 'يرجى تقديم تفاصيل عن الكسور',
  path: ['fractures_details'],
});

type FormValues = z.infer<typeof formSchema>;

export default function AssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [fileNumber, setFileNumber] = useState("");

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
      neck: values.neck,
      trunk: values.trunk,
      standing: values.standing,
      walking: values.walking,
      medications: values.medications === "yes" ? `نعم - ${values.medications_details}` : "لا",
      fractures: values.fractures === "yes" ? `نعم - ${values.fractures_details}` : "لا",
    };

    try {
      localStorage.setItem(`report-${fileNumber}`, JSON.stringify(patientData));
      toast({
        title: "تم حفظ البيانات بنجاح",
        description: `جاري توليد التقرير للملف رقم: ${fileNumber}`,
      });
      startTransition(() => {
        router.push(`/report/${fileNumber}`);
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الحفظ",
        description: "لم نتمكن من حفظ البيانات في المتصفح. قد تكون مساحة التخزين ممتلئة.",
      });
    }
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


  return (
    <Card className="w-full mx-auto max-w-4xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline flex items-center gap-3">
            <FileText />
            نموذج تقييم المريض
        </CardTitle>
        <CardDescription>
          الرجاء إدخال بيانات المريض بدقة لتوليد خطة تأهيلية مناسبة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="p-6 border rounded-lg bg-primary/5">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary"><User /> معلومات أساسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المريض</FormLabel>
                          <FormControl><Input placeholder="الاسم الكامل" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العمر</FormLabel>
                          <FormControl><Input type="number" placeholder="بالسنوات" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الجنس</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">ذكر</SelectItem>
                              <SelectItem value="female">أنثى</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="mt-4">
                    <FormLabel>رقم الملف</FormLabel>
                    <Input disabled value={fileNumber} className="mt-2 bg-muted/50" />
                </div>
            </div>

            <div className="p-6 border rounded-lg bg-primary/5">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary"><Activity /> الحالة الوظيفية</h3>
                <div className="space-y-6">
                  <FormItem><FormLabel>التحكم بالرقبة</FormLabel>{renderRadioGroup("neck", radioOptions.control)}<FormMessage className="mt-2">{form.formState.errors.neck?.message}</FormMessage></FormItem>
                  <FormItem><FormLabel>التحكم بالجذع</FormLabel>{renderRadioGroup("trunk", radioOptions.control)}<FormMessage className="mt-2">{form.formState.errors.trunk?.message}</FormMessage></FormItem>
                  <FormItem><FormLabel>الوقوف</FormLabel>{renderRadioGroup("standing", radioOptions.assistance)}<FormMessage className="mt-2">{form.formState.errors.standing?.message}</FormMessage></FormItem>
                  <FormItem><FormLabel>المشي</FormLabel>{renderRadioGroup("walking", radioOptions.assistance)}<FormMessage className="mt-2">{form.formState.errors.walking?.message}</FormMessage></FormItem>
                </div>
            </div>

            <div className="p-6 border rounded-lg bg-primary/5">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary"><Shield /> التاريخ الطبي</h3>
                <div className="space-y-6">
                    <FormItem>
                        <FormLabel>هل يتناول المريض أي أدوية؟</FormLabel>
                        {renderRadioGroup("medications", radioOptions.yesNo)}
                        <FormMessage className="mt-2">{form.formState.errors.medications?.message}</FormMessage>
                    </FormItem>
                    {watchMedications === 'yes' && (
                      <FormField
                        control={form.control}
                        name="medications_details"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تفاصيل الأدوية</FormLabel>
                            <FormControl><Textarea placeholder="يرجى ذكر أسماء الأدوية والجرعات" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormItem>
                        <FormLabel>هل يعاني المريض من أي كسور؟</FormLabel>
                        {renderRadioGroup("fractures", radioOptions.yesNo)}
                        <FormMessage className="mt-2">{form.formState.errors.fractures?.message}</FormMessage>
                    </FormItem>
                     {watchFractures === 'yes' && (
                      <FormField
                        control={form.control}
                        name="fractures_details"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تفاصيل الكسور</FormLabel>
                            <FormControl><Textarea placeholder="يرجى تحديد موقع الكسر وتاريخه" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || isPending}>
                <Bot className="ml-2" />
                {isPending ? "جاري التوليد..." : "توليد خطة تأهيلية"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
