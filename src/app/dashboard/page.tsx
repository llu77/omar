
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection, useCollectionData } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, BarChart3, Users, FileText, Bell, Target, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CommunicationChannel, Goal, SmartAlert } from '@/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

const statusMap = {
  on_track: { text: 'في المسار الصحيح', icon: <TrendingUp className="h-4 w-4 text-green-600"/>, badge: 'outline', className: 'text-green-600 border-green-600' },
  needs_attention: { text: 'يحتاج متابعة', icon: <Bell className="h-4 w-4 text-yellow-600"/>, badge: 'secondary', className: 'text-yellow-600 border-yellow-600' },
  at_risk: { text: 'في خطر', icon: <AlertTriangle className="h-4 w-4 text-red-600"/>, badge: 'destructive', className: 'text-red-600 border-red-600' },
  achieved: { text: 'تم تحقيقه', icon: <CheckCircle className="h-4 w-4 text-blue-600"/>, badge: 'default', className: 'text-blue-600 border-blue-600' },
};

const complianceData = [
  { name: 'علي حسن', compliance: 85 },
  { name: 'سارة عبدالله', compliance: 92 },
  { name: 'ياسر محمد', compliance: 65 },
  { name: 'فاطمة الزهراء', compliance: 78 },
  { name: 'خالد الغامدي', compliance: 88 },
];

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // State for statistics
  const [activePatientsCount, setActivePatientsCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Firestore Hooks
  const channelsQuery = user ? query(collection(db, 'channels'), where('participants', 'array-contains', user.uid)) : null;
  const [channelsSnapshot, channelsLoading] = useCollection(channelsQuery);

  const goalsQuery = user ? query(collection(db, 'goals'), orderBy('createdAt', 'desc'), limit(5)) : null;
  const [goals, goalsLoading] = useCollectionData(goalsQuery, { idField: 'id' });

  const alertsQuery = user ? query(collection(db, 'alerts'), where('isRead', '==', false), orderBy('timestamp', 'desc')) : null;
  const [alerts, alertsLoading] = useCollectionData(alertsQuery, { idField: 'id' });

  // Calculate total unread messages
  const totalUnreadMessages = channelsSnapshot?.docs.reduce((sum, doc) => {
      const channel = doc.data() as CommunicationChannel;
      return sum + (channel.unreadCounts?.[user?.uid || ''] || 0);
  }, 0) || 0;

  const totalAlertsCount = (alerts?.length || 0) + totalUnreadMessages;


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    async function fetchStats() {
      if(user) {
        try {
          setStatsLoading(true);
          // Fetch reports to calculate active patients and total reports
          const reportsCol = collection(db, "reports");
          const reportsSnapshot = await getDocs(reportsCol);
          
          const patientIds = new Set(reportsSnapshot.docs.map(doc => doc.data().name));
          
          setActivePatientsCount(patientIds.size);
          setReportsCount(reportsSnapshot.size);
        } catch (error) {
          console.error("Failed to fetch dashboard stats:", error);
        } finally {
          setStatsLoading(false);
        }
      }
    }
    fetchStats();
  }, [user]);

  if (loading || statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="grid gap-6 mt-6 lg:grid-cols-5">
            <Skeleton className="h-96 w-full lg:col-span-3" />
            <Skeleton className="h-96 w-full lg:col-span-2" />
        </div>
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
            <div className="text-2xl font-bold">{activePatientsCount}</div>
            <p className="text-xs text-muted-foreground">إجمالي المرضى في النظام</p>
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
            {channelsLoading || alertsLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
               <div className="text-2xl font-bold">{totalAlertsCount}</div>
            )}
            <p className="text-xs text-muted-foreground">{totalUnreadMessages} رسالة و {alerts?.length || 0} تنبيه ذكي</p>
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
            <CardDescription>تحليل التزام المرضى بالتمارين والجلسات (بيانات تجريبية).</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complianceData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`}/>
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Bar dataKey="compliance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary"/>
              آخر تحديثات الأهداف
            </CardTitle>
            <CardDescription>لمحة سريعة على آخر 5 أهداف.</CardDescription>
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
                {(goals as Goal[])?.map(goal => {
                    const statusInfo = statusMap[goal.status as keyof typeof statusMap];
                    return (
                        <div key={goal.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer">
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
