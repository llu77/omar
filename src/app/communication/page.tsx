
"use client";

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { collection, doc, query, orderBy, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Video, Paperclip, Phone, Search, Archive, UserPlus, Bot, MessageSquare, Loader2, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { CommunicationChannel, Message as MessageType } from '@/types';

// ======================= COMPONENT: ChannelListItem =======================

interface ChannelListItemProps {
  channel: CommunicationChannel;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string;
}

const ChannelListItem = ({ channel, isActive, onClick, currentUserId }: ChannelListItemProps) => {
  const lastMessage = channel.lastMessageContent;
  const lastMessageTimestamp = channel.lastMessageTimestamp?.toDate();
  const unreadCount = channel.unreadCounts?.[currentUserId] || 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}
    >
      <Avatar className="h-12 w-12 border-2 border-primary/20">
        <AvatarImage src={channel.avatarUrl || ''} alt={channel.name} />
        <AvatarFallback className={`${channel.type === 'bot' ? 'bg-primary text-primary-foreground' : ''}`}>
          {channel.type === 'bot' ? <Bot size={24} /> : channel.name.substring(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <p className="font-semibold truncate">{channel.name}</p>
          {lastMessageTimestamp && (
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(lastMessageTimestamp, { addSuffix: true, locale: arSA })}
            </p>
          )}
        </div>
        <div className="flex justify-between items-start">
          <p className="text-sm text-muted-foreground truncate">{lastMessage || 'لا توجد رسائل بعد'}</p>
          {unreadCount > 0 && (
            <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ======================= COMPONENT: MessageBubble =======================

interface MessageBubbleProps {
  message: MessageType;
  isOwnMessage: boolean;
}

const MessageBubble = ({ message, isOwnMessage }: MessageBubbleProps) => {
  return (
     <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>{message.senderName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 shadow-sm ${
          isOwnMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-card'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {message.timestamp?.toDate().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};


// ======================= MAIN PAGE COMPONENT =======================

export default function CommunicationPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // --- Firestore Hooks ---
  const channelsQuery = user ? query(collection(db, 'channels'), where('participants', 'array-contains', user.uid), orderBy('lastMessageTimestamp', 'desc')) : null;
  const [channelsSnapshot, channelsLoading, channelsError] = useCollection(channelsQuery);

  const messagesQuery = activeChannelId ? query(collection(db, 'channels', activeChannelId, 'messages'), orderBy('timestamp', 'asc')) : null;
  const [messagesSnapshot, messagesLoading, messagesError] = useCollection(messagesQuery);

  const channels: CommunicationChannel[] = channelsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunicationChannel)) || [];

  // --- Effects ---
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    // Automatically select the first channel if none is active
    if (!activeChannelId && channels.length > 0) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  useEffect(() => {
    // Auto-scroll to the bottom of the chat view when new messages arrive
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messagesSnapshot]);

  // --- Handlers ---
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !user || !activeChannelId) return;

    setIsSending(true);
    try {
      const messagesColRef = collection(db, 'channels', activeChannelId, 'messages');
      await addDoc(messagesColRef, {
        content: messageContent,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        timestamp: serverTimestamp(),
      });
      setMessageContent('');
    } catch (error) {
      console.error("Error sending message: ", error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الإرسال',
        description: 'لم نتمكن من إرسال رسالتك. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const seedData = async () => {
    if (!user) return;
    toast({ title: 'جاري إضافة البيانات التجريبية...' });
    const channelsCol = collection(db, 'channels');
    const existingBotChannelQuery = query(channelsCol, where('type', '==', 'bot'), where('participants', 'array-contains', user.uid));
    const existingBotChannels = await getDocs(existingBotChannelQuery);

    if (!existingBotChannels.empty) {
      toast({ variant: 'destructive', title: 'بيانات موجودة', description: 'المحادثات التجريبية موجودة بالفعل.' });
      return;
    }
    
    // Create bot channel
    await addDoc(channelsCol, {
      name: 'مساعد وَصّل الذكي',
      type: 'bot',
      participants: [user.uid, 'wassel_ai_bot'],
      lastMessageContent: 'أهلاً بك! كيف يمكنني مساعدتك اليوم؟',
      lastMessageTimestamp: serverTimestamp(),
      unreadCounts: { [user.uid]: 1 },
      createdAt: serverTimestamp(),
      avatarUrl: '/bot-avatar.png'
    });

    toast({ title: 'نجاح', description: 'تمت إضافة المحادثات التجريبية.' });
  };
  
  // --- Render Logic ---
  const activeChannel = channels.find(c => c.id === activeChannelId);

  if (loading) {
     return <div className="p-6"><Skeleton className="h-[70vh] w-full" /></div>;
  }
  
  if (!user) return null; // Or a login prompt

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 animate-in fade-in-50">
      {/* Channels List */}
      <Card className="w-1/3 flex-shrink-0 flex flex-col">
        <CardHeader className="p-4 border-b flex-row justify-between items-center">
            <CardTitle className="text-lg">المحادثات</CardTitle>
            <Button size="sm" variant="outline" onClick={seedData}><PlusCircle className="ml-2 h-4 w-4"/>بيانات تجريبية</Button>
        </CardHeader>
        <ScrollArea className="flex-1">
          {channelsLoading && <div className="p-4 space-y-3"><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/></div>}
          {!channelsLoading && channelsError && <p className="p-4 text-destructive">خطأ في تحميل المحادثات.</p>}
          {!channelsLoading && channels.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12" />
              <p className="mt-4">لا توجد محادثات.</p>
              <p className="text-sm">ابدأ بإضافة بيانات تجريبية.</p>
            </div>
          )}
          <div className="p-2">
            {channels.map(channel => (
              <ChannelListItem 
                key={channel.id} 
                channel={channel}
                isActive={activeChannelId === channel.id}
                onClick={() => setActiveChannelId(channel.id)}
                currentUserId={user.uid}
              />
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
         {activeChannel ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                      <AvatarImage src={activeChannel.avatarUrl || ''} alt={activeChannel.name} />
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
              <ScrollArea className="flex-1 p-6 bg-secondary/30" ref={scrollAreaRef}>
                 <div className="space-y-4">
                  {messagesLoading && <Loader2 className="mx-auto my-10 h-8 w-8 animate-spin text-primary" />}
                  {messagesError && <p className="text-destructive text-center">خطأ في تحميل الرسائل.</p>}
                  {messagesSnapshot?.docs.map(doc => {
                    const message = { id: doc.id, ...doc.data() } as MessageType;
                    return (
                      <MessageBubble 
                        key={message.id} 
                        message={message} 
                        isOwnMessage={message.senderId === user.uid}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-card">
                <form className="relative" onSubmit={handleSendMessage}>
                  <Input 
                    placeholder="اكتب رسالتك هنا..." 
                    className="pr-24" 
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    disabled={isSending || messagesLoading}
                  />
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center">
                    <Button variant="ghost" size="icon" type="button"><Paperclip className="h-5 w-5" /></Button>
                    <Button size="icon" className="w-10 h-8" type="submit" disabled={isSending || !messageContent.trim()}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </div>
            </>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-20 w-20 mb-4"/>
                <p className="text-lg">اختر محادثة لبدء الدردشة</p>
                <p>أو أنشئ محادثة جديدة</p>
            </div>
         )}
      </Card>
    </div>
  );
}

