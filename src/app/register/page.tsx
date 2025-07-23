"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
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

const formSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص"),
  confirmPassword: z.string(),
  role: z.enum(["therapist", "doctor", "nurse"], {
    required_error: "يرجى اختيار التخصص",
  }),
  licenseNumber: z.string().min(5, "رقم الترخيص مطلوب"),
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    mode: "onChange",
  });

  const password = form.watch("password");
  const passwordRequirements = [
    { label: "8 أحرف على الأقل", test: password?.length >= 8 },
    { label: "حرف كبير", test: /[A-Z]/.test(password || "") },
    { label: "حرف صغير", test: /[a-z]/.test(password || "") },
    { label: "رقم", test: /\d/.test(password || "") },
    { label: "رمز خاص", test: /[@$!%*?&]/.test(password || "") },
  ];

  const passwordStrength = passwordRequirements.filter(req => req.test).length;
  const passwordStrengthPercentage = (passwordStrength / passwordRequirements.length) * 100;

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // إنشاء المستخدم
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        values.email, 
        values.password
      );
      
      // تحديث معلومات المستخدم
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: values.name
        });

        // حفظ معلومات إضافية في Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: values.name,
          email: values.email,
          role: values.role,
          licenseNumber: values.licenseNumber,
          createdAt: new Date().toISOString(),
          isActive: true,
          profileCompleted: true,
        });
      }
      
      toast({
        title: "تم إنشاء الحساب بنجاح ✓",
        description: "مرحباً بك في برنامج وصّل للتأهيل الطبي",
      });
      
      router.push("/dashboard");
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/10 to-primary/5">
      <Card className="w-full max-w-lg shadow-2xl bg-card/95 backdrop-blur border-primary/20">
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="د. أحمد محمد"
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
                        placeholder="doctor@example.com"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التخصص</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input
                          type="text"
                          placeholder="12345"
                          disabled={loading}
                          {...field}
                        />
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
                          autoComplete="new-password"
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
                    {password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>قوة كلمة المرور</span>
                          <span className={
                            passwordStrength < 2 ? "text-red-500" :
                            passwordStrength < 4 ? "text-yellow-500" :
                            "text-green-500"
                          }>
                            {passwordStrength < 2 ? "ضعيفة" :
                             passwordStrength < 4 ? "متوسطة" :
                             "قوية"}
                          </span>
                        </div>
                        <Progress value={passwordStrengthPercentage} className="h-2" />
                        <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                          {passwordRequirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-1">
                              {req.test ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className={req.test ? "text-green-600" : "text-muted-foreground"}>
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
                          autoComplete="new-password"
                          disabled={loading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
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

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={loading || !form.formState.isValid}
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
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              بإنشاء حساب، أنت توافق على{" "}
              <Link href="/terms" className="text-primary hover:underline">
                الشروط والأحكام
              </Link>
              {" و "}
              <Link href="/privacy" className="text-primary hover:underline">
                سياسة الخصوصية
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link 
                href="/login" 
                className="text-primary font-medium hover:underline transition-colors"
              >
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}