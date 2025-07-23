"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch } from "lucide-react";

export default function RetrievePage() {
  const [fileNumber, setFileNumber] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleRetrieve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNumber.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال رقم الملف.",
      });
      return;
    }

    const reportData = localStorage.getItem(`report-${fileNumber.trim()}`);

    if (reportData) {
      toast({
        title: "تم العثور على التقرير",
        description: `جاري عرض تقرير الملف رقم: ${fileNumber.trim()}`,
      });
      router.push(`/report/${fileNumber.trim()}`);
    } else {
      toast({
        variant: "destructive",
        title: "لم يتم العثور على التقرير",
        description: "الرجاء التأكد من صحة رقم الملف.",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full">
        <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-3">
                <FileSearch />
                استعادة تقرير تأهيلي
            </CardTitle>
            <CardDescription>
                أدخل رقم الملف الخاص بالمريض لعرض التقرير المحفوظ.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleRetrieve} className="space-y-4">
            <div>
                <label htmlFor="fileNumber" className="block text-sm font-medium text-muted-foreground mb-2">
                رقم الملف
                </label>
                <Input
                id="fileNumber"
                type="text"
                value={fileNumber}
                onChange={(e) => setFileNumber(e.target.value)}
                placeholder="مثال: WSL-2024-12345"
                className="text-left"
                dir="ltr"
                />
            </div>
            <Button type="submit" className="w-full" size="lg">
                عرض التقرير
            </Button>
            </form>
        </CardContent>
        </Card>
    </div>
  );
}
