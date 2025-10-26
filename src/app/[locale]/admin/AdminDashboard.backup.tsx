'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Building, BarChart3, FileText, Settings, Activity, Download, Upload, Clock, Bell, RotateCcw, ToggleLeft } from 'lucide-react';
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

interface AdminDashboardProps {
  locale: string;
  translations: {
    appTitle: string;
    navHome: string;
    navBidLines: string;
    navAdmin: string;
    navLogin: string;
    navLogout: string;
    adminUsers: string;
    adminOperations: string;
    adminBidPeriods: string;
    adminReports: string;
    adminActivityLog: string;
    adminSettings: string;
    adminShiftCodes?: string;
    adminUploadSchedules?: string;
    adminManageSchedules?: string;
    adminDashboard?: string;
    adminOverview?: string;
    adminTotalUsers?: string;
    adminActiveBidLines?: string;
    adminTodaysActivity?: string;
    adminQuickActions?: string;
    adminRecentActivity?: string;
    roleSuperadmin: string;
    roleSupervisor: string;
    roleOfficer: string;
    commonActive?: string;
    commonInactive?: string;
    commonStatus?: string;
    commonActions?: string;
  };
  session: any;
}

export default function AdminDashboard({ locale, translations, session }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Debug tab changes
  React.useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const tabs = [
    { id: 'overview', name: translations.adminOverview || 'Overview', icon: BarChart3 },
    { id: 'users', name: translations.adminUsers, icon: Users },
    { id: 'operations', name: translations.adminOperations, icon: Building },
    { id: 'bidPeriods', name: translations.adminBidPeriods, icon: Calendar },
    { id: 'shiftCodes', name: translations.adminShiftCodes || 'Shift Codes', icon: Clock },
    { id: 'schedules', name: 'Schedules', icon: FileText },
    { id: 'metrics', name: 'Metric Settings', icon: ToggleLeft },
    ...(session?.user?.role === 'SUPER_ADMIN' ? [
      { id: 'notifications', name: 'Notifications', icon: Bell },
      { id: 'userData', name: 'User Data', icon: Download },
      { id: 'activityData', name: 'Activity Data', icon: RotateCcw },
    ] : []),
  ];

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">{translations.navAdmin} Dashboard</h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
              Welcome back, {session.user.name} ({
                session.user.role === 'SUPER_ADMIN' ? translations.roleSuperadmin :
                session.user.role === 'SUPERVISOR' ? translations.roleSupervisor :
                translations.roleOfficer
              })
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-3 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <Icon className={`mr-2 h-5 w-5 transition-colors duration-200 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'overview' && (
            <div>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-200 hover:-translate-y-0.5">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-7 w-7 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate uppercase tracking-wide">Total Users</dt>
                          <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalUsers || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-200 hover:-translate-y-0.5">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Calendar className="h-7 w-7 text-green-500 dark:text-green-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate uppercase tracking-wide">Active Bid Lines</dt>
                          <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats?.activeBidLines || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-200 hover:-translate-y-0.5">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Building className="h-7 w-7 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate uppercase tracking-wide">Operations</dt>
                          <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats?.totalOperations || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-200 hover:-translate-y-0.5">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Activity className="h-7 w-7 text-orange-500 dark:text-orange-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate uppercase tracking-wide">Today's Activity</dt>
                          <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats?.todayActivity || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    <Upload className="h-4 w-4" />
                    {'Import Lines'}
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    <Download className="h-4 w-4" />
                    {'Export Data'}
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    <Users className="h-4 w-4" />
                    {'Add User'}
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    <Calendar className="h-4 w-4" />
                    Add Bid Period
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {stats?.recentActivity?.map((activity: any, idx: number) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {idx !== stats.recentActivity.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-lg">
                                <Activity className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {activity.action} by <span className="font-medium text-gray-900 dark:text-gray-100">{activity.user}</span>
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {activity.timestamp}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' ? (
            <UserManagement variant="enhanced" locale={locale} />
          ) : null}

          {activeTab === 'operations' && (
            <OperationsManagement locale={locale} />
          )}

          {activeTab === 'bidPeriods' && (
            <BidPeriodsManagement />
          )}

          {activeTab === 'shiftCodes' && (
            <ShiftCodesManagement />
          )}

          {activeTab === 'schedules' && (
            <SchedulesTabbed />
          )}

          {activeTab === 'metrics' && (
            <MetricSettingsManagement />
          )}

          {activeTab === 'notifications' && session?.user?.role === 'SUPER_ADMIN' && (
            <NotificationsSettings
              locale={locale}
              translations={{
                adminSettings: translations.adminSettings,
                commonSave: 'Save',
                commonCancel: 'Cancel',
                commonEdit: 'Edit',
                commonActive: 'Active',
                commonInactive: 'Inactive',
                commonStatus: 'Status',
                changesSaved: 'Settings saved successfully',
                changesError: 'Failed to save settings',
              }}
            />
          )}

          {activeTab === 'userData' && session?.user?.role === 'SUPER_ADMIN' && (
            <UserDataManagement />
          )}

          {activeTab === 'activityData' && session?.user?.role === 'SUPER_ADMIN' && (
            <ActivityDataManagement locale={locale} />
          )}

        </div>
      </div>
    </>
  );
}



function ActivityLog({ locale }: any) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activityLog'],
    queryFn: async () => {
      const res = await fetch('/api/admin/activity-log');
      if (!res.ok) throw new Error('Failed to fetch activity log');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-8 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">{'Activity Log'}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {activities?.map((activity: any) => (
                <tr key={activity.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {activity.user?.firstName} {activity.user?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{activity.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {activity.details ? JSON.stringify(activity.details).substring(0, 50) + '...' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{activity.ipAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SchedulesTabbed() {
  const [activeScheduleTab, setActiveScheduleTab] = useState('upload');

  const scheduleTabs = [
    { id: 'upload', name: 'Upload Schedules', icon: Upload },
    { id: 'manage', name: 'Manage Schedules', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Schedules */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6">
          {scheduleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveScheduleTab(tab.id)}
                className={`
                  group inline-flex items-center py-3 px-2 border-b-2 font-medium text-sm transition-all duration-200
                  ${activeScheduleTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className={`mr-2 h-4 w-4 ${activeScheduleTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Schedule Content */}
      {activeScheduleTab === 'upload' && <SchedulesManagement />}
      {activeScheduleTab === 'manage' && <ScheduleManagement />}
    </div>
  );
}