'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSeniorityData } from '../hooks/useSeniorityData';
import { notificationService, SendMethod, NotificationType } from '@/services/NotificationService';
import { useSearchAndFilter, createOfficerSearchFunction } from '@/hooks/useSearchAndFilter';

interface SendTabProps {
  locale: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export function SendTab({ locale }: SendTabProps) {
  const { t } = useTranslation(locale);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationType>('your_turn');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageSubject, setMessageSubject] = useState('Your turn to bid!');
  const [messageBody, setMessageBody] = useState('');
  const [sendMethod, setSendMethod] = useState<SendMethod>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'fr'>('en');

  // Get officer data for recipient selection
  const { seniorityList: officers, loading: dataLoading } = useSeniorityData({
    includeCompleted: false // Get all active officers
  });

  // Search functionality for recipient selection
  const searchFunction = createOfficerSearchFunction('name', 'badge');
  const { searchTerm, setSearchTerm, filteredItems: filteredOfficers } = useSearchAndFilter(
    officers, 
    searchFunction
  );

  // Predefined templates with bilingual support
  const templates: Record<NotificationType, { 
    en: { subject: string; body: string };
    fr: { subject: string; body: string };
  }> = {
    your_turn: {
      en: {
        subject: 'Your Turn to Bid!',
        body: 'Hello {{firstName}},\n\nIt\'s your turn to select your bid line. Please log in to the system to make your selection.\n\nBest regards,\nAdmin Team'
      },
      fr: {
        subject: 'C\'est votre tour de soumissionner!',
        body: 'Bonjour {{firstName}},\n\nC\'est votre tour de sélectionner votre ligne de soumission. Veuillez vous connecter au système pour faire votre sélection.\n\nCordialement,\nL\'équipe administrative'
      }
    },
    next_in_line: {
      en: {
        subject: 'You\'re Next in Line',
        body: 'Hello {{firstName}},\n\nYou\'re next in line to bid. Please be ready to make your selection soon.\n\nBest regards,\nAdmin Team'
      },
      fr: {
        subject: 'Vous êtes le prochain en ligne',
        body: 'Bonjour {{firstName}},\n\nVous êtes le prochain en ligne pour soumissionner. Veuillez être prêt à faire votre sélection bientôt.\n\nCordialement,\nL\'équipe administrative'
      }
    },
    reminder: {
      en: {
        subject: 'Bidding Reminder',
        body: 'Hello {{firstName}},\n\nThis is a reminder about the ongoing bidding process. Please check your status.\n\nBest regards,\nAdmin Team'
      },
      fr: {
        subject: 'Rappel de soumission',
        body: 'Bonjour {{firstName}},\n\nCeci est un rappel concernant le processus de soumission en cours. Veuillez vérifier votre statut.\n\nCordialement,\nL\'équipe administrative'
      }
    },
    custom: {
      en: { subject: '', body: '' },
      fr: { subject: '', body: '' }
    }
  };

  // Update message when template or preview language changes
  useEffect(() => {
    const template = templates[selectedTemplate];
    if (selectedTemplate !== 'custom') {
      const langTemplate = template[previewLanguage];
      setMessageSubject(langTemplate.subject);
      setMessageBody(langTemplate.body);
    } else {
      setMessageSubject('');
      setMessageBody('');
    }
  }, [selectedTemplate, previewLanguage]);

