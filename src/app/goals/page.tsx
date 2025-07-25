"use client";

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, where, getDocs, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Target, Users, TrendingUp, PlusCircle, FileText, Loader2, Dumbbell, Activity, User, Search, FileSearch, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Goal } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const goalFormSchema = z.object({
  title: z.string().min(5, "يجب أن يكون العنوان 5 أحرف على الأقل."),
  category: z.enum(['medical', 'functional'], {
    required_error: "فئة الهدف مطلوبة.",
  }),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

const statusMap = {
  on_track: { text: 'في المسار الصحيح', color: 'bg-green-500', badge: 'outline' },
  needs_attention: { text: 'يحتاج متابعة', color: 'bg-yellow-500', badge: 'secondary' },
  at_risk: { text: 'في خطر', color: 'bg-red-500', badge: 'destructive' },
  achieved: { text: 'تم تحقيقه', color: 'bg-blue-500', badge: 'default' },
};

const categoryMap = {
    medical: { text: 'هدف طبي', icon: <Activity className="h-5 w-5 text-blue-600"/>, color: 'bg-blue-100 dark:bg-blue-900' },
    functional: { text: 'هدف وظيفي', icon: <Dumbbell className="h-5 w-5 text-green-600"/>, color: 'bg-green-100 dark:bg-green-900'},
}

export default function GoalsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedFileNumber, setSearchedFileNumber] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);
  
  const [userData, userDataLoading] = useDocumentData(user ? doc(db, 'users', user.uid) : null);

  const goalsQuery = searchedFileNumber ? query(collection(db, 'goals'), where('fileNumber', '==', searchedFileNumber), orderBy('createdAt', 'desc')) : null;
  const [goalsSnapshot, goalsLoading, goalsError] = useCollection(goalsQuery);

  const goals: Goal[] = goalsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)) || [];

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      category: undefined,
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    startSearchTransition(async () => {
      setError(null);
      setPatientName(null);
      setSearchedFileNumber(null);
      
      try {
        const reportsQuery = query(collection(db, "reports"), where("fileNumber", "==", searchQuery.trim()), limit(1));
        const reportSnapshot = await getDocs(reportsQuery);

        if (reportSnapshot.empty) {
          setError(`لم يتم العثور على أي مريض برقم الملف: ${searchQuery}`);
          return;
        }

        const patientDoc = reportSnapshot.docs[0].data();
        setPatientName(patientDoc.name);
        setSearchedFileNumber(searchQuery.trim());

      } catch (err) {
        console.error("Error searching patient for goals:", err);
        setError("حدث خطأ أثناء البحث عن المريض.");
      }
    });
  };
  
  const handleAddGoal = async (values: GoalFormValues) => {
    if (!user || !searchedFileNumber) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'يجب البحث عن ملف مريض أولاً.'});
        return;
    };
    if (userDataLoading || !userData) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن إضافة الهدف، بيانات المستخدم غير متاحة.'});
        return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'goals'), {
        ...values,
        fileNumber: searchedFileNumber,
        patient: patientName,
        status: 'on_track',
        progress: 0,
        createdBy: user.uid,
        creatorName: userData.name,
        creatorUserCode: userData.userCode,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة الهدف المشترك بنجاح.",
      });
      form.reset();
      setIsModalOpen(false);

    } catch (error) {
      console.error("Error adding goal: ", error);
      toast({
        variant: 'destructive',
        title: "خطأ",
        description: "فشلت إضافة الهدف. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsSubmitting(false);
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
    <div className="animate-in fade-in-50 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">إدارة الأهداف المشتركة</h1>
        <p className="text-lg text-muted-foreground">ابحث عن المريض برقم الملف لعرض وإضافة الأهداف الطبية والوظيفية.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>البحث عن ملف مريض</CardTitle>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="أدخل رقم الملف هنا..."
              className="text-left font-mono"
              dir="ltr"
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
              بحث
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {isSearching && <div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {searchedFileNumber && !error && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold">أهداف المريض: {patientName}</h2>
              <p className="text-muted-foreground">رقم الملف: <span className="font-mono">{searchedFileNumber}</span></p>
            </div>
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة هدف جديد للمريض
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>هدف مشترك جديد لـ {patientName}</DialogTitle>
                        <DialogDescription>
                            حدد تفاصيل الهدف ليتمكن الفريق من متابعته. سيتم ربطه تلقائياً برقم الملف: {searchedFileNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddGoal)} className="space-y-4 py-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عنوان الهدف</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: تحسين نطاق حركة الركبة" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>فئة الهدف</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="medical">هدف طبي</SelectItem>
                                            <SelectItem value="functional">هدف وظيفي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">إلغاء</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isSubmitting || userDataLoading}>
                                    {(isSubmitting || userDataLoading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                    حفظ الهدف
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </div>

          {goalsLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
            </div>
          )}

          {!goalsLoading && !goals.length && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">لا توجد أهداف لهذا المريض</h3>
              <p className="mt-1 text-sm text-muted-foreground">يمكنك البدء بإضافة هدف جديد.</p>
            </div>
          )}

          {goalsError && (
            <div className="text-red-500">حدث خطأ في تحميل الأهداف: {goalsError.message}</div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {goals.map(goal => {
                const statusInfo = statusMap[goal.status as keyof typeof statusMap];
                const categoryInfo = categoryMap[goal.category as keyof typeof categoryMap];
                return (
                  <Card key={goal.id} className="flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 flex items-center justify-center rounded-lg ${categoryInfo.color}`}>
                                 {categoryInfo.icon}
                            </div>
                            <CardTitle className="text-base font-bold leading-tight">{goal.title}</CardTitle>
                        </div>
                         {goal.status === 'achieved' ? 
                         <CheckCircle className="h-6 w-6 text-primary" /> : 
                         <TrendingUp className="h-5 w-5 text-muted-foreground"/>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">التقدم</span>
                             <Badge variant={statusInfo.badge as any || 'default'}>
                                {statusInfo.text || goal.status}
                             </Badge>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1 text-right">{goal.progress}% مكتمل</p>
                      </div>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground pt-4">
                       <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>أضيف بواسطة: {goal.creatorName || 'مستخدم غير معروف'} ({goal.creatorUserCode || 'N/A'})</span>
                      </div>
                    </CardFooter>
                  </Card>
                )
            })}
          </div>
        </div>
      )}

      {!searchedFileNumber && !isSearching && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FileSearch className="mx-auto h-12 w-12 text-muted-foreground"/>
            <h3 className="mt-4 text-lg font-medium">ابحث عن مريض للبدء</h3>
            <p className="mt-1 text-sm text-muted-foreground">أدخل رقم ملف المريض لعرض أهدافه وإضافة أهداف جديدة.</p>
        </div>
      )}
    </div>
  );
}
