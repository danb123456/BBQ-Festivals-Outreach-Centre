import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { draftEmail, draftEmailStream } from '../lib/gemini';
import { X, Mail, Building2, User, Briefcase, Globe, MessageSquare, Loader2, Save, Send, Target, Megaphone, Leaf, History, Zap, AlertTriangle, Sparkles } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_COLORS: Record<LeadStatus, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500'
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  red: 'Not Reached Out',
  orange: 'Emailed',
  yellow: 'In Talks',
  green: 'Sale Landed'
};

export default function LeadDetails({ 
  lead, 
  projectName,
  projectDescription,
  user,
  onClose, 
  onUpdate 
}: { 
  lead: Lead, 
  projectName: string,
  projectDescription: string,
  user: any,
  onClose: () => void,
  onUpdate: (id: string, updates: Partial<Lead>) => void
}) {
  const [isDrafting, setIsDrafting] = useState(false);
  const [emailContent, setEmailContent] = useState(lead.draftEmail || '');
  const [otherClaim, setOtherClaim] = useState<any>(null);

  useEffect(() => {
    const checkClaims = async () => {
      try {
        const claimsQuery = query(
          collection(db, 'leadClaims'),
          where('companyLower', '==', lead.company.toLowerCase())
        );
        const snapshot = await getDocs(claimsQuery);
        let foundClaim = null;
        snapshot.forEach(doc => {
          const data = doc.data();
          // If another user has claimed this lead
          if (data.ownerId !== user.uid) {
            foundClaim = data;
          }
        });
        setOtherClaim(foundClaim);
      } catch (err) {
        console.error("Failed to check claims", err);
      }
    };
    checkClaims();
  }, [lead.company, user.uid]);

  const handleDraftEmail = async () => {
    setIsDrafting(true);
    setEmailContent(''); // Clear existing content to show progress
    let fullDraft = '';
    
    try {
      const stream = draftEmailStream(lead, projectName, projectDescription, user);
      
      for await (const chunk of stream) {
        fullDraft += chunk;
        setEmailContent(fullDraft);
      }
      
      onUpdate(lead.id, { draftEmail: fullDraft });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to draft email');
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[lead.status]}`} />
            <h2 className="text-xl font-bold text-gray-900">{lead.company}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {otherClaim && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 text-yellow-800">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Warning: Duplicate Outreach</p>
                <p className="text-sm mt-1">
                  <strong>{otherClaim.ownerName}</strong> already has this company in their pipeline with status: <strong>{STATUS_LABELS[otherClaim.status as LeadStatus] || otherClaim.status}</strong>.
                </p>
              </div>
            </div>
          )}

          {(lead.status === 'red' || lead.status === 'orange') && (Date.now() - (lead.statusUpdatedAt || lead.createdAt || Date.now()) > 7 * 24 * 60 * 60 * 1000) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Follow-up Required</p>
                <p className="text-sm mt-1">
                  This lead has been in <strong>{STATUS_LABELS[lead.status]}</strong> status for over a week. It's time to follow up or move them to "In Talks".
                </p>
              </div>
            </div>
          )}

          {/* Status Changer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Status</label>
            <div className="flex gap-2">
              {(Object.keys(STATUS_COLORS) as LeadStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => onUpdate(lead.id, { status })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    lead.status === status 
                      ? `border-gray-900 bg-gray-900 text-white` 
                      : `border-gray-200 text-gray-600 hover:bg-gray-50`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
                    {STATUS_LABELS[status]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lead Info */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</label>
                <div className="flex items-center gap-2 mt-1 text-gray-900">
                  <User className="w-4 h-4 text-gray-400" />
                  {lead.contactName}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                <div className="flex items-center gap-2 mt-1 text-gray-900">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  {lead.role}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                <div className="flex items-center gap-2 mt-1 text-gray-900">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${lead.email}`} className="hover:text-indigo-600">{lead.email}</a>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</label>
                <div className="flex items-center gap-2 mt-1 text-gray-900">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={lead.website} target="_blank" rel="noreferrer" className="hover:text-indigo-600">{lead.website}</a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Size</label>
                <div className="flex items-center gap-2 mt-1 text-gray-900">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {lead.companySize || 'Unknown'}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Category</label>
                <div className="flex items-center gap-2 mt-1 text-gray-900">
                  <Target className="w-4 h-4 text-gray-400" />
                  {lead.productCategory || 'Unknown'}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reasoning for Outreach</label>
                <div className="flex items-start gap-2 mt-2 text-gray-700">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm">{lead.reasoning}</p>
                </div>
              </div>

              {lead.previousSponsorships && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Previous Sponsorships</label>
                  <div className="flex items-start gap-2 mt-2 text-gray-700">
                    <History className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm">{lead.previousSponsorships}</p>
                  </div>
                </div>
              )}

              {lead.recentCampaigns && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Campaigns & Social</label>
                  <div className="flex items-start gap-2 mt-2 text-gray-700">
                    <Megaphone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm">{lead.recentCampaigns}</p>
                  </div>
                </div>
              )}

              {lead.recentLaunches && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Launches</label>
                  <div className="flex items-start gap-2 mt-2 text-gray-700">
                    <Zap className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm">{lead.recentLaunches}</p>
                  </div>
                </div>
              )}

              {lead.csrAlignment && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CSR Alignment</label>
                  <div className="flex items-start gap-2 mt-2 text-gray-700">
                    <Leaf className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm">{lead.csrAlignment}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Email Drafter */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Outreach Email</h3>
              <button
                onClick={handleDraftEmail}
                disabled={isDrafting}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {emailContent ? 'Regenerate Draft' : 'Draft with AI'}
              </button>
            </div>
            
            {emailContent ? (
              <div className="space-y-4">
                <textarea
                  value={emailContent}
                  onChange={(e) => {
                    setEmailContent(e.target.value);
                    onUpdate(lead.id, { draftEmail: e.target.value });
                  }}
                  className="w-full h-64 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-gray-700 leading-relaxed"
                />
                <div className="flex justify-end gap-3">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}&su=${encodeURIComponent(`Invitation: ${lead.company} x ${projectName}`)}&body=${encodeURIComponent(emailContent)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      if (lead.status === 'red') {
                        onUpdate(lead.id, { status: 'orange' });
                      }
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Open in Gmail
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-64 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 space-y-2">
                <Mail className="w-8 h-8 mb-2 opacity-50" />
                <p>No email drafted yet.</p>
                <p className="text-sm">Click "Draft with AI" to generate a personalized message.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
