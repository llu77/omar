"use client";

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { User, FileText, Target, AlertCircle, TrendingUp, CheckCircle, Activity, Dumbbell, Calendar, ArrowRight } from 'lucide-react';
import type { PatientDataForAI, Goal } from '@/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ReportSummary {
    fileNumber: string;
    createdAt: Date;
    name: string;
    age: number;
    gender: "male" | "female";
    symptoms: string;
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

export default function PatientDetailPage() {
  const router = useRouter();
  const { fileNumber } = useParams() as { fileNumber: string };
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [patientData, setPatientData] = useState<Partial<PatientDataForAI> | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/login');
        return;
    }

    const fetchPatientData = async () => {
        if (!fileNumber) return;
        setIsLoading(true);
        setError(null);
        
        try {
            // Fetch reports and goals in parallel
            const reportsQuery = query(collection(db, 'reports'), where('fileNumber', '==', fileNumber), orderBy('createdAt', 'desc'));
            const goalsQuery = query(collection(db, 'goals'), where('fileNumber', '==', fileNumber), orderBy('createdAt', 'desc'));

            const [reportsSnapshot, goalsSnapshot] = await Promise.all([
                getDocs(reportsQuery),
                getDocs(goalsQuery)
            ]);

            if (reportsSnapshot.empty && goalsSnapshot.empty) {
                setError('لم يتم العثور على أي تقارير أو أهداف للمريض بهذا الرقم.');
                setIsLoading(false);
                return;
            }
            
            const fetchedReports = reportsSnapshot.docs.map(doc => {
                const data = doc.data();
                let createdAtDate: Date;
                if (data.createdAt instanceof Timestamp) {
                    createdAtDate = data.createdAt.toDate();
                } else if (typeof data.createdAt === 'string') {
                    createdAtDate = new Date(data.createdAt);
                } else {
                    createdAtDate = new Date(); // Fallback
                }
                return {
                    ...data,
                    fileNumber: data.fileNumber,
                    createdAt: createdAtDate,
                } as ReportSummary;
            });
            setReports(fetchedReports);
            
            const fetchedGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
            setGoals(fetchedGoals);

            // Extract patient info from the most recent report
            if (fetchedReports.length > 0) {
                setPatientData(fetchedReports[0]);
            } else if (fetchedGoals.length > 0) {
                 setPatientData({
                    fileNumber: fetchedGoals[0].fileNumber,
                    name: fetchedGoals[0].patient,
                });
            }

        } catch (err) {
            console.error('Error searching for patient:', err);
            setError('حدث خطأ أثناء البحث. يرجى التحقق من اتصالك والمحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    }

    fetchPatientData();
  }, [fileNumber, user, authLoading, router]);

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
          <p className="font-semibold">{patientData?.name || 'غير متوفر'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">العمر</p>
          <p className="font-semibold">{patientData?.age || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">الجنس</p>
          <p className="font-semibold">{patientData?.gender === 'male' ? 'ذكر' : patientData?.gender === 'female' ? 'أنثى' : 'N/A'}</p>
        </div>
        <div className="col-span-2 md:col-span-3">
          <p className="text-sm text-muted-foreground">الأعراض الرئيسية (من آخر تقرير)</p>
          <p className="font-semibold">{patientData?.symptoms || 'غير متوفرة في هذا الملف'}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderReportsSection = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary"/>
        التقارير ({reports.length})
      </h2>
      {reports.length > 0 ? (
        reports.map(report => (
          <Card 
            key={report.fileNumber + report.createdAt.toISOString()}
            className="hover:bg-secondary/50 cursor-pointer transition-colors"
            onClick={() => router.push(`/report/${report.fileNumber}`)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <p className="font-semibold">التقرير الشامل</p>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4"/>
                  {format(report.createdAt, 'd MMMM yyyy, h:mm a', { locale: arSA })}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
        الأهداف المشتركة ({goals.length})
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
                   <CardFooter className="text-xs text-muted-foreground pt-4 border-t mt-4">
                      <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>أضيف بواسطة: {goal.creatorName || 'مستخدم غير معروف'} ({goal.creatorUserCode || 'N/A'})</span>
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

  if (authLoading || isLoading) {
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-32 w-full"/>
              <Skeleton className="h-24 w-full"/>
              <Skeleton className="h-24 w-full"/>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-50">
        <Button variant="outline" onClick={() => router.push('/patients')}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة المرضى
        </Button>
      {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : patientData ? (
          <div className="space-y-8">
            {renderPatientCard()}
            {renderReportsSection()}
            {renderGoalsSection()}
          </div>
        ) : null
      }
    </div>
  );
}
