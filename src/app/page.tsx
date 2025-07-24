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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    // This logic can be adjusted based on desired behavior for logged-in users.
    // For now, we allow logged-in users to see the homepage.
    // if (!loading && user) {
    //   router.push('/assessment');
    // }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 -z-10" />
        <div className="container mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-8">
              <Logo className="w-24 h-24 sm:w-32 sm:h-32" showText={false} />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                WASL AI
              </span>
              {" "}
              للتأهيل الطبي الذكي
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto">
              نظام متطور يستخدم الذكاء الاصطناعي لإنشاء خطط تأهيلية 
              طبية مخصصة وعلمية في دقائق، مما يوفر الوقت ويعزز دقة الرعاية.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full font-semibold shadow-lg hover:shadow-primary/30 transition-shadow">
                <Link href={user ? "/assessment" : "/register"}>
                  ابدأ الآن مجاناً
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Link>
              </Button>
              {!user && (
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full font-semibold">
                  <Link href="/login">
                    تسجيل الدخول
                  </Link>
                </Button>
              )}
            </div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center"
            >
              <ChevronDown className="w-8 h-8 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 px-4 bg-secondary/50">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              لماذا وصّل؟
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              مميزات تجعل من وصّل الخيار الأمثل للمختصين الصحيين الذين يسعون للكفاءة والدقة.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-card border-primary/10">
                  <CardHeader>
                    <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              جاهز لتعزيز ممارستك الطبية؟
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              انضم إلى  المختصين الذين يستخدمون وصّل يومياً لتحسين نتائج مرضاهم وتوفير الوقت.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full font-semibold shadow-lg hover:shadow-primary/30 transition-shadow">
              <Link href={user ? "/assessment" : "/register"}>
                إنشاء حساب 
                <ArrowRight className="mr-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
