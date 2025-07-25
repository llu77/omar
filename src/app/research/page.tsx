
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search, FileText, BookOpen, Star, Sparkles, Brain, Activity, Heart, MessageSquare, Send, Bot, User, FlaskConical, CornerDownLeft } from 'lucide-react';
import {AIMessage} from '@/types';

const DiscussionModal = ({ isOpen, setIsOpen, initialSummary, topic }: { isOpen: boolean, setIsOpen: (open: boolean) => void, initialSummary: string, topic: string }) => {
  const systemMessage: AIMessage = { 
      id: '0', 
      role: 'system', 
      content: `You are a research expert. The user wants to discuss the following research summary on "${topic}". Engage with them scientifically and medically, without bias, and provide the best reliable answers.\n\nHere is the summary:\n${initialSummary}` 
  };

  const { messages, setMessages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading } = useChat({
    api: '/api/discuss',
    initialMessages: [
        { id: '1', role: 'assistant', content: 'أهلاً بك. أنا جاهز لمناقشة هذا الملخص البحثي معك. ما هي استفساراتك؟' }
    ]
  });
  
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

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
      // Pass the entire history, including the system message, in the body
      originalHandleSubmit(e, {
          options: {
              body: {
                  messages: [systemMessage, ...messages]
              }
          }
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
      // Set the summary content when the AI is done responding.
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
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
       if (input.trim()) {
        const customEvent = new Event('submit', { bubbles: true, cancelable: true });
        e.currentTarget.form?.dispatchEvent(customEvent);
        e.preventDefault();
      }
    }
  };

  const hasSummary = messages.some(m => m.role === 'assistant');

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-10rem)] -m-8">

        {/* Header */}
        <header className="p-8 border-b bg-background/80 backdrop-blur-sm z-10">
            <div className="text-center">
                <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-3">
                    <FlaskConical className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                    مساعد البحوث العلمية
                </h1>
                <p className="text-md text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                   احصل على ملخصات احترافية لأحدث الأبحاث الطبية من مصادر موثوقة، معززة بالذكاء الاصطناعي.
                </p>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center text-muted-foreground py-10">
                                <BookOpen className="mx-auto h-16 w-16 mb-4 opacity-50" />
                                <h2 className="text-xl font-semibold mb-2">كيف يمكنني مساعدتك اليوم؟</h2>
                                <p>يمكنك البدء بكتابة موضوع طبي في الحقل أدناه.</p>
                                <div className="mt-6 space-y-2 text-sm">
                                    <p>أمثلة:</p>
                                    <button onClick={() => setInput('تأثير التمارين الرياضية على مرضى السكري')} className="text-primary hover:underline">"تأثير التمارين الرياضية على مرضى السكري"</button><br/>
                                    <button onClick={() => setInput('أحدث علاجات مرض الزهايمر')} className="text-primary hover:underline">"أحدث علاجات مرض الزهايمر"</button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                                <p><strong>خطأ:</strong> {error.message}</p>
                            </div>
                        )}

                        <div className="prose prose-sm sm:prose-base max-w-none rtl-prose">
                           {messages.filter(m => m.role === 'assistant').map((m, i) => (
                              <div key={i} dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br />') }} />
                           ))}
                        </div>

                         {isLoading && (
                            <div className="flex items-center justify-center gap-3 text-muted-foreground p-8">
                                <Loader2 className="animate-spin h-6 w-6"/>
                                <span>وصّل يقوم الان بالتفكير وتلخيص ابحاث حول موضوعك انتظرني من فضلك</span>
                            </div>
                        )}
                        
                        {!isLoading && hasSummary && (
                            <div className="mt-8 pt-6 border-t">
                                <Button onClick={() => setIsDiscussionModalOpen(true)}>
                                    <MessageSquare className="ml-2 h-4 w-4" />
                                    ناقشني حول البحث
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t bg-background">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleFormSubmit} className="relative">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="اكتب موضوع البحث هنا..."
                            className="w-full py-6 pr-12 text-base"
                            disabled={isLoading}
                        />
                         <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                             <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                ) : (
                                    <CornerDownLeft className="h-5 w-5"/>
                                )}
                            </Button>
                         </div>
                    </form>
                </div>
            </div>
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

      <style jsx>{`
        .rtl-prose {
          direction: rtl;
          text-align: right;
        }
        .rtl-prose a {
            color: hsl(var(--primary));
        }
        .rtl-prose a:hover {
            text-decoration: underline;
        }
      `}</style>
    </>
  );
};

export default MedicalResearchSummarizer;
