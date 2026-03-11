import React, { useState } from 'react';
import { Project } from '../types';
import { Plus, Folder, Calendar, ArrowRight, Tent } from 'lucide-react';

export default function Dashboard({
  projects,
  onCreateProject,
  onSelectProject
}: {
  projects: Project[];
  onCreateProject: (name: string, description: string) => void;
  onSelectProject: (id: string) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateProject(newName, newDesc);
    setNewName('');
    setNewDesc('');
    setIsCreating(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Projects Dashboard</h1>
          <p className="text-gray-600">Manage your festival outreach campaigns.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {isCreating && (
        <div className="mb-10 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Project</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name (e.g., FUME 2026)</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter project name..."
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Brief description of the festival or campaign..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group flex flex-col h-full"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Tent className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-gray-500 text-sm mb-6 flex-1">
              {project.description || 'No description provided.'}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-sm">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
              <span className="text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                Open Project <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
        
        {projects.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-900 mb-1">No projects yet</p>
            <p>Create your first project to start generating leads.</p>
          </div>
        )}
      </div>
    </div>
  );
}
