import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, FilterView } from '../types';
import { Mail, User, Filter, Save, X, ChevronDown, AlertCircle } from 'lucide-react';

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

export default function Pipeline({ 
  leads, 
  onSelectLead,
  filterViews,
  onSaveFilterView,
  onDeleteFilterView
}: { 
  leads: Lead[], 
  onSelectLead: (lead: Lead) => void,
  filterViews: FilterView[],
  onSaveFilterView: (view: Omit<FilterView, 'id' | 'projectId' | 'userId'>) => Promise<string | undefined>,
  onDeleteFilterView: (id: string) => void
}) {
  const [activeFilters, setActiveFilters] = useState({
    companySize: '',
    productCategory: '',
    previousSponsorships: ''
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isSavingView, setIsSavingView] = useState(false);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  // Extract unique values for filter dropdowns
  const companySizes = useMemo(() => Array.from(new Set(leads.map(l => l.companySize).filter(Boolean))), [leads]);
  const productCategories = useMemo(() => Array.from(new Set(leads.map(l => l.productCategory).filter(Boolean))), [leads]);
  
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (activeFilters.companySize && lead.companySize !== activeFilters.companySize) return false;
      if (activeFilters.productCategory && lead.productCategory !== activeFilters.productCategory) return false;
      if (activeFilters.previousSponsorships && !lead.previousSponsorships?.toLowerCase().includes(activeFilters.previousSponsorships.toLowerCase())) return false;
      return true;
    });
  }, [leads, activeFilters]);

  const handleSaveView = async () => {
    if (!newViewName) return;
    const newView: Omit<FilterView, 'id' | 'projectId' | 'userId'> = {
      name: newViewName,
      filters: { ...activeFilters }
    };
    const newId = await onSaveFilterView(newView);
    setNewViewName('');
    setIsSavingView(false);
    if (newId) {
      setActiveViewId(newId);
    }
  };

  const applyView = (view: FilterView) => {
    setActiveFilters(view.filters);
    setActiveViewId(view.id);
  };

  const clearFilters = () => {
    setActiveFilters({ companySize: '', productCategory: '', previousSponsorships: '' });
    setActiveViewId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Outreach Pipeline</h2>
          <p className="text-gray-600">Manage your leads and track outreach status.</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              Object.values(activeFilters).some(v => v) || activeViewId
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(Object.values(activeFilters).some(v => v)) && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 ml-1" />
            )}
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Filter Leads</h3>
                <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-900">Clear all</button>
              </div>

              {/* Saved Views */}
              {filterViews.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Saved Views</label>
                  <div className="flex flex-wrap gap-2">
                    {filterViews.map(view => (
                      <div key={view.id} className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                        <button
                          onClick={() => applyView(view)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors ${
                            activeViewId === view.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {view.name}
                        </button>
                        <button 
                          onClick={() => onDeleteFilterView(view.id)}
                          className="px-2 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-r-lg transition-colors border-l border-gray-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                  <select 
                    value={activeFilters.companySize}
                    onChange={e => { setActiveFilters(prev => ({ ...prev, companySize: e.target.value })); setActiveViewId(null); }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="">All Sizes</option>
                    {companySizes.map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
                  <select 
                    value={activeFilters.productCategory}
                    onChange={e => { setActiveFilters(prev => ({ ...prev, productCategory: e.target.value })); setActiveViewId(null); }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="">All Categories</option>
                    {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Sponsorships</label>
                  <input 
                    type="text"
                    placeholder="Search events..."
                    value={activeFilters.previousSponsorships}
                    onChange={e => { setActiveFilters(prev => ({ ...prev, previousSponsorships: e.target.value })); setActiveViewId(null); }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>

                {!activeViewId && Object.values(activeFilters).some(v => v) && (
                  <div className="pt-4 border-t border-gray-100">
                    {isSavingView ? (
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="View name..."
                          value={newViewName}
                          onChange={e => setNewViewName(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-500"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleSaveView()}
                        />
                        <button 
                          onClick={handleSaveView}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsSavingView(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border border-gray-200"
                      >
                        <Save className="w-4 h-4" />
                        Save as View
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {(['red', 'orange', 'yellow', 'green'] as LeadStatus[]).map(status => (
          <div key={status} className="flex flex-col bg-gray-50 rounded-2xl p-4 h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`} />
              <h3 className="font-semibold text-gray-700">{STATUS_LABELS[status]}</h3>
              <span className="ml-auto bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full font-medium">
                {filteredLeads.filter(l => l.status === status).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredLeads.filter(l => l.status === status).map(lead => {
                const isNeglected = (lead.status === 'red' || lead.status === 'orange') && 
                  (Date.now() - (lead.statusUpdatedAt || lead.createdAt || Date.now()) > 7 * 24 * 60 * 60 * 1000);
                
                return (
                <div 
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md cursor-pointer transition-all group ${
                    isNeglected ? 'border-red-300 hover:border-red-400' : 'border-gray-100 hover:border-indigo-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{lead.company}</h4>
                    {isNeglected && (
                      <div className="flex items-center text-red-500" title="Neglected: No status change in 7+ days">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {lead.productCategory && (
                      <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                        {lead.productCategory}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{lead.contactName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  </div>
                </div>
              )})}
              {filteredLeads.filter(l => l.status === status).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                  No leads match filters
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
