export type LeadStatus = 'red' | 'orange' | 'yellow' | 'green';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  userId: string;
}

export interface Lead {
  id: string;
  projectId: string;
  userId: string;
  company: string;
  contactName: string;
  role: string;
  email: string;
  website: string;
  reasoning: string;
  status: LeadStatus;
  
  companySize: string;
  productCategory: string;
  previousSponsorships: string;
  
  recentCampaigns: string;
  recentLaunches: string;
  csrAlignment: string;
  
  notes?: string;
  draftEmail?: string;
  
  createdAt?: number;
  statusUpdatedAt?: number;
}

export interface FilterView {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  filters: {
    companySize: string;
    productCategory: string;
    previousSponsorships: string;
  };
}
