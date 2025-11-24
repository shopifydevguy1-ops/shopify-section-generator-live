'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, Search } from 'lucide-react';
import { Modal } from '@/components/modal';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'sections' | 'logs'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        setUsers(data.users || []);
      } else if (activeTab === 'sections') {
        const res = await fetch('/api/admin/sections');
        const data = await res.json();
        setSections(data.sections || []);
      } else if (activeTab === 'logs') {
        const res = await fetch('/api/admin/logs');
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      userId: editingUser.id,
      subscriptionPlan: formData.get('subscriptionPlan'),
      sectionUsageCount: parseInt(formData.get('sectionUsageCount') as string),
    };

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowUserModal(false);
        setEditingUser(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      tags: (formData.get('tags') as string)?.split(',').map((t) => t.trim()),
      baseTemplate: formData.get('baseTemplate'),
    };

    try {
      const url = editingSection
        ? `/api/admin/sections/${editingSection.id}`
        : '/api/admin/sections';
      const method = editingSection ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowSectionModal(false);
        setEditingSection(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving section:', err);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const res = await fetch(`/api/admin/sections/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting section:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users, sections, and view logs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'sections', label: 'Sections', icon: BookOpen },
          { id: 'logs', label: 'Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Users ({users.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Plan
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Usage
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Role
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="p-3 text-sm text-gray-900 dark:text-white">
                          {user.email}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {user.subscriptionPlan}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {user.sectionUsageCount}
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {user.role}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Sections ({sections.length})
                </h2>
                <button
                  onClick={() => {
                    setEditingSection(null);
                    setShowSectionModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Add Section
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {section.description}
                    </p>
                    <div className="flex gap-2 mb-3">
                      {section.tags?.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingSection(section);
                          setShowSectionModal(true);
                        }}
                        className="flex-1 px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="flex-1 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Generation Logs ({logs.length})
              </h2>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {log.user.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {log.section?.title || 'Custom Section'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {log.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Edit Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
        }}
        title="Edit User"
      >
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={editingUser.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subscription Plan
              </label>
              <select
                name="subscriptionPlan"
                defaultValue={editingUser.subscriptionPlan}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usage Count
              </label>
              <input
                type="number"
                name="sectionUsageCount"
                defaultValue={editingUser.sectionUsageCount}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Save Changes
            </button>
          </form>
        )}
      </Modal>

      {/* Section Edit Modal */}
      <Modal
        isOpen={showSectionModal}
        onClose={() => {
          setShowSectionModal(false);
          setEditingSection(null);
        }}
        title={editingSection ? 'Edit Section' : 'Add Section'}
        size="lg"
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              defaultValue={editingSection?.title}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={editingSection?.description}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              defaultValue={editingSection?.tags?.join(', ')}
              required
              placeholder="free, hero, banner"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base Template
            </label>
            <textarea
              name="baseTemplate"
              defaultValue={editingSection?.baseTemplate}
              required
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            {editingSection ? 'Update Section' : 'Create Section'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

