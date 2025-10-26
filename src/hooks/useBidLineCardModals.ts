import { useState } from 'react';

interface ModalState {
  showMetricModal: boolean;
  showCalendarModal: boolean;
  showDayOffModal: boolean;
  showAssignModal: boolean;
  showAdminMenu: boolean;
  showAllMetricsModal: boolean;
}

interface SelectedMetric {
  type: string;
  value: number | string;
}

/**
 * Custom hook for managing BidLineCard modal states and interactions
 */
export const useBidLineCardModals = () => {
  // Modal states
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showDayOffModal, setShowDayOffModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showAllMetricsModal, setShowAllMetricsModal] = useState(false);
  
  // Selected metric state for modal
  const [selectedMetric, setSelectedMetric] = useState<SelectedMetric | null>(null);

  // Modal control functions
  const openMetricModal = (type: SelectedMetric['type'], value: number | string) => {
    setSelectedMetric({ type, value });
    setShowMetricModal(true);
  };

  const closeMetricModal = () => {
    setShowMetricModal(false);
    setSelectedMetric(null);
  };

  const openCalendarModal = () => {
    setShowCalendarModal(true);
  };

  const closeCalendarModal = () => {
    setShowCalendarModal(false);
  };

  const openDayOffModal = () => {
    setShowDayOffModal(true);
  };

  const closeDayOffModal = () => {
    setShowDayOffModal(false);
  };

  const openAssignModal = () => {
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
  };

  const toggleAdminMenu = () => {
    setShowAdminMenu(prev => !prev);
  };

  const closeAdminMenu = () => {
    setShowAdminMenu(false);
  };

  const openAllMetricsModal = () => {
    setShowAllMetricsModal(true);
  };

  const closeAllMetricsModal = () => {
    setShowAllMetricsModal(false);
  };

  // Close all modals
  const closeAllModals = () => {
    setShowMetricModal(false);
    setShowCalendarModal(false);
    setShowDayOffModal(false);
    setShowAssignModal(false);
    setShowAdminMenu(false);
    setShowAllMetricsModal(false);
    setSelectedMetric(null);
  };

  return {
    // State
    showMetricModal,
    showCalendarModal,
    showDayOffModal,
    showAssignModal,
    showAdminMenu,
    showAllMetricsModal,
    selectedMetric,
    
    // Actions
    openMetricModal,
    closeMetricModal,
    openCalendarModal,
    closeCalendarModal,
    openDayOffModal,
    closeDayOffModal,
    openAssignModal,
    closeAssignModal,
    toggleAdminMenu,
    closeAdminMenu,
    openAllMetricsModal,
    closeAllMetricsModal,
    closeAllModals,
  };
};