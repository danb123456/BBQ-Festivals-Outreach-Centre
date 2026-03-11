import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, setDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { Project, Lead, FilterView } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirestore() {
  const { user } = useFirebase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filterViews, setFilterViews] = useState<FilterView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLeads([]);
      setFilterViews([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const qProjects = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));

    const qLeads = query(collection(db, 'leads'), where('userId', '==', user.uid));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leads'));

    const qFilterViews = query(collection(db, 'filterViews'), where('userId', '==', user.uid));
    const unsubFilterViews = onSnapshot(qFilterViews, (snapshot) => {
      setFilterViews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FilterView)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'filterViews'));

    return () => {
      unsubProjects();
      unsubLeads();
      unsubFilterViews();
    };
  }, [user]);

  const addProject = async (project: Omit<Project, 'id' | 'userId'>) => {
    if (!user) return;
    const newId = crypto.randomUUID();
    try {
      await setDoc(doc(db, 'projects', newId), {
        ...project,
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${newId}`);
    }
  };

  const addLead = async (lead: Omit<Lead, 'id' | 'userId'>) => {
    if (!user) return;
    const newId = crypto.randomUUID();
    const now = Date.now();
    try {
      const leadData: any = {
        projectId: String(lead.projectId || ''),
        company: String(lead.company || '').substring(0, 200),
        contactName: String(lead.contactName || '').substring(0, 200),
        role: String(lead.role || '').substring(0, 200),
        email: String(lead.email || '').substring(0, 200),
        website: String(lead.website || '').substring(0, 500),
        reasoning: String(lead.reasoning || '').substring(0, 2000),
        status: lead.status || 'red',
        companySize: String(lead.companySize || '').substring(0, 200),
        productCategory: String(lead.productCategory || '').substring(0, 200),
        previousSponsorships: String(lead.previousSponsorships || '').substring(0, 2000),
        recentCampaigns: String(lead.recentCampaigns || '').substring(0, 2000),
        recentLaunches: String(lead.recentLaunches || '').substring(0, 2000),
        csrAlignment: String(lead.csrAlignment || '').substring(0, 2000),
        userId: user.uid,
        createdAt: now,
        statusUpdatedAt: now
      };
      
      if (lead.notes) leadData.notes = String(lead.notes).substring(0, 5000);
      if (lead.draftEmail) leadData.draftEmail = String(lead.draftEmail).substring(0, 5000);

      await setDoc(doc(db, 'leads', newId), leadData);
      
      // Add public claim
      await setDoc(doc(db, 'leadClaims', newId), {
        companyLower: leadData.company.toLowerCase(),
        companyName: leadData.company,
        status: leadData.status,
        ownerName: user.displayName || user.email || 'Unknown User',
        ownerId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `leads/${newId}`);
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!user) return;
    try {
      const finalUpdates: any = { ...updates };
      if (updates.status) {
        finalUpdates.statusUpdatedAt = Date.now();
      }
      
      // Truncate strings to match Firestore rules
      if (finalUpdates.company) finalUpdates.company = String(finalUpdates.company).substring(0, 200);
      if (finalUpdates.contactName) finalUpdates.contactName = String(finalUpdates.contactName).substring(0, 200);
      if (finalUpdates.role) finalUpdates.role = String(finalUpdates.role).substring(0, 200);
      if (finalUpdates.email) finalUpdates.email = String(finalUpdates.email).substring(0, 200);
      if (finalUpdates.website) finalUpdates.website = String(finalUpdates.website).substring(0, 500);
      if (finalUpdates.reasoning) finalUpdates.reasoning = String(finalUpdates.reasoning).substring(0, 2000);
      if (finalUpdates.companySize) finalUpdates.companySize = String(finalUpdates.companySize).substring(0, 200);
      if (finalUpdates.productCategory) finalUpdates.productCategory = String(finalUpdates.productCategory).substring(0, 200);
      if (finalUpdates.previousSponsorships) finalUpdates.previousSponsorships = String(finalUpdates.previousSponsorships).substring(0, 2000);
      if (finalUpdates.recentCampaigns) finalUpdates.recentCampaigns = String(finalUpdates.recentCampaigns).substring(0, 2000);
      if (finalUpdates.recentLaunches) finalUpdates.recentLaunches = String(finalUpdates.recentLaunches).substring(0, 2000);
      if (finalUpdates.csrAlignment) finalUpdates.csrAlignment = String(finalUpdates.csrAlignment).substring(0, 2000);
      if (finalUpdates.notes) finalUpdates.notes = String(finalUpdates.notes).substring(0, 5000);
      if (finalUpdates.draftEmail) finalUpdates.draftEmail = String(finalUpdates.draftEmail).substring(0, 5000);

      await updateDoc(doc(db, 'leads', id), finalUpdates);
      
      // Update public claim if status or company changed
      if (updates.status || updates.company) {
        const claimUpdates: any = {};
        if (updates.status) claimUpdates.status = updates.status;
        if (updates.company) {
          claimUpdates.companyName = finalUpdates.company;
          claimUpdates.companyLower = finalUpdates.company.toLowerCase();
        }
        await updateDoc(doc(db, 'leadClaims', id), claimUpdates).catch(() => {
          // If the claim doesn't exist for some reason, we could recreate it, 
          // but for now we just catch the error to not break the main update.
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const addFilterView = async (filterView: Omit<FilterView, 'id' | 'userId'>) => {
    if (!user) return;
    const newId = crypto.randomUUID();
    try {
      await setDoc(doc(db, 'filterViews', newId), {
        ...filterView,
        userId: user.uid
      });
      return newId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `filterViews/${newId}`);
    }
  };

  const deleteFilterView = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'filterViews', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `filterViews/${id}`);
    }
  };

  return {
    projects,
    leads,
    filterViews,
    loading,
    addProject,
    addLead,
    updateLead,
    addFilterView,
    deleteFilterView
  };
}
