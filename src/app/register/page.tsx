"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "يجب أن تحتوي على أحرف وأرقام"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // إنشاء المستخدم
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        values.email, 
        values.password
      );
      
      // تحديث اسم المستخدم
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: values.name
        });
      }
      
      toast({
        title: "تم إنشاء الحساب بنجاح ✓",
        description: "مرحباً بك في برنامج وصّل للتأهيل الطبي",
      });
      
      router.push("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول.";
          break;
        case 'auth/weak-password':
          errorMessage = "كلمة المرور ضعيفة جدًا. يجب أن تتكون من 6 أحرف على الأقل وتحتوي على أحرف وأرقام.";
          break;
        case 'auth/invalid-email':
          errorMessage = "البريد الإلكتروني الذي أدخلته غير صالح.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "خطأ في الاتصال بالإنترنت. يرجى التحقق من اتصالك.";
          break;
      }
      
      toast({
        variant: "destructive",
        title: "خطأ في التسجيل",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-lg shadow-2xl bg-card/95 backdrop-blur border-primary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <UserPlus className="h-8 w-8 text-primary" />
            إنشاء حساب جديد
          </CardTitle>
          <CardDescription className="text-center">
            انضم إلى برنامج وصّل للتأهيل الطبي المتكامل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="أدخل اسمك الكامل"
                        autoComplete="name"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        autoComplete="email"
                        disabled={loading}
                        dir="ltr"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أدخل كلمة مرور قوية"
                        autoComplete="new-password"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تأكيد كلمة المرور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أعد إدخال كلمة المرور"
                        autoComplete="new-password"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  <>
                    إنشاء حساب
                    <ArrowRight className="mr-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link 
              href="/login" 
              className="text-primary font-medium hover:underline transition-colors"
            >
              تسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