  // Toggle recipient selection
  const toggleRecipient = (officerId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(officerId)
        ? prev.filter(id => id !== officerId)
        : [...prev, officerId]
    );
  };

  // Select all filtered officers
  const selectAll = () => {
    setSelectedRecipients(filteredOfficers.map(o => o.id));
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedRecipients([]);
  };

  // Send bulk notification
  const sendBulkNotification = async () => {
    if (selectedRecipients.length === 0 || !messageSubject || !messageBody) {
      return;
    }

    setIsLoading(true);
    
    const { successCount, errorCount } = await notificationService.sendBulkNotifications(
      selectedRecipients,
      {
        type: selectedTemplate,
        customSubject: selectedTemplate === 'custom' ? messageSubject : undefined,
        customMessage: selectedTemplate === 'custom' ? messageBody : undefined,
        sendMethod,
      }
    );

    // Clear form on success
    if (successCount > 0) {
      setSelectedRecipients([]);
      if (selectedTemplate === 'custom') {
        setMessageSubject('');
        setMessageBody('');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Send Notification
      </h3>

      {/* Step 1: Select Recipients */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          1. Select Recipients ({selectedRecipients.length} selected)
        </label>

        {/* Search box */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search by name or badge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Select/Clear buttons */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Select All ({filteredOfficers.length})
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>

        {/* Recipients list */}
        <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          {dataLoading ? (
            <div className="flex flex-col items-center justify-center p-4 text-gray-500">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="mt-2 text-sm">Loading officers...</span>
            </div>
          ) : filteredOfficers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No officers found</div>
          ) : (
            filteredOfficers.map((officer) => (
              <label
                key={officer.id}
                className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(officer.id)}
                  onChange={() => toggleRecipient(officer.id)}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {officer.name} (#{officer.badge})
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {officer.email} {officer.phone && `• ${officer.phone}`}
                  </div>
                </div>
                {officer.status === 'up_next' && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                    Up Next
                  </span>
                )}
              </label>
            ))
          )}
        </div>
      </div>

      {/* Step 2: Template Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          2. Choose Template
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value as NotificationType)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="your_turn">Your Turn to Bid</option>
          <option value="next_in_line">You're Next in Line</option>
          <option value="reminder">Reminder</option>
          <option value="custom">Custom Message</option>
        </select>
      </div>

      {/* Step 3: Message Content */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            3. Message Content
          </label>
          
          {/* Language Toggle for Template Preview */}
          {selectedTemplate !== 'custom' && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPreviewLanguage('en')}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
                  ${previewLanguage === 'en' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer'
                  }
                `}
                title="View English template"
              >
                <span>🇨🇦</span>
                <span>EN</span>
              </button>
              
              <button
                onClick={() => setPreviewLanguage('fr')}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
                  ${previewLanguage === 'fr' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer'
                  }
                `}
                title="View French template"
              >
                <span>⚜️</span>
                <span>FR</span>
              </button>
            </div>
          )}
        </div>

        {/* Template info message */}
        {selectedTemplate !== 'custom' && (
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ℹ️ Viewing {previewLanguage === 'en' ? 'English' : 'French'} template. Recipients will receive the message in their preferred language.
            </p>
          </div>
        )}

        {/* Subject */}
        <input
          type="text"
          placeholder="Subject..."
          value={messageSubject}
          onChange={(e) => setMessageSubject(e.target.value)}
          disabled={selectedTemplate !== 'custom'}
          className={`w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
            selectedTemplate !== 'custom' ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : ''
          }`}
        />

        {/* Body */}
        <textarea
          placeholder="Message body..."
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          disabled={selectedTemplate !== 'custom'}
          rows={6}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
            selectedTemplate !== 'custom' ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : ''
          }`}
        />

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Available variables: {`{{firstName}}, {{lastName}}, {{badge}}, {{rank}}`}
        </div>
      </div>

      {/* Step 4: Delivery Method */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          4. Delivery Method
        </label>
        <div className="flex gap-3">
          <label className="flex items-center">
            <input
              type="radio"
              value="email"
              checked={sendMethod === 'email'}
              onChange={(e) => setSendMethod(e.target.value as SendMethod)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="sms"
              checked={sendMethod === 'sms'}
              onChange={(e) => setSendMethod(e.target.value as SendMethod)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">SMS</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="both"
              checked={sendMethod === 'both'}
              onChange={(e) => setSendMethod(e.target.value as SendMethod)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Both</span>
          </label>
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={sendBulkNotification}
        disabled={selectedRecipients.length === 0 || !messageSubject || !messageBody || isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading 
          ? 'Sending...' 
          : `Send to ${selectedRecipients.length} Recipient${selectedRecipients.length !== 1 ? 's' : ''}`
        }
      </button>
    </div>
  );
}