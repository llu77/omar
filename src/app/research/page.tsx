
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, BookOpen, MessageSquare, Send, Bot, User, FlaskConical, CornerDownLeft, Search, FileText, Star, Sparkles, Brain, Activity, Heart } from 'lucide-react';
import { AIMessage } from '@/types';

const DiscussionModal = ({ isOpen, setIsOpen, initialSummary, topic }: { isOpen: boolean, setIsOpen: (open: boolean) => void, initialSummary: string, topic: string }) => {
  const systemMessage: AIMessage = {
    id: '0',
    role: 'system',
    content: `You are a research expert. The user wants to discuss the following research summary on "${topic}". Engage with them scientifically and medically, without bias, and provide the best reliable answers.\n\nHere is the summary:\n${initialSummary}`
  };
  
  const initialModalMessages: AIMessage[] = [
    { id: '1', role: 'assistant', content: 'أهلاً بك. أنا جاهز لمناقشة هذا الملخص البحثي معك. ما هي استفساراتك؟' }
  ];

  const { messages, setMessages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading } = useChat({
    api: '/api/discuss',
  });
  
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When the modal opens, set the initial messages.
    if (isOpen) {
      setMessages(initialModalMessages);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const fullHistory: AIMessage[] = [
      systemMessage,
      ...messages,
      { id: Date.now().toString(), role: 'user', content: input },
    ];
    
    // We pass the full history in the body, but useChat will handle adding the new user message to its own state
    originalHandleSubmit(e, {
      options: {
        body: {
          messages: fullHistory,
        },
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-6 w-6" />
            مناقشة البحث: {topic}
          </DialogTitle>
          <DialogDescription>
            يمكنك طرح أسئلة تفصيلية حول الملخص البحثي.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="space-y-4 pr-4">
              {messages.filter(m => m.role !== 'system').map((message) => (
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
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                    <span className="text-sm text-muted-foreground">يفكر...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="اطرح سؤالاً حول البحث..."
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
      </DialogContent>
    </Dialog>
  );
};


const MedicalResearchSummarizer = () => {
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/research',
    onFinish: (message) => {
      setCurrentSummary(message.content);
    },
    onError: (err) => {
      console.error('Research summarization error:', err);
    },
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    setCurrentTopic(input);
    setCurrentSummary('');
    handleSubmit(e);
  };

  const hasSummary = messages.some(m => m.role === 'assistant');

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        {/* Header */}
        <header className="p-4 text-center border-b">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-2">
            <FlaskConical className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">مساعد البحوث العلمية</h1>
          <p className="text-muted-foreground">
            احصل على ملخصات احترافية لأحدث الأبحاث الطبية من مصادر موثوقة، معززة بالذكاء الاصطناعي.
          </p>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center text-muted-foreground py-10">
                    <BookOpen className="mx-auto h-12 w-12" />
                    <h2 className="mt-4 text-lg font-semibold">ابدأ رحلتك البحثية</h2>
                    <p className="mt-1 text-sm">
                      اطرح سؤالاً أو اكتب موضوعًا لبدء تلخيص الأبحاث العلمية.
                    </p>
                    <div className="mt-4 text-xs text-left rtl:text-right bg-secondary p-3 rounded-md">
                      <h3 className="font-semibold mb-2">أمثلة مقترحة:</h3>
                      <ul className="list-disc list-inside">
                        <li>تأثير التمارين الرياضية على مرضى السكري من النوع الثاني</li>
                        <li>أحدث علاجات مرض الزهايمر</li>
                        <li>تقنيات العلاج الجيني للسرطان</li>
                      </ul>
                    </div>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role !== 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className='bg-primary text-primary-foreground'><Bot size={20} /></AvatarFallback>
                      </Avatar>
                    )}
                    <div className="max-w-2xl">
                      <div
                        className={`rounded-xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none prose-p:my-2" dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
                      </div>
                      {message.role === 'assistant' && (
                        <div className="mt-2">
                           <Button size="sm" variant="outline" onClick={() => {
                             setCurrentSummary(message.content);
                             setCurrentTopic(input || currentTopic);
                             setIsDiscussionModalOpen(true);
                           }}>
                            <MessageSquare className="ml-2 h-4 w-4" />
                            ناقشني حول البحث
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
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
                      <span className="text-sm text-muted-foreground">وصّل يقوم الان بالتفكير وتلخيص ابحاث حول موضوعك انتظرني من فضلك</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
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
      </div>
      
      {currentSummary && (
        <DiscussionModal
          isOpen={isDiscussionModalOpen}
          setIsOpen={setIsDiscussionModalOpen}
          initialSummary={currentSummary}
          topic={currentTopic}
        />
      )}
    </>
  );
};

export default MedicalResearchSummarizer;
