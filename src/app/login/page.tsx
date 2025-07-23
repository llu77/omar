"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { LogIn, ArrowRight, Loader2, Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  rememberMe: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      
      // حفظ البريد الإلكتروني إذا تم اختيار "تذكرني"
      if (values.rememberMe) {
        localStorage.setItem("rememberedEmail", values.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      toast({
        title: "تم تسجيل الدخول بنجاح ✓",
        description: "أهلاً بك مجدداً في برنامج وصّل!",
      });
      
      router.push("/dashboard");
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
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      toast({
        title: "تم إرسال رابط استعادة كلمة المرور ✓",
        description: "تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور",
      });
    } catch (error: any) {
      let errorMessage = "فشل إرسال رابط استعادة كلمة المرور.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "لا يوجد حساب مرتبط بهذا البريد الإلكتروني.";
      }
      
      toast({
        variant: "destructive",
        title: "خطأ",
        description: errorMessage,
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      await signInWithPopup(auth, provider);
      
      toast({
        title: "تم تسجيل الدخول بنجاح ✓",
        description: "أهلاً بك في برنامج وصّل!",
      });
      
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: "فشل تسجيل الدخول باستخدام Google",
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      <Card className="w-full max-w-lg shadow-2xl bg-card/95 backdrop-blur border-primary/20">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo className="w-24 h-24" showText={false} />
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">
              مرحباً بك مجدداً
            </CardTitle>
            <CardDescription className="text-base">
              سجل دخولك للوصول إلى نظام وصّل الذكي
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="doctor@example.com"
                          autoComplete="email"
                          disabled={loading}
                          dir="ltr"
                          className="pr-10"
                          {...field}
                        />
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
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
                        className="text-xs px-0 h-auto"
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
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="أدخل كلمة المرور"
                          autoComplete="current-password"
                          disabled={loading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal cursor-pointer">
                        تذكرني على هذا الجهاز
                      </FormLabel>
                    </div>
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                أو
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            تسجيل الدخول باستخدام Google
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
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