
"use client";

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { collection, doc, query, orderBy, addDoc, serverTimestamp, where, getDocs, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Video, Paperclip, Phone, UserPlus, Bot, MessageSquare, Loader2, PlusCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { CommunicationChannel, Message as MessageType, User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


// ======================= COMPONENT: ChannelListItem =======================

interface ChannelListItemProps {
  channel: CommunicationChannel;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string;
}

const ChannelListItem = ({ channel, isActive, onClick, currentUserId }: ChannelListItemProps) => {
    const { toast } = useToast();
    const otherParticipantId = channel.type === 'direct' ? channel.participants.find(p => p !== currentUserId) : null;

    const [otherUserData, otherUserLoading, otherUserError] = useDocumentData(
        otherParticipantId ? doc(db, 'users', otherParticipantId) : null
    );

    useEffect(() => {
        if(otherUserError) {
            toast({ variant: 'destructive', title: 'خطأ', description: `فشل في جلب بيانات المستخدم: ${otherUserError.message}` });
        }
    }, [otherUserError, toast]);

    const name = channel.type === 'bot' 
        ? channel.name 
        : (otherUserData?.name || channel.name || 'مستخدم غير معروف');
    
    const avatarUrl = channel.type === 'bot' 
        ? channel.avatarUrl 
        : (otherUserData?.photoURL || channel.avatarUrl);

    const lastMessage = channel.lastMessageContent;
    const lastMessageTimestamp = channel.lastMessageTimestamp?.toDate();
    const unreadCount = channel.unreadCounts?.[currentUserId] || 0;

    if (otherUserLoading) {
        return <Skeleton className="h-[72px] w-full" />;
    }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}
    >
      <Avatar className="h-12 w-12 border-2 border-primary/20">
        <AvatarImage src={avatarUrl || ''} alt={name} />
        <AvatarFallback className={`${channel.type === 'bot' ? 'bg-primary text-primary-foreground' : ''}`}>
          {channel.type === 'bot' ? <Bot size={24} /> : name.substring(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <p className="font-semibold truncate">{name}</p>
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
           <AvatarImage src={message.senderAvatarUrl || ''} alt={message.senderName?.[0] || 'U'} />
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
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // --- Firestore Hooks ---
  const channelsQuery = user ? query(collection(db, 'channels'), where('participants', 'array-contains', user.uid), orderBy('lastMessageTimestamp', 'desc')) : null;
  const [channelsSnapshot, channelsLoading] = useCollection(channelsQuery);

  const messagesQuery = activeChannelId ? query(collection(db, 'channels', activeChannelId, 'messages'), orderBy('timestamp', 'asc')) : null;
  const [messagesSnapshot, messagesLoading, messagesError] = useCollection(messagesQuery);

  const channels: CommunicationChannel[] = channelsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunicationChannel)) || [];
  const activeChannelData = channels.find(c => c.id === activeChannelId);

  const otherParticipantId = activeChannelData?.type === 'direct' 
    ? activeChannelData.participants.find(p => p !== user?.uid) 
    : null;
    
  const [otherUserData, otherUserLoading] = useDocumentData(
    otherParticipantId ? doc(db, 'users', otherParticipantId) : null
  );

  // --- Effects ---
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  useEffect(() => {
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
      const channelRef = doc(db, 'channels', activeChannelId);
      const messagesColRef = collection(channelRef, 'messages');
      
      const batch = writeBatch(db);

      // Add new message
      const messageDocRef = doc(messagesColRef);
      batch.set(messageDocRef, {
        content: messageContent,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderAvatarUrl: user.photoURL || '',
        timestamp: serverTimestamp(),
      });

      // Update channel's last message
      batch.update(channelRef, {
        lastMessageContent: messageContent,
        lastMessageTimestamp: serverTimestamp()
      });

      await batch.commit();

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

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim() || !user) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const usersRef = collection(db, "users");
      // IMPORTANT: Firestore queries are case-sensitive. Searching by email will
      // be more reliable if you enforce storing emails in a consistent case 
      // (e.g., lowercase) during user registration.
      const q = query(usersRef, where("email", "==", searchEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      const results: User[] = [];
      querySnapshot.forEach((doc) => {
        // Exclude current user from search results
        if (doc.id !== user.uid) {
          results.push({ id: doc.id, ...doc.data() } as User);
        }
      });
      setSearchResults(results);
      if (results.length === 0) {
        toast({
          title: "لا توجد نتائج",
          description: "لم يتم العثور على مستخدم بهذا البريد الإلكتروني.",
        });
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast({ variant: 'destructive', title: 'خطأ بالبحث', description: 'حدث خطأ أثناء البحث عن المستخدم.'});
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateChannel = async (otherUser: User) => {
    if (!user) return;
    setIsCreatingChannel(true);
    try {
      // Check if a DM channel already exists
      // IMPORTANT: This query requires a composite index in Firestore.
      // If you see an error in the browser console mentioning an index,
      // it will provide a direct link to create it in the Firebase console.
      const channelsRef = collection(db, 'channels');
      const q = query(channelsRef, 
        where('type', '==', 'direct'),
        where('participants', 'array-contains-any', [user.uid, otherUser.id])
      );

      const existingChannelsSnapshot = await getDocs(q);
      let existingChannel = null;

      // Since array-contains-any can return channels where only one participant matches,
      // we need to filter client-side to find the exact match.
      existingChannelsSnapshot.forEach(doc => {
        const channel = doc.data() as CommunicationChannel;
        const p = channel.participants;
        if (p.length === 2 && p.includes(user.uid) && p.includes(otherUser.id)) {
            existingChannel = { id: doc.id, ...channel };
        }
      });

      if (existingChannel) {
        // Channel already exists, just open it
        setActiveChannelId(existingChannel.id);
        toast({ title: "موجود بالفعل", description: "تم فتح المحادثة الحالية." });
      } else {
        // Create a new channel
        const newChannelData = {
          name: otherUser.name,
          type: 'direct',
          participants: [user.uid, otherUser.id],
          participantNames: {
            [user.uid]: user.displayName,
            [otherUser.id]: otherUser.name,
          },
          participantAvatars: {
             [user.uid]: user.photoURL || '',
             [otherUser.id]: otherUser.photoURL || '',
          },
          lastMessageContent: `بدأت محادثة مع ${otherUser.name}`,
          lastMessageTimestamp: serverTimestamp(),
          unreadCounts: { [user.uid]: 0, [otherUser.id]: 0 },
          createdAt: serverTimestamp(),
        };
        const newChannelRef = await addDoc(channelsRef, newChannelData);
        setActiveChannelId(newChannelRef.id);
        toast({ title: "تم إنشاء المحادثة", description: `يمكنك الآن التواصل مع ${otherUser.name}.` });
      }
      setIsNewUserModalOpen(false);
      setSearchEmail('');
      setSearchResults([]);

    } catch (error) {
      console.error("Error creating channel:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إنشاء قناة المحادثة.' });
    } finally {
      setIsCreatingChannel(false);
    }
  }

  // --- Render Logic ---
  const getActiveChannelName = () => {
    if (otherUserLoading) return 'تحميل...';
    if (!activeChannelData || !user) return 'اختر محادثة';
    if (activeChannelData.type === 'bot') return activeChannelData.name;
    return otherUserData?.name || 'مستخدم غير معروف';
  };
  
  const getActiveChannelAvatar = () => {
    if (otherUserLoading) return '';
    if (!activeChannelData || !user) return '';
    if (activeChannelData.type === 'bot') return activeChannelData.avatarUrl;
    return otherUserData?.photoURL || '';
  }


  if (loading) {
     return <div className="p-6"><Skeleton className="h-[70vh] w-full" /></div>;
  }
  
  if (!user) return null; // Or a login prompt

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 animate-in fade-in-50">
      {/* Channels List */}
      <Card className="w-1/3 flex-shrink-0 flex flex-col">
        <CardHeader className="p-4 border-b">
            <Dialog open={isNewUserModalOpen} onOpenChange={setIsNewUserModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full"><PlusCircle className="ml-2 h-4 w-4"/>محادثة جديدة</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>بدء محادثة جديدة</DialogTitle>
                  <DialogDescription>
                    ابحث عن مستخدم عن طريق البريد الإلكتروني لبدء محادثة آمنة.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input 
                    placeholder="البريد الإلكتروني للمستخدم"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    disabled={isSearching}
                  />
                  <Button type="submit" disabled={isSearching || !searchEmail.trim()}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </form>
                <div className="mt-4 space-y-2">
                  {isSearching && <p className="text-center text-muted-foreground">جاري البحث...</p>}
                  {searchResults.map(foundUser => (
                    <div key={foundUser.id} className="flex items-center justify-between p-2 rounded-md border">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={foundUser.photoURL || ''} alt={foundUser.name} />
                          <AvatarFallback>{foundUser.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{foundUser.name}</p>
                          <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleCreateChannel(foundUser)} disabled={isCreatingChannel}>
                        {isCreatingChannel ? <Loader2 className="h-4 w-4 animate-spin"/> : 'تواصل'}
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
        </CardHeader>
        <ScrollArea className="flex-1">
          {channelsLoading && <div className="p-4 space-y-3"><Skeleton className="h-[72px] w-full"/><Skeleton className="h-[72px] w-full"/></div>}
          {!channelsLoading && channels.length === 0 && (
            <div className="p-6 text-center text-muted-foreground h-full flex flex-col justify-center items-center">
              <MessageSquare className="mx-auto h-12 w-12" />
              <p className="mt-4">لا توجد محادثات.</p>
              <p className="text-sm">ابدأ محادثة جديدة.</p>
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
      </Card>

      {/* Active Chat Window */}
      <Card className="flex-1 flex flex-col">
         {activeChannelData ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                      <AvatarImage src={getActiveChannelAvatar()} alt={getActiveChannelName()} />
                      <AvatarFallback>{getActiveChannelName().substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  <div>
                    <CardTitle className="text-lg">{getActiveChannelName()}</CardTitle>
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
                <p>أو أنشئ محادثة جديدة من الزر أعلاه</p>
            </div>
         )}
      </Card>
    </div>
  );
}

    