// src/components/mobile/MobileStepIndicator.jsx - FULLY OPTIMIZED
import { useTheme } from '../../contexts/ThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';

export default function MobileStepIndicator({ currentStep, totalSteps }) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Ensure we have valid values
  const validCurrentStep = currentStep || 1;
  const validTotalSteps = totalSteps || 1;
  
  const progress = validTotalSteps > 1 
    ? ((validCurrentStep - 1) / (validTotalSteps - 1)) * 100 
    : 0;
  
  return (
    <div className={`py-1.5 px-4 ${styles.cardBg} border-b-0`}>
      <div className={`flex justify-between items-center mb-1 text-xs ${styles.textMuted}`}>
        <span>Step {validCurrentStep} of {validTotalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="flex justify-center">
        <div className={`w-3/4 h-1.5 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}