export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Status = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export type Category = 'technical' | 'billing' | 'account' | 'feature' | 'general';

export type CustomerTier = 'free' | 'pro' | 'enterprise';

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  tier: CustomerTier;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

export interface Message {
  id: string;
  senderType: 'customer' | 'agent' | 'system';
  authorName: string;
  authorRole?: string;
  content: string;
  timestamp: string;
  isInternalNote?: boolean;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: Status;
  priority: Priority;
  category: Category;
  requester: Customer;
  assignee?: Agent;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  messages: Message[];
  slaDueHours: number;
}

export interface CannedResponse {
  id: string;
  title: string;
  shortcut: string;
  category: string;
  content: string;
}
