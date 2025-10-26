'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, Calendar, Building, BarChart3, FileText, Settings, 
  Activity, Download, Upload, Clock, Bell, RotateCcw, ToggleLeft,
  Menu, X, ChevronDown, ChevronRight, Home, FileSpreadsheet
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import ShiftCodesManagement from '@/components/admin/ShiftCodesManagement';
import SchedulesManagement from '@/components/admin/SchedulesManagement';
import BidPeriodsManagement from '@/components/admin/BidPeriodsManagement';
import ScheduleManagement from '@/components/admin/ScheduleManagement';
import UserManagement from '@/components/admin/UserManagement';
import OperationsManagement from '@/components/admin/OperationsManagement';
import NotificationsSettings from '@/components/admin/NotificationsSettings';
import ActivityDataManagement from '@/components/admin/ActivityDataManagement';
import { UserDataManagement } from '@/components/admin/UserDataManagement';
import MetricSettingsManagement from '@/components/admin/MetricSettingsManagement';
import BulkPDFManagement from '@/components/admin/BulkPDFManagement';

interface AdminDashboardProps {
  locale: string;
  translations: any;
  session: any;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  badge?: string;
  superAdminOnly?: boolean;
}

export default function AdminDashboardV2({ locale, translations, session }: AdminDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const { t } = useTranslation(locale);

  // Get active tab from URL params, default to 'overview'
  const activeTab = searchParams.get('section') || 'overview';

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  // Organize navigation into sections
  const navSections: NavSection[] = [
    {
      title: t('admin.coreManagement'),
      items: [
        { id: 'overview', name: t('admin.dashboardOverview'), icon: Home },
        { id: 'users', name: t('admin.usersPermissions'), icon: Users },
        { id: 'operations', name: t('admin.operations'), icon: Building },
        { id: 'bidPeriods', name: t('admin.bidPeriods'), icon: Calendar },
      ]
    },
    {
      title: t('admin.scheduling'),
      items: [
        { id: 'shiftCodes', name: t('admin.shiftCodes'), icon: Clock },
        { id: 'uploadSchedules', name: t('admin.uploadSchedules'), icon: Upload },
        { id: 'manageSchedules', name: t('admin.manageSchedules'), icon: FileSpreadsheet },
      ]
    },
    {
      title: t('admin.configuration'),
      items: [
        { id: 'metrics', name: t('admin.metricSettings'), icon: ToggleLeft },
        { id: 'notifications', name: t('admin.notifications'), icon: Bell, superAdminOnly: true },
      ]
    },
    {
      title: t('admin.dataManagement'),
      items: [
        { id: 'bulkPDF', name: t('admin.bulkPDFGeneration'), icon: FileText },
        { id: 'userData', name: t('admin.userDataExport'), icon: Download, superAdminOnly: true },
        { id: 'activityData', name: t('admin.activityLogs'), icon: RotateCcw, superAdminOnly: true },
      ]
    }
  ];

  // Filter sections based on user role
  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      !item.superAdminOnly || session?.user?.role === 'SUPER_ADMIN'
    )
  })).filter(section => section.items.length > 0);

  // Auto-expand the section containing the active tab on initial load only
  useEffect(() => {
    if (!initializedRef.current) {
      const findSectionForTab = (tabId: string) => {
        for (const section of filteredSections) {
          if (section.items.some(item => item.id === tabId)) {
            return section.title;
          }
        }
        return t('admin.coreManagement'); // default to core management
      };
      
      setExpandedSection(findSectionForTab(activeTab));
      initializedRef.current = true;
    }
  }, [activeTab, filteredSections, t]);

  const handleTabChange = (tabId: string) => {
    // Update URL with new section
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('section', tabId);
    router.push(`/${locale}/admin?${newSearchParams.toString()}`);
    setSidebarOpen(false); // Close mobile sidebar when selecting
  };

  return (
    <>
      <Header
        locale={locale}
        translations={{
          appTitle: translations.appTitle,
          navHome: translations.navHome,
          navBidLines: translations.navBidLines,
          navAdmin: translations.navAdmin,
          navLogin: translations.navLogin,
          navLogout: translations.navLogout,
        }}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:block
          `}>
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('admin.panel')}
                  </h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {session.user.name} • {
                    session.user.role === 'SUPER_ADMIN' ? t('roles.superAdmin') :
                    session.user.role === 'SUPERVISOR' ? t('roles.supervisor') : t('roles.officer')
                  }
                </p>
              </div>

              {/* Sidebar Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                {filteredSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    {/* Section Header */}
                    <button
                      onClick={() => setExpandedSection(
                        expandedSection === section.title ? null : section.title
                      )}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                    >
                      <span>{section.title}</span>
                      {expandedSection === section.title ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {/* Section Items */}
                    {expandedSection === section.title && (
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleTabChange(item.id)}
                              className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-md
                                text-sm font-medium transition-all duration-200
                                ${isActive
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }
                              `}
                            >
                              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                              <span>{item.name}</span>
                              {item.badge && (
                                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Activity className="h-4 w-4" />
                  <span>{t('admin.systemStatus')}: </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{t('admin.online')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Mobile Header */}
            <div className="lg:hidden px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <Menu className="h-6 w-6" />
                <span className="font-medium">{t('admin.menu')}</span>
              </button>
            </div>

            {/* Page Content */}
            <div className="flex-1 p-6 lg:p-8">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'overview' && t('admin.dashboardOverview')}
                  {activeTab === 'users' && t('admin.userManagement')}
                  {activeTab === 'operations' && t('admin.operationsManagement')}
                  {activeTab === 'bidPeriods' && t('admin.bidPeriodManagement')}
                  {activeTab === 'shiftCodes' && t('admin.shiftCodeManagement')}
                  {activeTab === 'uploadSchedules' && t('admin.uploadSchedules')}
                  {activeTab === 'manageSchedules' && t('admin.manageSchedules')}
                  {activeTab === 'metrics' && t('admin.metricSettings')}
                  {activeTab === 'notifications' && t('admin.notificationSettings')}
                  {activeTab === 'bulkPDF' && t('admin.bulkPDFGeneration')}
                  {activeTab === 'userData' && t('admin.userDataManagement')}
                  {activeTab === 'activityData' && t('admin.activityLogManagement')}
                </h1>
              </div>

              {/* Content Components */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {activeTab === 'overview' && (
                  <div>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <StatCard
                        icon={Users}
                        title={t('admin.totalUsers')}
                        value={stats?.totalUsers || 0}
                        change="+12%"
                        trend="up"
                      />
                      <StatCard
                        icon={Calendar}
                        title={t('admin.activeBidLines')}
                        value={stats?.activeBidLines || 0}
                        change="+5%"
                        trend="up"
                      />
                      <StatCard
                        icon={Building}
                        title={t('admin.operations')}
                        value={stats?.totalOperations || 0}
                        change="0%"
                        trend="neutral"
                      />
                      <StatCard
                        icon={Activity}
                        title={t('admin.todaysActivity')}
                        value={stats?.todayActivity || 0}
                        change="-3%"
                        trend="down"
                      />
                    </div>

                    {/* Recent Activity */}
                    <div className="mt-8">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('admin.recentActivity')}
                      </h2>
                      <div className="space-y-4">
                        {stats?.recentActivity?.slice(0, 5).map((activity: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Activity className="h-5 w-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {activity.action} by <span className="font-medium">{activity.user}</span>
                              </p>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {activity.timestamp}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && <UserManagement variant="enhanced" locale={locale} />}
                {activeTab === 'operations' && <OperationsManagement locale={locale} />}
                {activeTab === 'bidPeriods' && <BidPeriodsManagement />}
                {activeTab === 'shiftCodes' && <ShiftCodesManagement />}
                {activeTab === 'uploadSchedules' && <SchedulesManagement />}
                {activeTab === 'manageSchedules' && <ScheduleManagement />}
                {activeTab === 'metrics' && <MetricSettingsManagement />}
                
                {activeTab === 'notifications' && session?.user?.role === 'SUPER_ADMIN' && (
                  <NotificationsSettings
                    locale={locale}
                    translations={{
                      adminSettings: translations.adminSettings,
                      commonSave: t('common.save'),
                      commonCancel: t('common.cancel'),
                      commonEdit: t('common.edit'),
                      commonActive: t('common.active'),
                      commonInactive: t('common.inactive'),
                    }}
                  />
                )}
                
                {activeTab === 'bulkPDF' && (
                  <BulkPDFManagement locale={locale} t={t} />
                )}
                
                {activeTab === 'userData' && session?.user?.role === 'SUPER_ADMIN' && (
                  <UserDataManagement />
                )}
                
                {activeTab === 'activityData' && session?.user?.role === 'SUPER_ADMIN' && (
                  <ActivityDataManagement />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, title, value, change, trend }: any) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-600 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : 
          trend === 'down' ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          {change}
        </span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">from last week</span>
      </div>
    </div>
  );
}

// Helper component for handling the Schedules tab content
function SchedulesTabbed() {
  const [subTab, setSubTab] = useState('upload');

  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSubTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              subTab === 'upload'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Upload Schedules
          </button>
          <button
            onClick={() => setSubTab('manage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              subTab === 'manage'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Manage Schedules
          </button>
        </nav>
      </div>
      
      {subTab === 'upload' && <SchedulesManagement />}
      {subTab === 'manage' && <ScheduleManagement />}
    </div>
  );
}