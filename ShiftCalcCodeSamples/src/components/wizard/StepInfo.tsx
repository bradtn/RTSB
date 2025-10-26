// src/components/wizard/StepInfo.tsx
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';

interface StepInfoProps {
  step: number;
}

export default function StepInfo({ step }: StepInfoProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Work Group Selection';
      case 2: return 'Days Off Selection';
      case 3: return 'Shift Types Selection';
      case 4: return 'Work Stretches'; 
      case 5: return 'Weekend Preferences';
      default: return 'Filter Selection';
    }
  };
  
  const getStepDescription = () => {
    switch(step) {
      case 1: return 'Selecting work groups helps find schedules that align with your team preferences.';
      case 2: return 'Choose your preferred days off to find matching schedules.';
      case 3: return 'Select shift types that work best for your schedule.';
      case 4: return 'Set your preferences for consecutive work days.';
      case 5: return 'Set your preferences for weekend work schedules.';
      default: return 'Configure your preferences to find the best schedule match.';
    }
  };
  
  return (
    <div className={`rounded-lg p-5 shadow-md ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <h3 className={`font-bold text-lg ${styles.textPrimary}`}>
        {getStepTitle()}
      </h3>
      <p className={`mb-3 ${styles.textSecondary}`}>
        {getStepDescription()}
      </p>
      
      {step === 1 && (
        <div className={`${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-blue-500' : 'border-blue-400'}`}>
          <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Pro Tips</h4>
          <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'} text-sm space-y-1`}>
            <li>Select multiple groups to see more options</li>
            <li>Set importance to "Essential" if you must be in these groups</li>
            <li>Lower importance if you're flexible</li>
            <li>Groups often represent teams or departments</li>
            <li>Some groups may have better schedules than others</li>
          </ul>
        </div>
      )}
      
      {step === 2 && (
        <div className={`${theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-purple-500' : 'border-purple-400'}`}>
          <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>Pro Tips</h4>
          <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-purple-200' : 'text-purple-800'} text-sm space-y-1`}>
            <li>Select specific dates you need off</li>
            <li>Use date ranges for vacations</li>
            <li>Higher importance means greater priority</li>
            <li>Consider holidays and special events</li>
            <li>Being flexible increases your schedule options</li>
          </ul>
        </div>
      )}
      
      {step === 3 && (
        <div className={`${theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-orange-500' : 'border-orange-400'}`}>
          <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>Pro Tips</h4>
          <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-orange-200' : 'text-orange-800'} text-sm space-y-1`}>
            <li>Choose shift types that match your lifestyle</li>
            <li>Select shift length (8, 10, or 12 hours)</li>
            <li>Consider commute times and personal schedule</li>
            <li>Morning people should prefer early shifts</li>
            <li>Night owls might prefer evening shifts</li>
          </ul>
        </div>
      )}
      
      {step === 4 && (
        <div className={`${theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-green-500' : 'border-green-400'}`}>
          <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>Pro Tips</h4>
          <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-green-200' : 'text-green-800'} text-sm space-y-1`}>
            <li>4-day blocks give you longer weekends</li>
            <li>5-day blocks match traditional workweeks</li>
            <li>Consider family and social commitments</li>
            <li>Longer blocks often mean longer time off</li>
            <li>Pick what works best for your lifestyle</li>
          </ul>
        </div>
      )}
      
      {step === 5 && (
        <div className={`${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-red-500' : 'border-red-400'}`}>
          <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>Pro Tips</h4>
          <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-red-200' : 'text-red-800'} text-sm space-y-1`}>
            <li>Set preferences for Saturday and Sunday separately</li>
            <li>Weekend shifts often have differential pay</li>
            <li>Consider religious or family commitments</li>
            <li>Some prefer weekends to have social time</li>
            <li>Being flexible here can open up better schedules</li>
          </ul>
        </div>
      )}
    </div>
  );
}