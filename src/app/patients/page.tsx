"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, User, FileText, Target, AlertCircle, TrendingUp, CheckCircle, Activity, Dumbbell, Calendar } from 'lucide-react';
import type { PatientDataForAI, Goal } from '@/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ReportSummary {
    fileNumber: string;
    createdAt: Date;
}

const statusMap = {
  on_track: { text: 'في المسار الصحيح', icon: <TrendingUp className="h-4 w-4 text-green-500"/>, color: 'text-green-600' },
  needs_attention: { text: 'يحتاج متابعة', icon: <AlertCircle className="h-4 w-4 text-yellow-500"/>, color: 'text-yellow-600' },
  at_risk: { text: 'في خطر', icon: <AlertCircle className="h-4 w-4 text-red-500"/>, color: 'text-red-600' },
  achieved: { text: 'تم تحقيقه', icon: <CheckCircle className="h-4 w-4 text-blue-500"/>, color: 'text-blue-600' },
};

const categoryMap = {
    medical: { text: 'هدف طبي', icon: <Activity className="h-5 w-5 text-blue-600"/>, color: 'bg-blue-100 dark:bg-blue-900' },
    functional: { text: 'هدف وظيفي', icon: <Dumbbell className="h-5 w-5 text-green-600"/>, color: 'bg-green-100 dark:bg-green-900'},
}

export default function PatientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, startSearchTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [patientData, setPatientData] = useState<PatientDataForAI | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wasSearched, setWasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال رقم ملف للبحث.' });
      return;
    }

    startSearchTransition(async () => {
      setError(null);
      setPatientData(null);
      setReports([]);
      setGoals([]);
      setWasSearched(true);

      try {
        const fileNumber = searchQuery.trim();

        // Fetch reports
        const reportsQuery = query(collection(db, 'reports'), where('fileNumber', '==', fileNumber), orderBy('createdAt', 'desc'));
        const reportsSnapshot = await getDocs(reportsQuery);

        if (reportsSnapshot.empty) {
          setError('لم يتم العثور على أي تقارير أو بيانات للمريض بهذا الرقم.');
          return;
        }

        const fetchedReports = reportsSnapshot.docs.map(doc => ({
          fileNumber: doc.id,
          createdAt: doc.data().createdAt.toDate(),
        }));
        setReports(fetchedReports);

        const patientInfo = reportsSnapshot.docs[0].data() as PatientDataForAI;
        setPatientData(patientInfo);

        // Fetch goals
        const goalsQuery = query(collection(db, 'goals'), where('fileNumber', '==', fileNumber), orderBy('createdAt', 'desc'));
        const goalsSnapshot = await getDocs(goalsQuery);
        const fetchedGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
        setGoals(fetchedGoals);

      } catch (err) {
        console.error('Error searching for patient:', err);
        setError('حدث خطأ أثناء البحث. يرجى التحقق من اتصالك والمحاولة مرة أخرى.');
      }
    });
  };

  const renderPatientCard = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-primary">
          <User className="h-6 w-6"/>
          ملف المريض
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
        <div>
          <p className="text-sm text-muted-foreground">الاسم</p>
          <p className="font-semibold">{patientData?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">العمر</p>
          <p className="font-semibold">{patientData?.age}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">الجنس</p>
          <p className="font-semibold">{patientData?.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
        </div>
        <div className="col-span-2 md:col-span-3">
          <p className="text-sm text-muted-foreground">الأعراض الرئيسية</p>
          <p className="font-semibold">{patientData?.symptoms}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderReportsSection = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary"/>
        التقارير
      </h2>
      {reports.length > 0 ? (
        reports.map(report => (
          <Card 
            key={report.fileNumber}
            className="hover:bg-secondary/50 cursor-pointer transition-colors"
            onClick={() => router.push(`/report/${report.fileNumber}`)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <p className="font-semibold">التقرير الشامل</p>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4"/>
                {format(report.createdAt, 'd MMMM yyyy', { locale: arSA })}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground">لا توجد تقارير لهذا المريض.</p>
      )}
    </div>
  );

  const renderGoalsSection = () => (
     <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Target className="h-6 w-6 text-primary"/>
        الأهداف المشتركة
      </h2>
       {goals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map(goal => {
              const statusInfo = statusMap[goal.status as keyof typeof statusMap];
              const categoryInfo = categoryMap[goal.category as keyof typeof categoryMap];
              return (
                <Card key={goal.id} className="flex flex-col">
                  <CardHeader className="pb-4">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 flex items-center justify-center rounded-lg ${categoryInfo.color}`}>
                                {categoryInfo.icon}
                            </div>
                            <CardTitle className="text-base font-bold leading-tight">{goal.title}</CardTitle>
                        </div>
                        <Badge variant={statusInfo.color.includes('red') ? 'destructive' : 'outline'} className={statusInfo.color}>
                          {statusInfo.text}
                        </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                     <Progress value={goal.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1 text-right">{goal.progress}% مكتمل</p>
                  </CardContent>
                   <CardFooter className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>أضيف بواسطة: {goal.creatorName} ({goal.creatorUserCode})</span>
                      </div>
                  </CardFooter>
                </Card>
              )
          })}
        </div>
       ) : (
        <p className="text-muted-foreground">لا توجد أهداف محددة لهذا المريض.</p>
       )}
    </div>
  );

  if (authLoading) {
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-24 w-full"/>
              <Skeleton className="h-48 w-full"/>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-50">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">البحث عن ملف مريض</CardTitle>
          <CardDescription>أدخل رقم الملف لعرض جميع البيانات والتقارير والأهداف المتعلقة بالمريض.</CardDescription>
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

      {isSearching && (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full"/>
            <Skeleton className="h-24 w-full"/>
            <Skeleton className="h-24 w-full"/>
        </div>
      )}

      {!isSearching && wasSearched && (
        error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ في البحث</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : patientData && (
          <div className="space-y-8 animate-in fade-in-50">
            {renderPatientCard()}
            {renderReportsSection()}
            {renderGoalsSection()}
          </div>
        )
      )}

      {!wasSearched && !isSearching && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FileSearch className="mx-auto h-12 w-12 text-muted-foreground"/>
            <h3 className="mt-4 text-lg font-medium">ابدا البحث</h3>
            <p className="mt-1 text-sm text-muted-foreground">أدخل رقم ملف المريض في الحقل أعلاه للبدء.</p>
        </div>
      )}
    </div>
  );
}
