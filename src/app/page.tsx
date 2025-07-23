import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { FileSearch, FilePlus2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-full">
      <Card className="w-full max-w-2xl text-center shadow-2xl">
        <CardHeader className="items-center">
          <div className="p-4 bg-primary/10 rounded-full flex items-center justify-center w-24 h-24 mb-4">
            <Logo className="text-primary w-full h-full" />
          </div>
          <CardTitle className="text-4xl font-headline">وصّل للتأهيل الطبي</CardTitle>
          <CardDescription className="text-lg">
            أداة الذكاء الاصطناعي المتقدمة لإنشاء خطط تأهيلية مخصصة وفعّالة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            ابدأ بتقييم جديد لمريضك أو قم باستعراض تقرير تم إنشاؤه مسبقًا باستخدام رقم الملف.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="flex-1">
              <Link href="/assessment">
                <FilePlus2 className="ml-2" />
                بدء تقييم جديد
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="flex-1">
              <Link href="/retrieve">
                <FileSearch className="ml-2" />
                استعادة تقرير
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
