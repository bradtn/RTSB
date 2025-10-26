// src/components/mobile/schedule-comparison/MobileScheduleComparisonWizard.tsx
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
import MobileSecondLineSelector from "./steps/MobileSecondLineSelector";
import MobileComparisonResults from "./steps/MobileComparisonResults";

// Define the wizard steps
const STEPS = [
  { id: 1, label: "First Schedule", icon: "1️⃣" },
  { id: 2, label: "Select Line", icon: "📍" },
  { id: 3, label: "Second Schedule", icon: "2️⃣" },
  { id: 4, label: "Select Line", icon: "📍" },
  { id: 5, label: "Compare", icon: "📊" }
];

export default function MobileScheduleComparisonWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [firstOperation, setFirstOperation] = useState<string>("");
  const [firstLine, setFirstLine] = useState<string>("");
  const [secondOperation, setSecondOperation] = useState<string>("");
  const [secondLine, setSecondLine] = useState<string>("");
  const [firstScheduleData, setFirstScheduleData] = useState<any>(null);
  const [secondScheduleData, setSecondScheduleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Update URL with current state
  const updateUrlState = useCallback(() => {
    const params = new URLSearchParams();
    params.set('step', currentStep.toString());
    if (firstOperation) params.set('op1', firstOperation);
    if (firstLine) params.set('line1', firstLine);
    if (secondOperation) params.set('op2', secondOperation);
    if (secondLine) params.set('line2', secondLine);
    
    const newUrl = `/schedule-comparison?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [currentStep, firstOperation, firstLine, secondOperation, secondLine]);

  // Initialize state from URL on mount
  useEffect(() => {
    if (isInitialized) return;
    
    const step = searchParams.get('step');
    const op1 = searchParams.get('op1');
    const line1 = searchParams.get('line1');
    const op2 = searchParams.get('op2');
    const line2 = searchParams.get('line2');
    
    if (step) setCurrentStep(parseInt(step));
    if (op1) setFirstOperation(op1);
    if (line1) setFirstLine(line1);
    if (op2) setSecondOperation(op2);
    if (line2) setSecondLine(line2);
    
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Update URL whenever state changes
  useEffect(() => {
    if (isInitialized) {
      updateUrlState();
    }
  }, [currentStep, firstOperation, firstLine, secondOperation, secondLine, updateUrlState, isInitialized]);

  // Load schedule data when refreshing on step 5
  useEffect(() => {
    if (isInitialized && currentStep === 5 && firstOperation && firstLine && secondOperation && secondLine && !firstScheduleData && !secondScheduleData && !isLoading) {
      loadBothSchedules();
    }
  }, [isInitialized, currentStep, firstOperation, firstLine, secondOperation, secondLine, firstScheduleData, secondScheduleData, isLoading]);

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

  // Handle schedule loading
  const loadSchedule = async (operation: string, line: string, setScheduleData: (data: any) => void) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/schedules');
      
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      
      const schedules = await response.json();
      
      const matchingSchedule = schedules.find((s: any) => 
        s.GROUP === operation && s.LINE.toString() === line.toString()
      );
      
      if (matchingSchedule) {
        setScheduleData(matchingSchedule);
        return true;
      } else {
        setError("No schedule found");
        return false;
      }
    } catch (err) {
      setError("Error loading schedule. Please try again.");
      console.error("Error fetching schedule:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load both schedules for comparison
  const loadBothSchedules = async () => {
    setIsLoading(true);
    
    const [firstLoaded, secondLoaded] = await Promise.all([
      loadSchedule(firstOperation, firstLine, setFirstScheduleData),
      loadSchedule(secondOperation, secondLine, setSecondScheduleData)
    ]);
    
    if (firstLoaded && secondLoaded) {
      // Both loaded successfully, already at step 5
    }
  };

  // Handle first line selection
  const handleFirstLineSelect = async (line: string) => {
    setFirstLine(line);
    const loaded = await loadSchedule(firstOperation, line, setFirstScheduleData);
    if (loaded) {
      goToNextStep();
    }
  };

  // Handle second line selection
  const handleSecondLineSelect = async (line: string) => {
    setSecondLine(line);
    const loaded = await loadSchedule(secondOperation, line, setSecondScheduleData);
    if (loaded) {
      goToNextStep();
    }
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <MobileOperationSelector
            selectedOperation={firstOperation}
            onSelect={(op) => {
              setFirstOperation(op);
              goToNextStep();
            }}
            onCancel={() => router.push("/")}
            title="Select First Schedule Operation"
          />
        );
      case 2:
        return (
          <MobileLineSelector
            selectedOperation={firstOperation}
            selectedLine={firstLine}
            onSelect={handleFirstLineSelect}
            onBack={goToPreviousStep}
            isLoading={isLoading}
            error={error}
            title="Select First Schedule Line"
          />
        );
      case 3:
        return (
          <MobileOperationSelector
            selectedOperation={secondOperation}
            onSelect={(op) => {
              setSecondOperation(op);
              goToNextStep();
            }}
            onBack={goToPreviousStep}
            title="Select Second Schedule Operation"
            excludeSchedule={firstScheduleData}
          />
        );
      case 4:
        return (
          <MobileSecondLineSelector
            selectedOperation={secondOperation}
            selectedLine={secondLine}
            onSelect={handleSecondLineSelect}
            onBack={goToPreviousStep}
            isLoading={isLoading}
            error={error}
            title="Select Second Schedule Line"
            excludeSchedule={firstScheduleData}
          />
        );
      case 5:
        // Show loading if we're fetching the schedule data
        if (isLoading || !firstScheduleData || !secondScheduleData) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-4"></div>
              <p className={`text-sm ${styles.textSecondary}`}>Loading schedules...</p>
            </div>
          );
        }
        return (
          <MobileComparisonResults
            firstSchedule={firstScheduleData}
            secondSchedule={secondScheduleData}
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