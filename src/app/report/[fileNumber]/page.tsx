"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, Filter, Calendar, User, Download } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface Report {
  id: string;
  fileNumber: string;
  patientName: string;
  createdAt: Date;
  age: number;
  gender: string;
  diagnosis?: string;
}

export default function ReportsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortReports();
  }, [reports, searchTerm, sortBy]);

  const loadReports = async () => {
    if (!user) return;
    
    setLoadingReports(true);
    try {
      const allReports: Report[] = [];

      // من localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('report-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            allReports.push({
              id: key,
              fileNumber: data.fileNumber,
              patientName: data.name,
              createdAt: new Date(data.createdAt || Date.now()),
              age: data.age,
              gender: data.gender,
            });
          } catch (e) {
            console.error('Error parsing report:', e);
          }
        }
      }

      // من Firebase
      const q = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allReports.push({
          id: doc.id,
          fileNumber: data.fileNumber,
          patientName: data.patientName,
          createdAt: data.createdAt.toDate(),
          age: data.patientData?.age || 0,
          gender: data.patientData?.gender || '',
          diagnosis: data.rehabPlan?.initialDiagnosis,
        });
      });

      // إزالة التكرارات
      const uniqueReports = allReports.filter((report, index, self) =>
        index === self.findIndex((r) => r.fileNumber === report.fileNumber)
      );

      setReports(uniqueReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const filterAndSortReports = () => {
    let filtered = [...reports];

    // البحث
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.fileNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // الترتيب
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "date-asc":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "name":
          return a.patientName.localeCompare(b.patientName, 'ar');
        case "age":
          return a.age - b.age;
        default:
          return 0;
      }
    });

    setFilteredReports(filtered);
  };

  const exportReports = () => {
    const csvContent = [
      ['رقم الملف', 'اسم المريض', 'العمر', 'الجنس', 'تاريخ الإنشاء'],
      ...filteredReports.map(report => [
        report.fileNumber,
        report.patientName,
        report.age,
        report.gender === 'male' ? 'ذكر' : 'أنثى',
        format(report.createdAt, 'yyyy-MM-dd', { locale: arSA })
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقارير_وصل_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            تقاريري
          </h1>
          <p className="text-muted-foreground mt-1">
            إجمالي التقارير: {reports.length}
          </p>
        </div>
        <Button onClick={exportReports} variant="outline">
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="بحث بالاسم أو رقم الملف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">الأحدث أولاً</SelectItem>
                <SelectItem value="date-asc">الأقدم أولاً</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
                <SelectItem value="age">العمر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      {loadingReports ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد تقارير بعد"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Card
              key={report.fileNumber}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/report/${report.fileNumber}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{report.patientName}</CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">
                    {report.fileNumber}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{report.age} سنة - {report.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(report.createdAt, { 
                        addSuffix: true,
                        locale: arSA 
                      })}
                    </span>
                  </div>
                  {report.diagnosis && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-3">
                      {report.diagnosis}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}