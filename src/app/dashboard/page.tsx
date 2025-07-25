
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, BarChart3, Users, FileText, Bell, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CommunicationChannel } from '@/types';

// This is a placeholder for the advanced dashboard functionality.
// The full implementation will require backend services and data aggregation.

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // Real-time query for channels to get unread counts
  const channelsQuery = user ? query(collection(db, 'channels'), where('participants', 'array-contains', user.uid)) : null;
  const [channelsSnapshot, channelsLoading] = useCollection(channelsQuery);
  
  const channels: CommunicationChannel[] = channelsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunicationChannel)) || [];
  
  // Calculate total unread messages to display as a notification count
  const totalUnreadCount = channels.reduce((sum, channel) => sum + (channel.unreadCounts?.[user?.uid || ''] || 0), 0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
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
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground">+12 هذا الأسبوع</p>
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

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary"/>
              معدل الالتزام بالخطة
            </CardTitle>
            <CardDescription>تحليل التزام المرضى بالتمارين والجلسات.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-60 bg-secondary rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">مخطط بياني قيد التطوير...</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AreaChart className="h-5 w-5 text-primary"/>
              مؤشرات التقدم الوظيفي
            </CardTitle>
            <CardDescription>تتبع تحسن القدرات الحركية للمرضى مع مرور الوقت.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 bg-secondary rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">مخطط بياني قيد التطوير...</p>
            </div>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary"/>
            حالة الأهداف المشتركة
          </CardTitle>
           <CardDescription>
            عرض حالة الأهداف الطبية والوظيفية للمرضى النشطين.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
              <div>
                <p className="font-semibold">المريض: عبدالله الأحمد</p>
                <p className="text-sm text-muted-foreground">الهدف: زيادة نطاق حركة الكتف 20 درجة</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">في المسار الصحيح</Badge>
            </div>
             <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
              <div>
                <p className="font-semibold">المريضة: فاطمة الزهراني</p>
                <p className="text-sm text-muted-foreground">الهدف: المشي لمسافة 100 متر بدون مساعدة</p>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">يحتاج متابعة</Badge>
            </div>
             <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
              <div>
                <p className="font-semibold">المريض: خالد الغامدي</p>
                <p className="text-sm text-muted-foreground">الهدف: تخفيف الألم بنسبة 50%</p>
              </div>
              <Badge variant="outline" className="text-red-600 border-red-600">متأخر</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
