"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Video, Paperclip, Phone, Search, Archive, UserPlus, Bot } from 'lucide-react';

// Placeholder data for communication channels
const channels = [
  { id: 1, name: 'د. أحمد سالم', lastMessage: 'تمام، سأراجع التقرير وأعود إليك.', time: 'الآن', unread: 0, avatar: '/avatars/01.png', type: 'doctor' },
  { id: 2, name: 'أ. نورة القحطاني (أخصائية)', lastMessage: 'تم تحديث خطة التمارين للمريض خالد.', time: '5 دقائق', unread: 2, avatar: '/avatars/02.png', type: 'specialist' },
  { id: 3, name: 'مجموعة رعاية المريض #142', lastMessage: 'د.أحمد: هل يمكننا بدء الاستشارة؟', time: '1 ساعة', unread: 5, avatar: null, type: 'group' },
  { id: 4, name: 'مساعد وَصّل الذكي', lastMessage: 'ملخص اجتماع الأمس جاهز للمراجعة.', time: '3 ساعات', unread: 0, avatar: null, type: 'bot' },
  { id: 5, name: 'أ. محمد الهاجري (أخصائي)', lastMessage: 'You: شكرًا لك!', time: 'أمس', unread: 0, avatar: '/avatars/03.png', type: 'specialist' },
];

export default function CommunicationPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState(channels[1]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
     return <div className="p-6"><Skeleton className="h-[70vh] w-full" /></div>;
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 animate-in fade-in-50">
      {/* Channels List */}
      <Card className="w-1/3 flex-shrink-0 flex flex-col">
        <CardHeader className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث في المحادثات..." className="pl-9" />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {channels.map(channel => (
              <div
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeChannel.id === channel.id ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}
              >
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                   <AvatarImage src={channel.avatar || ''} alt={channel.name} />
                  <AvatarFallback className={`${channel.type === 'bot' ? 'bg-primary text-primary-foreground' : ''}`}>
                    {channel.type === 'bot' ? <Bot size={24} /> : channel.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">{channel.time}</p>
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-muted-foreground truncate">{channel.lastMessage}</p>
                    {channel.unread > 0 && <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">{channel.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t">
          <Button variant="outline" className="w-full">
            <Archive className="ml-2 h-4 w-4" />
            الأرشيف
          </Button>
        </div>
      </Card>

      {/* Active Chat Window */}
      <Card className="flex-1 flex flex-col">
         <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
             <Avatar className="h-10 w-10">
                <AvatarImage src={activeChannel.avatar || ''} alt={activeChannel.name} />
                <AvatarFallback>{activeChannel.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            <div>
              <CardTitle className="text-lg">{activeChannel.name}</CardTitle>
              <p className="text-sm text-muted-foreground">متصل الآن</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Phone className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon"><Video className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon"><UserPlus className="h-5 w-5"/></Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 bg-secondary/30">
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">ميزة المحادثات قيد التطوير...</p>
          </div>
        </CardContent>
        <div className="p-4 border-t bg-card">
           <div className="relative">
            <Input placeholder="اكتب رسالتك هنا..." className="pr-24" />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
              <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
              <Button size="icon" className="w-10 h-8">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
