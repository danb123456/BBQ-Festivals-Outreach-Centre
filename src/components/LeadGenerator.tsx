import React, { useState } from 'react';
import { Loader2, Plus, Building2, User, Briefcase, Globe, MessageSquare, Search, Mail, AlertTriangle } from 'lucide-react';
import { generateLeads } from '../lib/gemini';
import { Lead } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function LeadGenerator({ 
  projectName, 
  projectDescription,
  user,
  onAddLead 
}: { 
  projectName: string;
  projectDescription: string;
  user: FirebaseUser;
  onAddLead: (lead: Omit<Lead, 'id' | 'status' | 'projectId' | 'userId'>) => void 
}) {
  const [niche, setNiche] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLeads, setGeneratedLeads] = useState<any[]>([]);
  const [leadClaims, setLeadClaims] = useState<Record<string, any>>({});
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!niche) return;
    setIsGenerating(true);
    setError('');
    setLeadClaims({});
    try {
      const leads = await generateLeads(niche, projectName, projectDescription, user);
      setGeneratedLeads(leads);
      
      // Check for existing claims
      const companyNames = leads.map((l: any) => l.company.toLowerCase());
      if (companyNames.length > 0) {
        const claimsQuery = query(
          collection(db, 'leadClaims'),
          where('companyLower', 'in', companyNames)
        );
        const claimsSnapshot = await getDocs(claimsQuery);
        const claimsMap: Record<string, any> = {};
        claimsSnapshot.forEach(doc => {
          const data = doc.data();
          claimsMap[data.companyLower] = data;
        });
        setLeadClaims(claimsMap);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to generate leads');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Lead Generator</h2>
        <p className="text-gray-600">Find fresh, industry-relevant sponsors and exhibitors for {projectName}.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g., Artisan Hot Sauce, Vegan Snacks, Craft Beer..."
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !niche}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Generate Leads
        </button>
      </div>

      {error && (
        <div className="p-4 mb-8 bg-red-50 text-red-600 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {generatedLeads.map((lead, idx) => {
          const claim = leadClaims[lead.company.toLowerCase()];
          return (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            {claim && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 text-yellow-800 text-sm">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Already in Pipeline</p>
                  <p>
                    {claim.ownerName} has this company in <strong>{claim.status}</strong> status.
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  {lead.company}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    {lead.productCategory || 'Unknown Category'}
                  </span>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {lead.companySize || 'Unknown Size'}
                  </span>
                </div>
                <a href={lead.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-2">
                  <Globe className="w-4 h-4" /> {lead.website}
                </a>
              </div>
              <button
                onClick={() => {
                  onAddLead(lead);
                  setGeneratedLeads(leads => leads.filter((_, i) => i !== idx));
                }}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Add to Pipeline"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{lead.contactName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span>{lead.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${lead.email}`} className="hover:text-indigo-600">{lead.email}</a>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-gray-50 mt-4">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="italic text-gray-500">{lead.reasoning}</p>
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
