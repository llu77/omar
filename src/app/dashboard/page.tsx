
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, BarChart3, Users, FileText, Bell, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CommunicationChannel, Goal } from '@/types';

const statusMap = {
  on_track: { text: 'في المسار الصحيح', icon: <TrendingUp className="h-4 w-4 text-green-600"/>, badge: 'outline', className: 'text-green-600 border-green-600' },
  needs_attention: { text: 'يحتاج متابعة', icon: <Bell className="h-4 w-4 text-yellow-600"/>, badge: 'secondary', className: 'text-yellow-600 border-yellow-600' },
  at_risk: { text: 'في خطر', icon: <TrendingUp className="h-4 w-4 text-red-600"/>, badge: 'destructive', className: 'text-red-600 border-red-600' },
  achieved: { text: 'تم تحقيقه', icon: <CheckCircle className="h-4 w-4 text-blue-600"/>, badge: 'default', className: 'text-blue-600 border-blue-600' },
};


export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // Real-time query for channels to get unread counts
  const channelsQuery = user ? query(collection(db, 'channels'), where('participants', 'array-contains', user.uid)) : null;
  const [channelsSnapshot, channelsLoading] = useCollection(channelsQuery);

  // Real-time query for recent goals
  const goalsQuery = user ? query(collection(db, 'goals'), limit(3)) : null;
  const [goalsSnapshot, goalsLoading] = useCollection(goalsQuery);
  
  const channels: CommunicationChannel[] = channelsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunicationChannel)) || [];
  const goals: Goal[] = goalsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)) || [];
  
  // Calculate total unread messages to display as a notification count
  const totalUnreadCount = channels.reduce((sum, channel) => sum + (channel.unreadCounts?.[user?.uid || ''] || 0), 0);
  
  // Placeholder data for other cards
  const [reportsCount, setReportsCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    async function fetchReportsCount() {
        if(user) {
            const reportsCol = collection(db, "reports");
            const snapshot = await getDocs(reportsCol);
            setReportsCount(snapshot.size);
        }
    }
    fetchReportsCount();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">لوحة التحكم التعاونية</h1>
        <p className="text-lg text-muted-foreground">نظرة شاملة وموحدة على بيانات المرضى والتقدم العلاجي.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المرضى النشطون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+5 عن الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التقارير المُنشأة</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsCount}</div>
            <p className="text-xs text-muted-foreground">إجمالي التقارير في النظام</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات هامة</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {channelsLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
               <div className="text-2xl font-bold">{totalUnreadCount}</div>
            )}
            <p className="text-xs text-muted-foreground">رسائل غير مقروءة تتطلب المراجعة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary"/>
              معدل الالتزام بالخطة
            </CardTitle>
            <CardDescription>تحليل التزام المرضى بالتمارين والجلسات.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] bg-secondary/50 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">مخطط بياني قيد التطوير...</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary"/>
              آخر تحديثات الأهداف
            </CardTitle>
            <CardDescription>لمحة سريعة على آخر الأهداف.</CardDescription>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map(goal => {
                    const statusInfo = statusMap[goal.status as keyof typeof statusMap];
                    return (
                        <div key={goal.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50">
                            {statusInfo.icon}
                            <div>
                                <p className="font-semibold text-sm">{goal.title}</p>
                                <p className="text-xs text-muted-foreground">{goal.patient} - <span className={statusInfo.className}>{statusInfo.text}</span></p>
                            </div>
                        </div>
                    )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
       
    </div>
  );
}

    