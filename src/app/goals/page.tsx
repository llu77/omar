"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, getDocs, query, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Target, Users, TrendingUp, PlusCircle, Filter, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Goal } from '@/types';
import { useToast } from '@/hooks/use-toast';

const statusMap = {
  on_track: { text: 'في المسار الصحيح', color: 'bg-green-500', badge: 'outline' },
  needs_attention: { text: 'يحتاج متابعة', color: 'bg-yellow-500', badge: 'secondary' },
  at_risk: { text: 'في خطر', color: 'bg-red-500', badge: 'destructive' },
  achieved: { text: 'تم تحقيقه', color: 'bg-blue-500', badge: 'default' },
};


export default function GoalsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  
  const goalsCollectionRef = collection(db, 'goals');
  const [goalsSnapshot, goalsLoading, goalsError] = useCollection(goalsCollectionRef);

  const goals: Goal[] = goalsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)) || [];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const seedGoals = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
        const q = query(collection(db, "goals"), limit(1));
        const existingGoalsSnapshot = await getDocs(q);
        if(!existingGoalsSnapshot.empty){
             toast({
                variant: 'destructive',
                title: "بيانات موجودة",
                description: "الأهداف التجريبية موجودة بالفعل.",
            });
            setIsSeeding(false);
            return;
        }

      const batch = writeBatch(db);
      const placeholderGoals = [
          { title: 'تحسين نطاق حركة الركبة للمريض #1123', patient: 'علي حسن', progress: 75, status: 'on_track', category: 'medical', team: ['د. أحمد', 'أ. نورة'] },
          { title: 'استعادة القدرة على المشي للمريض #1123', patient: 'علي حسن', progress: 40, status: 'needs_attention', category: 'functional', team: ['د. أحمد', 'أ. نورة'] },
          { title: 'تقليل آلام أسفل الظهر للمريضة #2451', patient: 'سارة عبدالله', progress: 90, status: 'achieved', category: 'medical', team: ['د. خالد', 'أ. محمد'] },
          { title: 'تحسين التوازن ومنع السقوط للمريضة #2451', patient: 'سارة عبدالله', progress: 60, status: 'on_track', category: 'functional', team: ['د. خالد', 'أ. محمد'] },
          { title: 'إعادة تأهيل الكتف بعد الجراحة للمريض #3890', patient: 'ياسر محمد', progress: 15, status: 'at_risk', category: 'medical', team: ['د. فاطمة', 'أ. ليلى'] },
      ];

      placeholderGoals.forEach(goal => {
        const docRef = doc(collection(db, "goals"));
        batch.set(docRef, { ...goal, createdAt: serverTimestamp(), createdBy: user.uid });
      });

      await batch.commit();
      toast({
        title: "نجاح",
        description: "تمت إضافة الأهداف التجريبية بنجاح.",
      });
    } catch (error) {
      console.error("Error seeding goals: ", error);
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "فشلت إضافة الأهداف التجريبية.",
      });
    } finally {
        setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">إدارة الأهداف المشتركة (مباشر)</h1>
          <p className="text-lg text-muted-foreground">متابعة وتنسيق الأهداف الطبية والوظيفية لضمان أفضل النتائج.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={seedGoals} disabled={isSeeding}>
              {isSeeding ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : null}
              إضافة بيانات تجريبية
            </Button>
            <Button>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة هدف جديد
            </Button>
        </div>
      </div>

      {goalsLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
        </div>
      )}

      {!goalsLoading && !goals.length && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">لا توجد أهداف بعد</h3>
          <p className="mt-1 text-sm text-muted-foreground">ابدأ بإضافة هدف جديد أو بيانات تجريبية.</p>
        </div>
      )}

      {goalsError && (
        <div className="text-red-500">حدث خطأ: {goalsError.message}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map(goal => (
          <Card key={goal.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 flex items-center justify-center rounded-lg ${goal.category === 'medical' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
                         <Target className={`h-5 w-5 ${goal.category === 'medical' ? 'text-blue-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold leading-tight">{goal.title}</CardTitle>
                        <CardDescription>{goal.patient}</CardDescription>
                    </div>
                </div>
                 {goal.status === 'achieved' ? 
                 <CheckCircle className="h-6 w-6 text-primary" /> : 
                 <TrendingUp className="h-5 w-5 text-muted-foreground"/>}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">التقدم</span>
                     <Badge variant={statusMap[goal.status as keyof typeof statusMap]?.badge as any || 'default'}>
                        {statusMap[goal.status as keyof typeof statusMap]?.text || goal.status}
                     </Badge>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-right">{goal.progress}% مكتمل</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                 <Users className="h-4 w-4 text-muted-foreground" />
                 <p className="text-sm text-muted-foreground">{goal.team.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
