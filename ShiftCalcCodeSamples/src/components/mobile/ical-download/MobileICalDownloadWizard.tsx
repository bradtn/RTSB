// src/components/mobile/ical-download/MobileICalDownloadWizard.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import MobileHeader from "../MobileHeader";
import MobileStepIndicator from "../MobileStepIndicator";
import MobileOperationSelector from "./steps/MobileOperationSelector";
import MobileLineSelector from "./steps/MobileLineSelector";
import MobileSchedulePreview from "./steps/MobileSchedulePreview";

// Define the wizard steps
const STEPS = [
  { id: 1, label: "Operation", icon: "🏭" },
  { id: 2, label: "Line", icon: "📍" },
  { id: 3, label: "Preview", icon: "📅" }
];

export default function MobileICalDownloadWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOperation, setSelectedOperation] = useState<string>("");
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Update URL with current state
  const updateUrlState = useCallback(() => {
    const params = new URLSearchParams();
    params.set('step', currentStep.toString());
    if (selectedOperation) params.set('operation', selectedOperation);
    if (selectedLine) params.set('line', selectedLine);
    if (scheduleData?.id) params.set('scheduleId', scheduleData.id.toString());
    
    const newUrl = `/ical-download?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [currentStep, selectedOperation, selectedLine, scheduleData]);

  // Initialize state from URL on mount
  useEffect(() => {
    if (isInitialized) return;
    
    const step = searchParams.get('step');
    const operation = searchParams.get('operation');
    const line = searchParams.get('line');
    const scheduleId = searchParams.get('scheduleId');
    
    if (step) setCurrentStep(parseInt(step));
    if (operation) setSelectedOperation(operation);
    if (line) setSelectedLine(line);
    
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Load schedule data when refreshing on step 3
  useEffect(() => {
    if (isInitialized && currentStep === 3 && selectedOperation && selectedLine && !scheduleData && !isLoading) {
      handleLineSelect(selectedLine, selectedOperation);
    }
  }, [isInitialized, currentStep, selectedOperation, selectedLine, scheduleData, isLoading]);

  // Update URL whenever state changes
  useEffect(() => {
    if (isInitialized) {
      updateUrlState();
    }
  }, [currentStep, selectedOperation, selectedLine, scheduleData, updateUrlState, isInitialized]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col">
        <MobileHeader isLoading={true} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Don't show content if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const step = params.get('step');
      if (step) {
        setCurrentStep(parseInt(step));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle operation selection
  const handleOperationSelect = (operation: string) => {
    setSelectedOperation(operation);
    setSelectedLine(""); // Reset line selection
    goToNextStep();
  };

  // Handle line selection
  const handleLineSelect = async (line: string, operation?: string) => {
    const targetOperation = operation || selectedOperation;
    setSelectedLine(line);
    setIsLoading(true);
    setError("");
    
    try {
      // First fetch all schedules
      const response = await fetch('/api/schedules');
      
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      
      const schedules = await response.json();
      
      // Find the specific schedule matching the group and line
      const matchingSchedule = schedules.find((s: any) => 
        s.GROUP === targetOperation && s.LINE.toString() === line.toString()
      );
      
      if (matchingSchedule) {
        setScheduleData(matchingSchedule);
        goToNextStep();
      } else {
        setError("No schedule found for this line");
      }
    } catch (err) {
      setError("Error loading schedule. Please try again.");
      console.error("Error fetching schedule:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <MobileOperationSelector
            selectedOperation={selectedOperation}
            onSelect={handleOperationSelect}
            onCancel={() => router.push("/")}
          />
        );
      case 2:
        return (
          <MobileLineSelector
            selectedOperation={selectedOperation}
            selectedLine={selectedLine}
            onSelect={handleLineSelect}
            onBack={goToPreviousStep}
            isLoading={isLoading}
            error={error}
          />
        );
      case 3:
        // Show loading if we're fetching the schedule data
        if (isLoading || !scheduleData) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-4"></div>
              <p className={`text-sm ${styles.textSecondary}`}>Loading schedule...</p>
            </div>
          );
        }
        return (
          <MobileSchedulePreview
            scheduleData={scheduleData}
            onBack={goToPreviousStep}
            onClose={() => router.push("/")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex min-h-screen flex-col ${styles.bodyBg}`}>
      <MobileHeader />
      
      <main className="flex-1 flex flex-col">
        {/* Step indicator */}
        <MobileStepIndicator 
          currentStep={currentStep}
          totalSteps={STEPS.length}
        />
        
        {/* Current step content */}
        <div className="flex-1 p-4">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}