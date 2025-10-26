// src/components/mobile/day-off-finder/MobileDayOffFinderWizard.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileStepIndicator from "@/components/mobile/MobileStepIndicator";
import MobileOperationSelector from "./steps/MobileOperationSelector";
import MobileLineSelector from "./steps/MobileLineSelector";
import MobileDayOffSelector from "./steps/MobileDayOffSelector";
import MobileTargetOperationSelector from "./steps/MobileTargetOperationSelector";
import MobileDayOffResults from "./steps/MobileDayOffResults";

const steps = [
  { id: 1, label: "Your Operation", icon: "🏢" },
  { id: 2, label: "Your Line", icon: "📍" },
  { id: 3, label: "Days Off", icon: "📅" },
  { id: 4, label: "Target Operations", icon: "🎯" },
  { id: 5, label: "Results", icon: "✨" }
];

export default function MobileDayOffFinderWizard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [userOperation, setUserOperation] = useState("");
  const [userLine, setUserLine] = useState("");
  const [desiredDaysOff, setDesiredDaysOff] = useState<string[]>([]);
  const [targetOperations, setTargetOperations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check authentication
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

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOperationSelect = (operation: string) => {
    setUserOperation(operation);
    setUserLine(""); // Reset line when operation changes
    handleNext();
  };

  const handleLineSelect = (line: string) => {
    setUserLine(line);
    handleNext();
  };

  const handleDaysOffSelect = (days: string[]) => {
    setDesiredDaysOff(days);
    handleNext();
  };

  const handleTargetOperationsSelect = (operations: string[]) => {
    setTargetOperations(operations);
    handleNext();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <MobileOperationSelector
            selectedOperation={userOperation}
            onSelect={handleOperationSelect}
            onCancel={() => router.push("/")}
          />
        );
      case 2:
        return (
          <MobileLineSelector
            selectedOperation={userOperation}
            selectedLine={userLine}
            onSelect={handleLineSelect}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        );
      case 3:
        return (
          <MobileDayOffSelector
            userOperation={userOperation}
            userLine={userLine}
            selectedDays={desiredDaysOff}
            onSelect={handleDaysOffSelect}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <MobileTargetOperationSelector
            selectedOperations={targetOperations}
            userOperation={userOperation}
            onSelect={handleTargetOperationsSelect}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <MobileDayOffResults
            userOperation={userOperation}
            userLine={userLine}
            desiredDaysOff={desiredDaysOff}
            targetOperations={targetOperations}
            onBack={handleBack}
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
        <MobileStepIndicator currentStep={currentStep} totalSteps={steps.length} />
        <div className="flex-1 p-4">{renderStep()}</div>
      </main>
    </div>
  );
}