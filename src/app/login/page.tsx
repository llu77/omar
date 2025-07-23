"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
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
import { LogIn, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      
      toast({
        title: "تم تسجيل الدخول بنجاح ✓",
        description: "أهلاً بك مجدداً في برنامج وصّل!",
      });
      
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "لا يوجد حساب مرتبط بهذا البريد الإلكتروني.";
          break;
        case 'auth/wrong-password':
          errorMessage = "كلمة المرور غير صحيحة.";
          break;
        case 'auth/invalid-email':
          errorMessage = "البريد الإلكتروني غير صالح.";
          break;
        case 'auth/user-disabled':
          errorMessage = "تم تعطيل هذا الحساب. يرجى التواصل مع الدعم.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "خطأ في الاتصال بالإنترنت. يرجى التحقق من اتصالك.";
          break;
      }
      
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني أولاً",
      });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "تم إرسال رابط استعادة كلمة المرور ✓",
        description: "تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل إرسال رابط استعادة كلمة المرور. تأكد من صحة البريد الإلكتروني.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-lg shadow-2xl bg-card/95 backdrop-blur border-primary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <LogIn className="h-8 w-8 text-primary" />
            تسجيل الدخول
          </CardTitle>
          <CardDescription className="text-center">
            أدخل بياناتك للوصول إلى برنامج وصّل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <FormLabel>كلمة المرور</FormLabel>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-xs px-0"
                        onClick={handlePasswordReset}
                        disabled={resetLoading}
                      >
                        {resetLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "نسيت كلمة المرور؟"
                        )}
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أدخل كلمة المرور"
                        autoComplete="current-password"
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
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    تسجيل الدخول
                    <ArrowRight className="mr-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link 
              href="/register" 
              className="text-primary font-medium hover:underline transition-colors"
            >
              أنشئ حسابًا جديدًا
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
