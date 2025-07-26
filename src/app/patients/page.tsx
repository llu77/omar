"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, User, FileText, Calendar, ServerCrash, Users } from 'lucide-react';
import type { PatientDataForAI } from '@/types';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface ReportSummary {
    fileNumber: string;
    createdAt: Date;
    name: string;
}

export default function PatientsListPage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  const [searchQuery, setSearchQuery] = useState('');
  
  const [reportsCollection, reportsLoading, reportsError] = useCollection(
    query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
  );

  const uniquePatients = useMemo(() => {
    if (!reportsCollection) return [];
    
    const patientMap = new Map<string, ReportSummary>();

    reportsCollection.docs.forEach(doc => {
        const data = doc.data();
        const fileNumber = data.fileNumber;

        if (!patientMap.has(fileNumber)) {
            let createdAtDate: Date;
            if (data.createdAt instanceof Timestamp) {
                createdAtDate = data.createdAt.toDate();
            } else if (typeof data.createdAt === 'string') {
                createdAtDate = new Date(data.createdAt);
            } else {
                createdAtDate = new Date(); // Fallback
            }

            patientMap.set(fileNumber, {
                fileNumber: fileNumber,
                name: data.name,
                createdAt: createdAtDate,
            });
        }
    });

    return Array.from(patientMap.values());
  }, [reportsCollection]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return uniquePatients;
    
    return uniquePatients.filter(patient => 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.fileNumber.includes(searchQuery)
    );
  }, [searchQuery, uniquePatients]);

  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || reportsLoading) {
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-24 w-full"/>
              <Skeleton className="h-12 w-full"/>
              <Skeleton className="h-20 w-full"/>
              <Skeleton className="h-20 w-full"/>
              <Skeleton className="h-20 w-full"/>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-50">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            قائمة المرضى
          </CardTitle>
          <CardDescription>
            تصفح جميع المرضى المسجلين في النظام أو ابحث بالاسم أو رقم الملف.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مريض..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {reportsError && (
          <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>خطأ في تحميل البيانات</AlertTitle>
            <AlertDescription>
                فشل الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
                ({reportsError.message})
            </AlertDescription>
          </Alert>
      )}

      <div className="space-y-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map(patient => (
            <Card 
              key={patient.fileNumber}
              className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => router.push(`/patients/${patient.fileNumber}`)}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-secondary p-3 rounded-full">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{patient.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{patient.fileNumber}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 self-end sm:self-center">
                    <Calendar className="h-4 w-4" />
                    <span>آخر تقرير: {format(patient.createdAt, 'd MMMM yyyy', { locale: arSA })}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground"/>
            <h3 className="mt-4 text-lg font-medium">لا توجد نتائج مطابقة</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                لم يتم العثور على مرضى يطابقون بحثك.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
