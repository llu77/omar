"use client";

import { useEffect, useState, useRef, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';
import { 
  collection, doc, query, orderBy, addDoc, serverTimestamp, where, getDocs, 
  writeBatch, updateDoc, increment, DocumentData, Timestamp, onSnapshot,
  deleteDoc, setDoc
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, Video, Paperclip, Phone, UserPlus, Bot, MessageSquare, Loader2, 
  PlusCircle, Search, Shield, Clock, CheckCircle2, AlertTriangle, 
  FileText, Image as ImageIcon, Mic, Volume2, Translate, Star,
  MoreHorizontal, Download, Eye, Lock, Unlock, Users, Calendar,
  Stethoscope, UserX, Bell, BellOff, Archive, Trash2, Flag,
  FileVideo, FilePdf, FileAudio, Copy, Reply, Forward,
  Settings, Info, VideoOff, MicOff, PhoneOff, ScreenShare,
  Maximize2, Minimize2, VolumeOff, UserCheck, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { CommunicationChannel, Message as MessageType, User } from '@/types';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ======================= TYPES & INTERFACES =======================

interface ExtendedMessage extends MessageType {
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system' | 'medical_report';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  duration?: number; // for voice/video messages
  isEncrypted?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  patientId?: string;
  medicalContext?: {
    diagnosis?: string;
    treatment?: string;
    notes?: string;
    attachments?: string[];
  };
  translation?: {
    [language: string]: string;
  };
  reactions?: {
    [userId: string]: string; // emoji reaction
  };
  replyTo?: string; // message ID being replied to
  isEdited?: boolean;
  editedAt?: Timestamp;
  readBy?: {
    [userId: string]: Timestamp;
  };
  deliveredTo?: {
    [userId: string]: Timestamp;
  };
}

interface ExtendedChannel extends CommunicationChannel {
  isArchived?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  tags?: string[];
  department?: string;
  specialization?: string;
  urgencyLevel?: 'routine' | 'urgent' | 'emergency';
  encryptionEnabled?: boolean;
  autoTranslate?: boolean;
  preferredLanguage?: string;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  retentionPeriod?: number; // days
  complianceFlags?: string[];
  lastActivity?: Timestamp;
  activeCall?: {
    type: 'voice' | 'video';
    participants: string[];
    startTime: Timestamp;
    isRecording?: boolean;
  };
}

interface SmartAlert {
  id: string;
  type: 'medication' | 'appointment' | 'emergency' | 'follow_up' | 'system';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionRequired?: boolean;
  relatedPatientId?: string;
  timestamp: Timestamp;
  isRead: boolean;
  actions?: {
    label: string;
    action: string;
    type: 'primary' | 'secondary' | 'danger';
  }[];
}

interface VoiceCallState {
  isActive: boolean;
  participants: string[];
  isMuted: boolean;
  isOnHold: boolean;
  duration: number;
  quality: 'poor' | 'good' | 'excellent';
}

interface VideoCallState extends VoiceCallState {
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  layout: 'grid' | 'speaker' | 'gallery';
  recordings: boolean;
}

// ======================= UTILITY FUNCTIONS =======================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (fileType.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
  if (fileType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
  if (fileType === 'application/pdf') return <FilePdf className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

const getMedicalPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'urgent': return 'bg-orange-500';
    case 'high': return 'bg-yellow-500';
    case 'normal': return 'bg-blue-500';
    case 'low': return 'bg-gray-500';
    default: return 'bg-blue-500';
  }
};

// ======================= ENHANCED COMPONENTS =======================

// Enhanced Channel List Item with Medical Context
interface EnhancedChannelListItemProps {
  channel: ExtendedChannel;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string;
  onArchive: (channelId: string) => void;
  onMute: (channelId: string) => void;
  onPin: (channelId: string) => void;
}

const EnhancedChannelListItem = ({ 
  channel, isActive, onClick, currentUserId, onArchive, onMute, onPin 
}: EnhancedChannelListItemProps) => {
  const { toast } = useToast();
  const otherParticipantId = channel.type === 'direct' ? 
    channel.participants.find(p => p !== currentUserId) : null;

  const [otherUserData, otherUserLoading, otherUserError] = useDocumentData<User>(
    otherParticipantId ? doc(db, 'users', otherParticipantId) : null
  );

  const [isOnline, setIsOnline] = useState(false);

  // Real-time presence tracking
  useEffect(() => {
    if (!otherParticipantId) return;
    
    const presenceRef = doc(db, 'presence', otherParticipantId);
    const unsubscribe = onSnapshot(presenceRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsOnline(data.status === 'online' && 
          (new Date().getTime() - data.lastSeen?.toDate().getTime()) < 60000);
      }
    });

    return () => unsubscribe();
  }, [otherParticipantId]);

  if (otherUserLoading) {
    return <Skeleton className="h-[80px] w-full" />;
  }

  const name = channel.type === 'bot' 
    ? channel.name 
    : (otherUserData?.name || channel.name || 'مستخدم غير معروف');
  
  const avatarUrl = channel.type === 'bot' 
    ? channel.avatarUrl 
    : (otherUserData?.photoURL || channel.avatarUrl);

  const lastMessage = channel.lastMessageContent;
  const lastMessageTimestamp = channel.lastMessageTimestamp?.toDate();
  const unreadCount = channel.unreadCounts?.[currentUserId] || 0;

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-primary/10 border-l-4 border-primary shadow-sm' 
          : 'hover:bg-secondary/50'
      }`}
    >
      {/* Priority Indicator */}
      {channel.urgencyLevel === 'emergency' && (
        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
      
      {/* Pin Indicator */}
      {channel.isPinned && (
        <div className="absolute top-2 left-2">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        </div>
      )}

      <div className="relative">
        <Avatar className={`h-12 w-12 border-2 ${
          channel.type === 'bot' ? 'border-primary/20' : 
          isOnline ? 'border-green-400' : 'border-secondary'
        }`}>
          <AvatarImage src={avatarUrl || ''} alt={name} />
          <AvatarFallback className={`${
            channel.type === 'bot' ? 'bg-primary text-primary-foreground' : ''
          }`}>
            {channel.type === 'bot' ? <Bot size={24} /> : name.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        {/* Online Status */}
        {isOnline && channel.type !== 'bot' && (
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-400 border-2 border-background" />
        )}
        
        {/* Encryption Status */}
        {channel.encryptionEnabled && (
          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-600 flex items-center justify-center">
            <Lock className="h-2 w-2 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <p className="font-semibold truncate">{name}</p>
            
            {/* Medical Specialization Badge */}
            {otherUserData?.specialization && (
              <Badge variant="outline" className="text-xs">
                {otherUserData.specialization}
              </Badge>
            )}
            
            {/* Muted Indicator */}
            {channel.isMuted && (
              <BellOff className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {lastMessageTimestamp && (
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(lastMessageTimestamp, { addSuffix: true, locale: arSA })}
              </p>
            )}
            
            {/* Active Call Indicator */}
            {channel.activeCall && (
              <div className="flex items-center gap-1">
                {channel.activeCall.type === 'video' ? 
                  <Video className="h-3 w-3 text-green-500 animate-pulse" /> :
                  <Phone className="h-3 w-3 text-green-500 animate-pulse" />
                }
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-muted-foreground truncate flex-1">
            {lastMessage || 'لا توجد رسائل بعد'}
          </p>
          
          <div className="flex items-center gap-1">
            {/* Unread Count */}
            {unreadCount > 0 && (
              <Badge className={`text-xs font-bold ${
                channel.urgencyLevel === 'emergency' ? 'bg-red-500' :
                channel.urgencyLevel === 'urgent' ? 'bg-orange-500' : 'bg-primary'
              }`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            
            {/* Urgency Level Indicator */}
            {channel.urgencyLevel && channel.urgencyLevel !== 'routine' && (
              <div className={`h-2 w-2 rounded-full ${
                channel.urgencyLevel === 'emergency' ? 'bg-red-500' :
                channel.urgencyLevel === 'urgent' ? 'bg-orange-500' : 'bg-yellow-500'
              }`} />
            )}
          </div>
        </div>
        
        {/* Department & Tags */}
        {(channel.department || channel.tags?.length) && (
          <div className="flex gap-1 mt-1">
            {channel.department && (
              <Badge variant="secondary" className="text-xs">
                {channel.department}
              </Badge>
            )}
            {channel.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Channel Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onPin(channel.id)}>
            <Star className="h-4 w-4 mr-2" />
            {channel.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMute(channel.id)}>
            {channel.isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            {channel.isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onArchive(channel.id)}>
            <Archive className="h-4 w-4 mr-2" />
            أرشفة
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            حذف المحادثة
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Enhanced Message Bubble with Medical Features
interface EnhancedMessageBubbleProps {
  message: ExtendedMessage;
  isOwnMessage: boolean;
  onReply: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onTranslate: (messageId: string, targetLang: string) => void;
  showMedicalContext?: boolean;
}

const EnhancedMessageBubble = ({ 
  message, isOwnMessage, onReply, onReact, onTranslate, showMedicalContext 
}: EnhancedMessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showFullContext, setShowFullContext] = useState(false);

  const handleTranslate = async (targetLang: string) => {
    setIsTranslating(true);
    await onTranslate(message.id, targetLang);
    setIsTranslating(false);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <img 
              src={message.fileUrl} 
              alt="صورة" 
              className="max-w-xs rounded-lg cursor-pointer"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
            {message.content && <p className="text-sm">{message.content}</p>}
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg max-w-xs">
            {getFileIcon(message.fileType || '')}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(message.fileSize || 0)}
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Download className="h-3 w-3" />
            </Button>
          </div>
        );
      
      case 'voice':
        return (
          <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg max-w-xs">
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Volume2 className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="w-full bg-secondary rounded-full h-1">
                <div className="bg-primary h-1 rounded-full w-1/3"></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor((message.duration || 0) / 60)}:
                {String((message.duration || 0) % 60).padStart(2, '0')}
              </p>
            </div>
          </div>
        );
      
      case 'medical_report':
        return (
          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">تقرير طبي</span>
            </div>
            
            {message.medicalContext && (
              <div className="space-y-2 text-sm">
                {message.medicalContext.diagnosis && (
                  <div>
                    <strong>التشخيص:</strong> {message.medicalContext.diagnosis}
                  </div>
                )}
                {message.medicalContext.treatment && (
                  <div>
                    <strong>العلاج:</strong> {message.medicalContext.treatment}
                  </div>
                )}
                {message.medicalContext.notes && (
                  <div>
                    <strong>ملاحظات:</strong> {message.medicalContext.notes}
                  </div>
                )}
              </div>
            )}
            
            {message.content && (
              <p className="text-sm border-t pt-2">{message.content}</p>
            )}
          </div>
        );
      
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <div 
      className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.senderAvatarUrl || ''} alt={message.senderName?.[0] || 'U'} />
          <AvatarFallback>{message.senderName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
      )}
      
      <div className="relative max-w-xs md:max-w-md lg:max-w-lg">
        {/* Priority Indicator */}
        {message.priority && message.priority !== 'normal' && (
          <div className={`absolute -top-2 -left-2 h-3 w-3 rounded-full ${getMedicalPriorityColor(message.priority)}`} />
        )}
        
        {/* Encryption Indicator */}
        {message.isEncrypted && (
          <div className="absolute -top-1 -right-1 bg-green-600 rounded-full p-1">
            <Lock className="h-2 w-2 text-white" />
          </div>
        )}
        
        <div
          className={`rounded-xl px-4 py-3 shadow-sm ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border'
          }`}
        >
          {/* Reply Context */}
          {message.replyTo && (
            <div className="text-xs opacity-70 mb-2 p-2 bg-secondary/20 rounded border-l-2 border-secondary">
              الرد على رسالة سابقة
            </div>
          )}
          
          {renderMessageContent()}
          
          {/* Message Footer */}
          <div className={`flex items-center justify-between mt-2 text-xs ${
            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            <div className="flex items-center gap-2">
              <span>
                {message.timestamp?.toDate().toLocaleTimeString('ar-SA', { 
                  hour: '2-digit', minute: '2-digit' 
                })}
              </span>
              
              {message.isEdited && (
                <span className="italic">(معدلة)</span>
              )}
              
              {/* Read Status */}
              {isOwnMessage && message.readBy && (
                <div className="flex items-center gap-1">
                  {Object.keys(message.readBy).length > 0 ? (
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                  ) : message.deliveredTo && Object.keys(message.deliveredTo).length > 0 ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {Object.entries(message.reactions).map(([userId, emoji]) => (
                <Badge key={userId} variant="secondary" className="text-xs px-1">
                  {emoji}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Message Actions */}
        {showActions && (
          <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 shadow-lg border`}>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onReply(message.id)}>
              <Reply className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onReact(message.id, '👍')}>
              <span className="text-xs">👍</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Translate className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleTranslate('en')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTranslate('fr')}>
                  Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTranslate('es')}>
                  Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Copy className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Forward className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Smart Alerts Panel
const SmartAlertsPanel = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching smart alerts
    const fetchAlerts = async () => {
      setIsLoading(true);
      // This would connect to your smart alert system
      const mockAlerts: SmartAlert[] = [
        {
          id: '1',
          type: 'medication',
          severity: 'warning',
          title: 'تفاعل دوائي محتمل',
          message: 'تم اكتشاف تفاعل محتمل بين الأدوية الموصوفة للمريض أحمد محمد',
          actionRequired: true,
          relatedPatientId: 'patient_123',
          timestamp: { toDate: () => new Date() } as Timestamp,
          isRead: false,
          actions: [
            { label: 'مراجعة', action: 'review', type: 'primary' },
            { label: 'استشارة صيدلي', action: 'consult', type: 'secondary' }
          ]
        },
        {
          id: '2',
          type: 'appointment',
          severity: 'info',
          title: 'موعد قادم',
          message: 'لديك موعد مع المريض سارة أحمد خلال 30 دقيقة',
          actionRequired: false,
          timestamp: { toDate: () => new Date() } as Timestamp,
          isRead: false
        }
      ];
      setAlerts(mockAlerts);
      setIsLoading(false);
    };

    fetchAlerts();
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Stethoscope className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'warning': return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            التنبيهات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          التنبيهات الذكية
          {alerts.filter(a => !a.isRead).length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {alerts.filter(a => !a.isRead).length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border-l-4 ${getSeverityColor(alert.severity)} ${
                  !alert.isRead ? 'ring-1 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${
                    alert.severity === 'error' ? 'text-red-600' :
                    alert.severity === 'warning' ? 'text-orange-600' :
                    alert.severity === 'success' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(alert.timestamp.toDate(), { addSuffix: true, locale: arSA })}
                      </p>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    
                    {alert.actions && alert.actions.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {alert.actions.map(action => (
                          <Button 
                            key={action.action}
                            size="sm" 
                            variant={action.type === 'primary' ? 'default' : 'outline'}
                            className="text-xs h-6"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Enhanced Video Call Component
const VideoCallInterface = ({ 
  callState, 
  onEndCall, 
  onToggleMute, 
  onToggleVideo, 
  onToggleScreenShare 
}: {
  callState: VideoCallState;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const formatCallDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-3 min-w-[200px] z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm">مكالمة فيديو</span>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsMinimized(false)}>
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatCallDuration(callState.duration)}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900">
        {/* Main Video */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
            <Avatar className="h-32 w-32">
              <AvatarFallback className="text-4xl">د.أ</AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        {/* Self Video */}
        <div className="absolute top-4 right-4 w-40 h-28 bg-gray-700 rounded-lg flex items-center justify-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback>أنت</AvatarFallback>
          </Avatar>
        </div>
        
        {/* Call Info */}
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-3">
          <p className="text-white text-sm">د. أحمد محمد</p>
          <p className="text-gray-300 text-xs">{formatCallDuration(callState.duration)}</p>
          <div className="flex items-center gap-1 mt-1">
            <div className={`h-2 w-2 rounded-full ${
              callState.quality === 'excellent' ? 'bg-green-400' :
              callState.quality === 'good' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-xs text-gray-300">
              {callState.quality === 'excellent' ? 'ممتازة' :
               callState.quality === 'good' ? 'جيدة' : 'ضعيفة'}
            </span>
          </div>
        </div>
        
        {/* Screen Share Indicator */}
        {callState.isScreenSharing && (
          <div className="absolute top-4 center bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
            مشاركة الشاشة نشطة
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="bg-black/80 p-4 flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant={callState.isMuted ? "destructive" : "secondary"}
          className="h-12 w-12 rounded-full"
          onClick={onToggleMute}
        >
          {callState.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        
        <Button
          size="icon"
          variant={callState.isVideoEnabled ? "secondary" : "destructive"}
          className="h-12 w-12 rounded-full"
          onClick={onToggleVideo}
        >
          {callState.isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        
        <Button
          size="icon"
          variant={callState.isScreenSharing ? "default" : "secondary"}
          className="h-12 w-12 rounded-full"
          onClick={onToggleScreenShare}
        >
          <ScreenShare className="h-5 w-5" />
        </Button>
        
        <Button
          size="icon"
          variant="destructive"
          className="h-12 w-12 rounded-full"
          onClick={onEndCall}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-12 w-12 rounded-full text-white"
          onClick={() => setIsMinimized(true)}
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// ======================= MAIN COMPONENT =======================

export default function EnhancedCommunicationPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  // State Management
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [allChannels, setAllChannels] = useState<ExtendedChannel[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [videoCallState, setVideoCallState] = useState<VideoCallState | null>(null);
  const [channelFilter, setChannelFilter] = useState<'all' | 'unread' | 'pinned' | 'archived'>('all');
  const [messageType, setMessageType] = useState<'text' | 'medical_report'>('text');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore Hooks
  const channelsQuery = user ? query(
    collection(db, 'channels'), 
    where('participants', 'array-contains', user.uid)
  ) : null;
  const [channelsSnapshot, channelsLoading] = useCollection(channelsQuery);

  const messagesQuery = activeChannelId ? query(
    collection(db, 'channels', activeChannelId, 'messages'), 
    orderBy('timestamp', 'asc')
  ) : null;
  const [messagesSnapshot, messagesLoading, messagesError] = useCollection(messagesQuery);

  // Derived State
  const activeChannelData = allChannels.find(c => c.id === activeChannelId);
  const otherParticipantId = activeChannelData?.type === 'direct' 
    ? activeChannelData.participants.find(p => p !== user?.uid) 
    : null;
  
  const [otherUserData, otherUserLoading] = useDocumentData<User>(
    otherParticipantId ? doc(db, 'users', otherParticipantId) : null
  );

  // Filter channels based on current filter
  const filteredChannels = allChannels.filter(channel => {
    switch (channelFilter) {
      case 'unread':
        return channel.unreadCounts?.[user?.uid || ''] > 0;
      case 'pinned':
        return channel.isPinned;
      case 'archived':
        return channel.isArchived;
      default:
        return !channel.isArchived;
    }
  });

  // Effects
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (channelsSnapshot) {
      const channelsFromDb = channelsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ExtendedChannel));
      
      channelsFromDb.sort((a, b) => {
        const timeA = a.lastMessageTimestamp?.toMillis() || 0;
        const timeB = b.lastMessageTimestamp?.toMillis() || 0;
        return timeB - timeA;
      });

      setAllChannels(channelsFromDb);
    }
  }, [channelsSnapshot]);

  useEffect(() => {
    if (!activeChannelId && filteredChannels.length > 0) {
      setActiveChannelId(filteredChannels[0].id);
    }
  }, [filteredChannels, activeChannelId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messagesSnapshot]);

  // Mark messages as read when channel is opened
  useEffect(() => {
    if (activeChannelId && user && activeChannelData?.unreadCounts?.[user.uid] > 0) {
      const channelRef = doc(db, 'channels', activeChannelId);
      updateDoc(channelRef, {
        [`unreadCounts.${user.uid}`]: 0
      }).catch(err => console.error("Failed to reset unread count:", err));
    }
  }, [activeChannelId, user, activeChannelData]);
  
  const handleSearchUsers = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    try {
      const trimmedInput = searchInput.trim();
      let q;
      
      if (trimmedInput.includes('@')) {
        q = query(collection(db, "users"), where("email", "==", trimmedInput.toLowerCase()));
      } else if (/^\d{6}$/.test(trimmedInput)) {
        q = query(collection(db, "users"), where("userCode", "==", trimmedInput));
      } else {
          toast({
              variant: "destructive",
              title: "صيغة بحث غير صالحة",
              description: "يرجى إدخال بريد إلكتروني أو رقم تعريفي من 6 أرقام."
          });
          setIsSearching(false);
          return;
      }

      const querySnapshot = await getDocs(q);
      const usersFound = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(foundUser => foundUser.id !== user?.uid);

      if (usersFound.length === 0) {
        toast({ title: "لا توجد نتائج", description: "لم يتم العثور على مستخدم يطابق بحثك." });
      }
      setSearchResults(usersFound);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({ variant: 'destructive', title: 'خطأ في البحث', description: 'حدث خطأ أثناء البحث عن المستخدمين.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateChannel = async (otherUser: User) => {
    if (!user) return;
    setIsCreatingChannel(true);
  
    try {
      // Use the more flexible query to find existing direct channels
      const existingChannelQuery = query(
        collection(db, 'channels'), 
        where('type', '==', 'direct'),
        where('participants', 'array-contains', user.uid)
      );

      const querySnapshot = await getDocs(existingChannelQuery);
      const existingChannel = querySnapshot.docs.find(doc => 
        doc.data().participants.includes(otherUser.id)
      );
  
      if (existingChannel) {
        // If channel exists, just switch to it
        setActiveChannelId(existingChannel.id);
      } else {
        // If it doesn't exist, create a new one
        const newChannelRef = doc(collection(db, 'channels'));
        const newChannelData: CommunicationChannel = {
          id: newChannelRef.id,
          name: `DM with ${otherUser.name}`,
          type: 'direct',
          participants: [user.uid, otherUser.id],
          participantNames: {
              [user.uid]: user.displayName || 'Current User',
              [otherUser.id]: otherUser.name || 'Other User'
          },
          participantAvatars: {
              [user.uid]: user.photoURL || '',
              [otherUser.id]: otherUser.photoURL || ''
          },
          createdAt: serverTimestamp() as Timestamp,
          unreadCounts: { [user.uid]: 0, [otherUser.id]: 0 },
        };
  
        await setDoc(newChannelRef, newChannelData);

        // Proactively update local state to avoid race condition
        setAllChannels(prev => [newChannelData as ExtendedChannel, ...prev]);
        setActiveChannelId(newChannelRef.id);
      }
  
      setIsNewUserModalOpen(false);
      setSearchResults([]);
      setSearchInput('');
  
    } catch (error: any) {
      console.error("Error creating channel: ", error);
      let description = 'فشل إنشاء المحادثة. يرجى المحاولة مرة أخرى.';
      // This is a hint for the developer if a composite index is needed.
      if (error.code === 'failed-precondition') {
          description = 'فشل إنشاء المحادثة. قد يتطلب هذا الاستعلام فهرسًا مركبًا في Firestore. تحقق من كونسول المتصفح للحصول على رابط إنشاء الفهرس.';
      }
      toast({ variant: 'destructive', title: 'خطأ', description });
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !user || !activeChannelId || !activeChannelData) return;

    // Correctly identify the recipient
    const recipientId = activeChannelData.participants.find(p => p !== user.uid);
    if (!recipientId) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على المستلم في هذه المحادثة.' });
      return;
    }

    setIsSending(true);
    try {
      const channelRef = doc(db, 'channels', activeChannelId);
      const messagesColRef = collection(channelRef, 'messages');
      
      const batch = writeBatch(db);

      const newMessage: Partial<ExtendedMessage> = {
        content: messageContent,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderAvatarUrl: user.photoURL || '',
        timestamp: serverTimestamp(),
        type: messageType,
        isEncrypted: activeChannelData.encryptionEnabled || false,
        priority: 'normal',
        replyTo: replyToMessage,
        readBy: {},
        deliveredTo: {}
      };

      if (messageType === 'medical_report') {
        newMessage.medicalContext = { notes: messageContent };
      }

      const messageDocRef = doc(messagesColRef);
      batch.set(messageDocRef, newMessage);

      batch.update(channelRef, {
        lastMessageContent: messageContent,
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCounts.${recipientId}`]: increment(1),
        lastActivity: serverTimestamp()
      });

      await batch.commit();

      setMessageContent('');
      setReplyToMessage(null);
      setMessageType('text');
      
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

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0 || !activeChannelId || !user || !activeChannelData) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'ملف كبير جداً',
        description: 'يجب أن يكون حجم الملف أقل من 10 ميجابايت.',
      });
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    
    try {
      const channelRef = doc(db, 'channels', activeChannelId);
      const messagesColRef = collection(channelRef, 'messages');
      
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      
      const newMessage: Partial<ExtendedMessage> = {
        content: file.name,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderAvatarUrl: user.photoURL || '',
        timestamp: serverTimestamp(),
        type: messageType,
        fileUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isEncrypted: activeChannelData.encryptionEnabled || false,
        priority: 'normal'
      };

      await addDoc(messagesColRef, newMessage);
      
      toast({ title: 'تم الرفع', description: 'تم رفع الملف بنجاح' });
      
    } catch (error) {
      console.error("Error uploading file: ", error);
      toast({ variant: 'destructive', title: 'خطأ في الرفع', description: 'فشل في رفع الملف.' });
    }
  };

  const handleStartVideoCall = () => {
    if (!user || !otherParticipantId) return;
    setVideoCallState({
      isActive: true,
      participants: [user.uid, otherParticipantId],
      isMuted: false,
      isOnHold: false,
      duration: 0,
      quality: 'good',
      isVideoEnabled: true,
      isScreenSharing: false,
      layout: 'speaker',
      recordings: false
    });

    if (activeChannelId) {
      const channelRef = doc(db, 'channels', activeChannelId);
      updateDoc(channelRef, {
        activeCall: {
          type: 'video',
          participants: [user.uid, otherParticipantId],
          startTime: serverTimestamp(),
          isRecording: false
        }
      });
    }
  };

  const handleEndCall = () => {
    setVideoCallState(null);
    if (activeChannelId) {
      const channelRef = doc(db, 'channels', activeChannelId);
      updateDoc(channelRef, { activeCall: null });
    }
  };

  const handleChannelAction = async (channelId: string, action: 'archive' | 'mute' | 'pin') => {
    try {
      const channelRef = doc(db, 'channels', channelId);
      const channel = allChannels.find(c => c.id === channelId);
      if(!channel) return;

      const updates: any = {};
      let successMessage = '';

      switch (action) {
        case 'archive':
          updates.isArchived = true;
          successMessage = 'تم أرشفة المحادثة بنجاح';
          break;
        case 'mute':
          updates.isMuted = !channel.isMuted;
          successMessage = updates.isMuted ? 'تم كتم المحادثة' : 'تم إلغاء كتم المحادثة';
          break;
        case 'pin':
          updates.isPinned = !channel.isPinned;
          successMessage = updates.isPinned ? 'تم تثبيت المحادثة' : 'تم إلغاء تثبيت المحادثة';
          break;
      }

      await updateDoc(channelRef, updates);
      toast({ title: 'تم التحديث', description: successMessage });
      
    } catch (error) {
      console.error(`Error ${action}ing channel:`, error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحديث المحادثة.' });
    }
  };

  const handleReplyToMessage = (messageId: string) => {
    setReplyToMessage(messageId);
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!activeChannelId || !user) return;
    try {
      const messageRef = doc(db, 'channels', activeChannelId, 'messages', messageId);
      await updateDoc(messageRef, { [`reactions.${user.uid}`]: emoji });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleTranslateMessage = async (messageId: string, targetLang: string) => {
    toast({ title: 'جاري الترجمة', description: 'يتم ترجمة الرسالة...' });
  };

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
  };

  const renderPresenceStatus = () => {
    if (otherUserLoading || !otherUserData || activeChannelData?.type === 'bot') {
      return null;
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          otherUserData.status === 'online' ? 'bg-green-500' :
          otherUserData.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
        }`} />
        <span className="text-sm text-muted-foreground">
          {otherUserData.status === 'online' ? 'متصل الآن' :
           otherUserData.status === 'away' ? 'بعيد' : 'غير متصل'}
        </span>
      </div>
    );
  };

  if (loading) {
    return <div className="p-6"><Skeleton className="h-[70vh] w-full" /></div>;
  }
  
  if (!user) return null;

  return (
    <>
      <div className="h-[calc(100vh-10rem)] flex gap-6 animate-in fade-in-50">
        {/* Channels List */}
        <Card className="w-1/3 flex-shrink-0 flex flex-col">
          <CardHeader className="p-4 border-b space-y-4">
            <Dialog open={isNewUserModalOpen} onOpenChange={setIsNewUserModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <PlusCircle className="ml-2 h-4 w-4"/>
                  محادثة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>بدء محادثة جديدة</DialogTitle>
                  <DialogDescription>
                    ابحث عن مستخدم عن طريق البريد الإلكتروني أو الرقم التعريفي (6 أرقام).
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSearchUsers} className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="البريد الإلكتروني أو الرقم التعريفي"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      disabled={isSearching}
                    />
                    <Button type="submit" disabled={isSearching || !searchInput.trim()}>
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
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
                            {foundUser.specialization && (
                              <Badge variant="outline" className="text-xs">
                                {foundUser.specialization}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleCreateChannel(foundUser)} 
                          disabled={isCreatingChannel}
                        >
                          {isCreatingChannel ? <Loader2 className="h-4 w-4 animate-spin"/> : 'تواصل'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Tabs value={channelFilter} onValueChange={(value) => setChannelFilter(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">الكل</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">غير مقروءة</TabsTrigger>
                <TabsTrigger value="pinned" className="text-xs">مثبتة</TabsTrigger>
                <TabsTrigger value="archived" className="text-xs">مؤرشفة</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <ScrollArea className="flex-1">
            {channelsLoading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-[80px] w-full"/>)}
              </div>
            )}
            
            {!channelsLoading && filteredChannels.length === 0 && (
              <div className="p-6 text-center text-muted-foreground h-full flex flex-col justify-center items-center">
                <MessageSquare className="mx-auto h-12 w-12" />
                <p className="mt-4">لا توجد محادثات.</p>
                <p className="text-sm">ابدأ محادثة جديدة.</p>
              </div>
            )}
            
            <div className="p-2">
              {filteredChannels.map(channel => (
                <EnhancedChannelListItem 
                  key={channel.id} 
                  channel={channel}
                  isActive={activeChannelId === channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  currentUserId={user.uid}
                  onArchive={(id) => handleChannelAction(id, 'archive')}
                  onMute={(id) => handleChannelAction(id, 'mute')}
                  onPin={(id) => handleChannelAction(id, 'pin')}
                />
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Active Chat Window */}
        <Card className="flex-1 flex flex-col">
          {activeChannelData ? (
            <>
              {/* Chat Header */}
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getActiveChannelAvatar()} alt={getActiveChannelName()} />
                    <AvatarFallback>{getActiveChannelName().substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getActiveChannelName()}
                      {activeChannelData.encryptionEnabled && (
                        <Lock className="h-4 w-4 text-green-600" />
                      )}
                    </CardTitle>
                    {renderPresenceStatus()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleStartVideoCall}>
                    <Video className="h-5 w-5"/>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5"/>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowAlertsPanel(!showAlertsPanel)}
                  >
                    <Bell className="h-5 w-5"/>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Info className="h-4 w-4 mr-2" />
                        معلومات المحادثة
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Search className="h-4 w-4 mr-2" />
                        البحث في الرسائل
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        إعدادات المحادثة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6 bg-secondary/30" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messagesLoading && (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {messagesError && (
                    <div className="text-center py-10">
                      <p className="text-destructive">خطأ في تحميل الرسائل</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        إعادة المحاولة
                      </Button>
                    </div>
                  )}
                  
                  {messagesSnapshot?.docs.map(doc => {
                    const message = { id: doc.id, ...doc.data() } as ExtendedMessage;
                    return (
                      <EnhancedMessageBubble 
                        key={message.id} 
                        message={message} 
                        isOwnMessage={message.senderId === user.uid}
                        onReply={handleReplyToMessage}
                        onReact={handleReactToMessage}
                        onTranslate={handleTranslateMessage}
                        showMedicalContext={true}
                      />
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Reply Context */}
              {replyToMessage && (
                <div className="p-3 bg-secondary/50 border-t border-b flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Reply className="h-4 w-4" />
                    <span>الرد على رسالة</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setReplyToMessage(null)}>
                    <UserX className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t bg-card space-y-3">
                {/* Message Type Selector */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={messageType === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageType('text')}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    رسالة عادية
                  </Button>
                  <Button
                    type="button"
                    variant={messageType === 'medical_report' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageType('medical_report')}
                  >
                    <Stethoscope className="h-4 w-4 mr-1" />
                    تقرير طبي
                  </Button>
                </div>

                <form className="relative" onSubmit={handleSendMessage}>
                  {messageType === 'medical_report' ? (
                    <Textarea 
                      placeholder="اكتب التقرير الطبي هنا..."
                      className="pr-24 min-h-[80px]"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      disabled={isSending || messagesLoading}
                    />
                  ) : (
                    <Input 
                      placeholder="اكتب رسالتك هنا..." 
                      className="pr-32" 
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      disabled={isSending || messagesLoading}
                    />
                  )}
                  
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      type="button"
                      className="h-8 w-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-8 w-8"
                      onClick={() => setIsRecordingVoice(!isRecordingVoice)}
                    >
                      <Mic className={`h-4 w-4 ${isRecordingVoice ? 'text-red-500' : ''}`} />
                    </Button>
                    
                    <Button 
                      size="icon" 
                      className="w-10 h-8" 
                      type="submit" 
                      disabled={isSending || !messageContent.trim()}
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin"/> 
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
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

        {/* Smart Alerts Panel */}
        {showAlertsPanel && <SmartAlertsPanel />}
      </div>

      {/* Video Call Interface */}
      {videoCallState && (
        <VideoCallInterface
          callState={videoCallState}
          onEndCall={handleEndCall}
          onToggleMute={() => setVideoCallState(prev => prev ? {...prev, isMuted: !prev.isMuted} : null)}
          onToggleVideo={() => setVideoCallState(prev => prev ? {...prev, isVideoEnabled: !prev.isVideoEnabled} : null)}
          onToggleScreenShare={() => setVideoCallState(prev => prev ? {...prev, isScreenSharing: !prev.isScreenSharing} : null)}
        />
      )}
    </>
  );
}
