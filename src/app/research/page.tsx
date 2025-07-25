
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, BookOpen, MessageSquare, Send, Bot, User, FlaskConical, CornerDownLeft, Search, FileText, Star, Sparkles, Brain, Activity } from 'lucide-react';
import type { AIMessage } from '@/types';

const DiscussionModal = ({ isOpen, setIsOpen, initialSummary, topic }: { isOpen: boolean, setIsOpen: (open: boolean) => void, initialSummary: string, topic: string }) => {
  const systemMessageContent = `You are a research expert. The user wants to discuss the following research summary on "${topic}". Engage with them scientifically and medically, without bias, and provide the best reliable answers.\n\nHere is the summary:\n${initialSummary}`;
  
  const { messages, setMessages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading } = useChat({
    api: '/api/discuss',
    initialMessages: [
      { id: '1', role: 'assistant', content: 'أهلاً بك. أنا جاهز لمناقشة هذا الملخص البحثي معك. ما هي استفساراتك؟' }
    ]
  });
  
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
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
    
    // Let useChat handle the messages, just send the system prompt as extra data
    originalHandleSubmit(e, {
      options: {
        body: {
          data: {
            systemMessage: systemMessageContent,
          }
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
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
       const form = e.currentTarget.closest('form');
       if(form) {
           form.requestSubmit();
       }
    }
  };
  
  const assistantMessage = messages.find(m => m.role === 'assistant');

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900">
      
        {/* خلفية متحركة */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
          <div className="medical-grid"></div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col h-[calc(100vh-8rem)]">
          {/* الهيدر */}
          <div className="text-center mb-6 animate-fade-in">
            <div className="inline-flex items-center justify-center space-x-4 mb-4">
                <Brain className="w-8 h-8 text-cyan-300 animate-float" />
                <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-500/30 to-teal-500/30 rounded-full shadow-lg shadow-blue-500/20">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <Activity className="w-8 h-8 text-teal-300 animate-float animation-delay-1000" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 animate-gradient">
                مساعد البحوث الطبية
                </span>
            </h1>
            <p className="text-md text-blue-200 max-w-2xl mx-auto leading-relaxed">
            احصل على ملخصات احترافية لأحدث الأبحاث الطبية من مصادر موثوقة، معززة بالذكاء الاصطناعي.
            </p>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0">
             {!assistantMessage && !isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-blue-200/80 p-6">
                        <BookOpen className="mx-auto h-16 w-16 mb-4" />
                        <h2 className="mt-4 text-xl font-semibold">ابدأ رحلتك البحثية</h2>
                        <p className="mt-2 text-md">
                        اكتب سؤالاً أو موضوعًا لبدء تلخيص الأبحاث العلمية.
                        </p>
                    </div>
                </div>
             ) : (
                <ScrollArea className="h-full">
                    <div className="max-w-4xl mx-auto py-4">
                        {assistantMessage && (
                            <div className="animate-slide-up">
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-cyan-500/20">
                                <div className="flex items-center mb-6 pb-4 border-b border-cyan-500/20">
                                    <BookOpen className="w-7 h-7 text-cyan-400 ml-3" />
                                    <h2 className="text-2xl font-bold text-white">نتائج البحث عن: {currentTopic}</h2>
                                </div>
                                <div className="prose prose-invert max-w-none prose-p:my-2 prose-headings:text-cyan-200">
                                    <div className="text-cyan-100 leading-relaxed whitespace-pre-wrap text-lg" dangerouslySetInnerHTML={{ __html: assistantMessage.content.replace(/\n/g, '<br />') }}/>
                                </div>
                                <div className="mt-6 pt-6 border-t border-cyan-500/20">
                                    <Button size="sm" variant="outline" className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200" onClick={() => {
                                        setCurrentSummary(assistantMessage.content);
                                        setCurrentTopic(input || currentTopic);
                                        setIsDiscussionModalOpen(true);
                                    }}>
                                        <MessageSquare className="ml-2 h-4 w-4" />
                                        ناقشني حول البحث
                                    </Button>
                                </div>
                                </div>
                            </div>
                        )}
                        {isLoading && (
                            <div className="flex items-center justify-center text-white/80 text-lg gap-4 p-10">
                            <Loader2 className="animate-spin w-8 h-8" />
                            <span>وصّل يقوم الان بالتفكير وتلخيص ابحاث حول موضوعك انتظرني من فضلك...</span>
                            </div>
                        )}
                    </div>
                </ScrollArea>
             )}
          </div>


          {/* Input Form */}
          <div className="mt-auto pt-4">
            <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 shadow-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300">
                <div className="relative group flex gap-2">
                  <Input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="مثال: علاج السكري، أبحاث السرطان، تقنيات جراحة القلب..."
                    className="w-full pl-5 pr-12 py-3 bg-white/10 border-2 border-cyan-400/30 rounded-lg text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all duration-300 h-12"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-cyan-500/25"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .medical-grid {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: grid-move 25s linear infinite;
        }

        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        
        .animate-fade-in { animation: fadeIn 1.2s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-up { animation: slideUp 0.7s ease-out; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <DiscussionModal
        isOpen={isDiscussionModalOpen}
        setIsOpen={setIsDiscussionModalOpen}
        initialSummary={currentSummary}
        topic={currentTopic}
      />
    </>
  );
};

export default MedicalResearchSummarizer;
