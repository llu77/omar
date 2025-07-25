
'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search, FileText, BookOpen, Star, Sparkles, Brain, Activity, Heart, MessageSquare, Send, Bot, User, FlaskConical, CornerDownLeft } from 'lucide-react';

const DiscussionModal = ({ isOpen, setIsOpen, initialSummary, topic }: { isOpen: boolean, setIsOpen: (open: boolean) => void, initialSummary: string, topic: string }) => {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/discuss',
    initialMessages: [
      { id: '0', role: 'system', content: `You are a research expert. The user wants to discuss the following research summary on "${topic}". Engage with them scientifically and medically, without bias, and provide the best reliable answers.\n\nHere is the summary:\n${initialSummary}` },
      { id: '1', role: 'assistant', content: 'أهلاً بك. أنا جاهز لمناقشة هذا الملخص البحثي معك. ما هي استفساراتك؟' }
    ],
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
      <div className="min-h-[calc(100vh-10rem)] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 text-white -m-8 p-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
          <div className="medical-grid"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center space-x-4 mb-6">
              <Brain className="w-12 h-12 text-cyan-300 animate-float" />
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500/30 to-teal-500/30 rounded-full shadow-lg shadow-blue-500/20">
                <Sparkles className="w-10 h-10 text-amber-400" />
              </div>
              <Activity className="w-12 h-12 text-teal-300 animate-float animation-delay-1000" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 animate-gradient">
                ملخص الأبحاث الطبية الحديثة
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
              احصل على ملخصات احترافية لأحدث الأبحاث الطبية من مصادر موثوقة باستخدام الذكاء الاصطناعي
            </p>
          </div>

          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300">
              <form onSubmit={handleFormSubmit}>
                <div className="mb-6">
                  <label className="block text-cyan-200 text-sm font-medium mb-3">
                    ما الموضوع الطبي الذي تريد البحث عنه؟
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      placeholder="مثال: علاج السكري، أبحاث السرطان، تقنيات جراحة القلب..."
                      className="w-full pl-5 pr-14 py-4 bg-white/10 border-2 border-cyan-400/30 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all duration-300"
                      disabled={isLoading}
                      dir="rtl"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400 w-6 h-6 group-focus-within:text-cyan-300 transition-colors" />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-cyan-500/25"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin ml-3 w-6 h-6" />
                      جاري البحث وتحليل الأبحاث...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <FileText className="ml-3 w-6 h-6" />
                      تلخيص الأبحاث الطبية
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {error && (
            <div className="max-w-3xl mx-auto mb-8 p-5 bg-red-500/10 backdrop-blur-lg border-2 border-red-500/30 rounded-xl text-red-300 animate-shake">
              <p className="flex items-center">
                <span className="text-2xl ml-2">⚠️</span>
                {error.message}
              </p>
            </div>
          )}

          {(hasSummary || isLoading) && (
            <div className="max-w-4xl mx-auto animate-slide-up">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300">
                <div className="flex items-center mb-8 pb-6 border-b border-cyan-500/20">
                  <BookOpen className="w-8 h-8 text-cyan-400 ml-3" />
                  <h2 className="text-3xl font-bold text-white">نتائج البحث</h2>
                </div>
                
                <div className="prose prose-invert max-w-none text-cyan-100 leading-relaxed text-lg rtl-prose">
                  {messages.filter(m => m.role === 'assistant').map((m, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br />') }} />
                  ))}
                  {isLoading && messages.filter(m => m.role === 'assistant').length === 0 && (
                    <div className="flex items-center justify-center gap-3 text-cyan-300">
                      <Loader2 className="animate-spin h-6 w-6"/>
                      <span>وصّل يقوم الان بالتفكير وتلخيص ابحاث حول موضوعك انتظرني من فضلك</span>
                    </div>
                  )}
                </div>
                
                {!isLoading && currentSummary && (
                <div className="mt-8 pt-8 border-t border-cyan-500/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center text-cyan-300">
                      <Star className="w-5 h-5 ml-2 text-amber-400" />
                      <span className="font-medium">مصادر موثقة ومحدثة</span>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setIsDiscussionModalOpen(true)}
                        className="bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30"
                      >
                         <MessageSquare className="ml-2 h-4 w-4" />
                        ناقشني حول البحث
                      </Button>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 pointer-events-none">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-cyan-300/70 text-sm">
                يستخدم هذا النظام تقنيات الذكاء الاصطناعي المتقدمة لتحليل وتلخيص الأبحاث الطبية من مصادر علمية موثوقة
              </p>
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
          .medical-grid {
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
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-up { animation: slideUp 0.7s ease-out; }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-float { animation: float 4s ease-in-out infinite; }
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-15px) scale(1.05); }
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
          .animate-shake { animation: shake 0.6s ease-in-out; }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          .animation-delay-1000 { animation-delay: 1s; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .rtl-prose {
            direction: rtl;
            text-align: right;
          }
        `}</style>
      </div>
    </>
  );
};

export default MedicalResearchSummarizer;
