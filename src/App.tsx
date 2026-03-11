import React, { useState } from 'react';
import { LayoutDashboard, Zap, ArrowLeft, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LeadGenerator from './components/LeadGenerator';
import Pipeline from './components/Pipeline';
import LeadDetails from './components/LeadDetails';
import { Lead, FilterView, Project } from './types';
import { useFirebase } from './components/FirebaseProvider';
import { useFirestore } from './hooks/useFirestore';

export default function App() {
  const { user, signIn, logOut } = useFirebase();
  const { 
    projects, leads, filterViews, loading, 
    addProject, addLead, updateLead, addFilterView, deleteFilterView 
  } = useFirestore();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generator' | 'pipeline'>('pipeline');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Outreach OS</h1>
          <p className="text-gray-600 mb-8">Sign in to manage your festival outreach campaigns and never lose a lead.</p>
          <button
            onClick={signIn}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleCreateProject = (name: string, description: string) => {
    addProject({
      name,
      description,
      createdAt: Date.now()
    });
  };

  const handleAddLead = (leadData: Omit<Lead, 'id' | 'status' | 'projectId' | 'userId'>) => {
    if (!activeProjectId) return;
    addLead({
      ...leadData,
      projectId: activeProjectId,
      status: 'red',
    });
  };

  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    updateLead(id, updates);
  };

  if (!activeProjectId) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <div className="absolute top-4 right-4">
          <button
            onClick={logOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        <Dashboard 
          projects={projects} 
          onCreateProject={handleCreateProject} 
          onSelectProject={(id) => {
            setActiveProjectId(id);
            setActiveTab('pipeline');
          }} 
        />
      </div>
    );
  }

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectLeads = leads.filter(l => l.projectId === activeProjectId);
  const projectFilterViews = filterViews.filter(v => v.projectId === activeProjectId);
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <button 
            onClick={() => setActiveProjectId(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight truncate">
            {activeProject?.name || 'Project'}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider truncate">
            {activeProject?.description || 'Outreach OS'}
          </p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'pipeline' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'generator' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Zap className="w-5 h-5" />
            Lead Generator
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
              {user.displayName?.charAt(0) || 'U'}
            </div>
            <div className="text-sm flex-1 overflow-hidden">
              <p className="font-medium text-gray-900 truncate">{user.displayName || 'User'}</p>
              <p className="text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        {activeTab === 'generator' ? (
          <LeadGenerator 
            projectName={activeProject?.name || 'Savour Festival'} 
            projectDescription={activeProject?.description || ''}
            user={user}
            onAddLead={handleAddLead} 
          />
        ) : (
          <Pipeline 
            leads={projectLeads} 
            onSelectLead={(l) => setSelectedLeadId(l.id)} 
            filterViews={projectFilterViews}
            onSaveFilterView={(view) => addFilterView({ ...view, projectId: activeProjectId })}
            onDeleteFilterView={deleteFilterView}
          />
        )}
      </main>

      {/* Slide-over Panel */}
      {selectedLead && (
        <LeadDetails 
          lead={selectedLead} 
          projectName={activeProject?.name || 'Savour Festival'}
          projectDescription={activeProject?.description || ''}
          user={user}
          onClose={() => setSelectedLeadId(null)} 
          onUpdate={handleUpdateLead}
        />
      )}
    </div>
  );
}
