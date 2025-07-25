
'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Send, Bot, User, Loader2, FlaskConical } from 'lucide-react';
import { useChat } from 'ai/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function ResearchPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/research',
    onError: (err) => {
      console.error('Research summarization error:', err);
    },
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Scroll to the bottom of the chat view
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <FlaskConical className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">البحوث العلمية</CardTitle>
          <CardDescription>
            سأقوم بتلخيص أحدث البحوث الطبية من مصادر موثوقة.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role !== 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className='bg-primary text-primary-foreground'><Bot size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 prose prose-sm dark:prose-invert ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><User size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className='bg-primary text-primary-foreground'><Bot size={20} /></AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary rounded-xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">أبحث وألخص...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="اكتب موضوع البحث هنا..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">إرسال</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
