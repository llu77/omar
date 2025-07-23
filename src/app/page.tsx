"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { 
  FileSearch, ArrowRight, Loader2, Users, Brain, 
  Shield, Zap, ChevronDown, Star, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Brain,
    title: "ذكاء اصطناعي متقدم",
    description: "نستخدم أحدث تقنيات الذكاء الاصطناعي لتوليد خطط تأهيلية دقيقة ومخصصة"
  },
  {
    icon: Shield,
    title: "أمان وخصوصية",
    description: "بياناتك محمية بأعلى معايير الأمان والتشفير"
  },
  {
    icon: Zap,
    title: "سرعة وكفاءة",
    description: "احصل على خطة تأهيلية شاملة في دقائق معدودة"
  },
  {
    icon: Users,
    title: "للمختصين الصحيين",
    description: "مصمم خصيصاً لأخصائيي العلاج الطبيعي والأطباء"
  }
];

const stats = [
  { value: "500+", label: "مستخدم نشط" },
  { value: "2000+", label: "تقرير تم إنشاؤه" },
  { value: "98%", label: "رضا المستخدمين" },
  { value: "24/7", label: "متاح دائماً" }
];

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/assessment');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="container mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-8">
              <Logo className="w-32 h-32" showText={false} />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                وصّل
              </span>
              {" "}
              للتأهيل الطبي الذكي
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              نظام متطور يستخدم الذكاء الاصطناعي لإنشاء خطط تأهيلية 
              طبية مخصصة وعلمية في دقائق
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/register">
                  ابدأ الآن مجاناً
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href="/login">
                  تسجيل الدخول
                </Link>
              </Button>
            </div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center"
            >
              <ChevronDown className="w-8 h-8 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              لماذا وصّل؟
            </h2>
            <p className="text-lg text-muted-foreground">
              مميزات تجعل من وصّل الخيار الأمثل للمختصين الصحيين
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              جاهز للبدء؟
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              انضم إلى مئات المختصين الذين يستخدمون وصّل يومياً
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">
                إنشاء حساب مجاني
                <ArrowRight className="mr-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}