"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowRight, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]/, 
      "يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص (@, $, !, %, *, ?, &, _, -)"),
  confirmPassword: z.string(),
  role: z.enum(["therapist", "doctor", "nurse"], {
    required_error: "يرجى اختيار التخصص",
  }),
  licenseNumber: z.string().min(5, "رقم الترخيص مطلوب (5 أرقام على الأقل)"),
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
      licenseNumber: "",
    },
    mode: "onTouched",
  });

  const password = form.watch("password");
  const passwordRequirements = [
    { label: "8 أحرف على الأقل", test: password?.length >= 8 },
    { label: "حرف كبير (A-Z)", test: /[A-Z]/.test(password || "") },
    { label: "حرف صغير (a-z)", test: /[a-z]/.test(password || "") },
    { label: "رقم (0-9)", test: /\d/.test(password || "") },
    { label: "رمز خاص (@$!%*?&)", test: /[@$!%*?&._-]/.test(password || "") },
  ];

  const passwordStrength = passwordRequirements.filter(req => req.test).length;
  const passwordStrengthPercentage = (passwordStrength / passwordRequirements.length) * 100;

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        values.email, 
        values.password
      );
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: values.name
        });

        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: values.name,
          email: values.email,
          role: values.role,
          licenseNumber: values.licenseNumber,
          createdAt: new Date().toISOString(),
          provider: 'email',
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
          errorMessage = "كلمة المرور ضعيفة جدًا. يرجى اتباع متطلبات كلمة المرور.";
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        createdAt: new Date().toISOString(),
        provider: 'google',
      }, { merge: true });

      toast({
        title: "تم تسجيل الدخول بنجاح ✓",
        description: "أهلاً بك في برنامج وصّل!",
      });
      router.push("/");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: "فشل تسجيل الدخول باستخدام Google.",
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      <Card className="w-full max-w-lg shadow-2xl bg-card/95 backdrop-blur border-primary/20 animate-in fade-in-50 zoom-in-95">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo className="w-24 h-24" showText={false} />
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">
              إنشاء حساب جديد
            </CardTitle>
            <CardDescription className="text-base">
              انضم إلى نظام وصّل الذكي للتأهيل الطبي
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input placeholder="د. أحمد محمد" disabled={loading} {...field} />
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
                        <Input type="email" placeholder="doctor@example.com" disabled={loading} dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التخصص</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر التخصص" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="therapist">أخصائي علاج طبيعي</SelectItem>
                          <SelectItem value="doctor">طبيب</SelectItem>
                          <SelectItem value="nurse">ممرض/ممرضة</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الترخيص المهني</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" disabled={loading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="أدخل كلمة مرور قوية"
                          disabled={loading}
                          dir="ltr"
                          className="pl-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    {password && (
                      <div className="mt-2 space-y-2">
                        <Progress value={passwordStrengthPercentage} className="h-2" />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                          {passwordRequirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                              {req.test ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className={req.test ? "" : "text-muted-foreground"}>
                                {req.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="أعد إدخال كلمة المرور"
                          disabled={loading}
                          dir="ltr"
                          className="pl-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
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
                    <UserPlus className="mr-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            التسجيل باستخدام Google
          </Button>

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
