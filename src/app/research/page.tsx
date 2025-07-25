
'use client';

import { useRef, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Send, Bot, User, Loader2, FlaskConical, Sparkles } from 'lucide-react';
import { useChat } from 'ai/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function ResearchPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
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

  const handleExampleClick = (example: string) => {
    setInput(example);
  };
  
  const exampleQueries = [
    "آخر ما توصل له العلم في علاج آلام أسفل الظهر المزمنة",
    "تأثير تمارين المقاومة على كبار السن المصابين بهشاشة العظام",
    "فعالية العلاج بالواقع الافتراضي في تأهيل مرضى السكتة الدماغية",
  ];

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
        handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto animate-in fade-in-50">

      {/* Page Header */}
      <header className="text-center mb-10">
        <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
          <FlaskConical className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline">مساعد البحوث العلمية</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          احصل على ملخصات احترافية لأحدث الأبحاث الطبية من مصادر موثوقة، معززة بالذكاء الاصطناعي.
        </p>
      </header>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col shadow-lg overflow-hidden">
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6 space-y-6">
              {messages.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground p-8 space-y-4">
                    <Sparkles className="h-10 w-10 mx-auto text-primary/50"/>
                    <h3 className="text-lg font-semibold text-foreground">ابدأ البحث العلمي</h3>
                    <p>يمكنك السؤال عن أي موضوع طبي، أو جرب أحد الأمثلة التالية:</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {exampleQueries.slice(0,3).map((ex, i) => (
                             <Button key={i} variant="outline" size="sm" onClick={() => handleExampleClick(ex)}>
                                {ex}
                             </Button>
                        ))}
                    </div>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role !== 'user' && (
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarFallback className='bg-primary text-primary-foreground'><Bot size={21} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    dir="auto"
                    className={`max-w-xl rounded-xl px-4 py-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    {/* Render message content with markdown interpretation */}
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2" dangerouslySetInnerHTML={{ __html: message.content.replace(/\\n/g, '<br />') }} />
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-9 w-9">
                      <AvatarFallback><User size={21} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4 justify-start">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className='bg-primary text-primary-foreground'><Bot size={21} /></AvatarFallback>
                  </Avatar>
                  <div className="bg-card border rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">أبحث في المصادر وأُعِد الملخص...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Input Form */}
      <div className="mt-4">
        <div className="p-4 border-t bg-background/80 backdrop-blur-sm rounded-lg border">
            <form onSubmit={handleFormSubmit} className="flex items-start gap-2">
            <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="اكتب موضوع البحث هنا..."
                className="flex-1 resize-none"
                rows={1}
                disabled={isLoading}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if(input.trim()) handleSubmit(e as any);
                    }
                }}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="lg">
                {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                <Send className="h-5 w-5" />
                )}
                <span className="sr-only">إرسال</span>
            </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
