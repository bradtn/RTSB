import { useTranslation } from '@/lib/i18n';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
    redirect(`/${locale}/auth/login`);
  }

  const { t } = useTranslation(locale);

  // Pre-translate all required strings
  const translations = {
    // Header translations
    appTitle: t('app.title'),
    navHome: t('nav.home'),
    navBidLines: t('nav.bidLines'),

    navAdmin: t('nav.admin'),
    navLogin: t('nav.login'),
    navLogout: t('nav.logout'),
    // Admin specific translations
    adminUsers: t('admin.users'),
    adminOperations: t('admin.operations'),
    adminBidPeriods: t('admin.bidPeriods'),
    adminReports: t('admin.reports'),
    adminActivityLog: t('admin.activityLog'),
    adminSettings: t('admin.settings'),
    adminShiftCodes: t('admin.shiftCodes'),
    adminUploadSchedules: t('admin.uploadSchedules'),
    adminManageSchedules: t('admin.manageSchedules'),
    adminDashboard: t('admin.dashboard'),
    adminOverview: t('admin.overview'),
    adminTotalUsers: t('admin.totalUsers'),
    adminActiveBidLines: t('admin.activeBidLines'),
    adminTodaysActivity: t('admin.todaysActivity'),
    adminQuickActions: t('admin.quickActions'),
    adminRecentActivity: t('admin.recentActivity'),
    // Role translations
    roleSuperadmin: t('roles.superadmin'),
    roleSupervisor: t('roles.supervisor'),
    roleOfficer: t('roles.officer'),
    // Common translations
    commonActive: t('admin.active'),
    commonInactive: t('admin.inactive'),
    commonStatus: t('admin.status'),
    commonActions: t('admin.actions'),
  };

  return <AdminDashboard locale={locale} translations={translations} session={session} />;
}