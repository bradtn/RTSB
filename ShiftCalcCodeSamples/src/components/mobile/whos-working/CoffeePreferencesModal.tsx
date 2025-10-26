"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

// Export helper to check if user has any coffee preferences
export const checkHasCoffeePreferences = async (employeeName: string, operation: string, line: string): Promise<{hasPreferences: boolean, hasEnabledCoffee: boolean}> => {
  try {
    const response = await fetch(
      `/api/coffee-preferences?employee=${encodeURIComponent(employeeName)}&operation=${encodeURIComponent(operation)}&line=${encodeURIComponent(line)}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.preferences) {
        const hasHot = data.preferences.hot?.enabled === true;
        const hasIced = data.preferences.iced?.enabled === true;
        return {
          hasPreferences: true,
          hasEnabledCoffee: hasHot || hasIced
        };
      }
    }
    return { hasPreferences: false, hasEnabledCoffee: false };
  } catch {
    return { hasPreferences: false, hasEnabledCoffee: false };
  }
};

interface CoffeePlaceOrder {
  enabled: boolean;
  customOrder: string;
}

interface CoffeePreferences {
  hot: {
    enabled: boolean;
    size: string;
    type: string;
    milk: string;
    milkAmount: string;
    sugar: string;
    notes: string;
  };
  iced: {
    enabled: boolean;
    size: string;
    type: string;
    milk: string;
    milkAmount: string;
    sugar: string;
    notes: string;
  };
  places: {
    mcdonalds: CoffeePlaceOrder;
    timhortons: CoffeePlaceOrder;
    starbucks: CoffeePlaceOrder;
  };
}

interface CoffeePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  operation: string;
  line: string;
}

const SIZES = ["Small", "Medium", "Large", "XL"];
const COFFEE_TYPES = ["Regular", "Dark Roast", "Espresso", "Latte", "Cappuccino", "Americano"];
const MILK_TYPES = ["None", "Cream", "Milk", "2%", "Skim", "Almond", "Oat", "Soy", "Coconut"];
const MILK_AMOUNTS = ["None", "Splash", "1/2", "1", "2", "3", "4"];
const SUGAR_OPTIONS = ["None", "1 Sugar", "2 Sugars", "3 Sugars", "Sweetener", "Honey"];
// Extras removed - use special instructions instead

const COFFEE_PLACES = [
  { id: 'mcdonalds', name: "McDonald's", icon: '🟡' },
  { id: 'timhortons', name: "Tim Hortons", icon: '🍁' },
  { id: 'starbucks', name: "Starbucks", icon: '☕' }
];

export default function CoffeePreferencesModal({ 
  isOpen, 
  onClose, 
  employeeName,
  operation,
  line 
}: CoffeePreferencesModalProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [activeTab, setActiveTab] = useState<'hot' | 'iced' | 'places'>('hot');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasExistingPreferences, setHasExistingPreferences] = useState(false);
  
  const [preferences, setPreferences] = useState<CoffeePreferences>({
    hot: {
      enabled: true,
      size: "Medium",
      type: "Regular",
      milk: "Cream",
      milkAmount: "1",
      sugar: "1 Sugar",
      notes: ""
    },
    iced: {
      enabled: true,
      size: "Large",
      type: "Regular",
      milk: "Cream",
      milkAmount: "1",
      sugar: "1 Sugar",
      notes: ""
    },
    places: {
      mcdonalds: { enabled: false, customOrder: "" },
      timhortons: { enabled: false, customOrder: "" },
      starbucks: { enabled: false, customOrder: "" }
    }
  });

  useEffect(() => {
    if (isOpen && employeeName) {
      fetchPreferences();
    }
  }, [isOpen, employeeName]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/coffee-preferences?employee=${encodeURIComponent(employeeName)}&operation=${encodeURIComponent(operation)}&line=${encodeURIComponent(line)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          // Merge fetched preferences with defaults to ensure all properties exist
          console.log('Fetched preferences from API:', data.preferences);
          setPreferences(prev => {
            const merged = {
              hot: {
                ...prev.hot,
                ...(data.preferences.hot || {}),
                enabled: data.preferences.hot?.enabled ?? prev.hot.enabled,
                milkAmount: data.preferences.hot?.milkAmount || prev.hot.milkAmount
              },
              iced: {
                ...prev.iced,
                ...(data.preferences.iced || {}),
                enabled: data.preferences.iced?.enabled ?? prev.iced.enabled,
                milkAmount: data.preferences.iced?.milkAmount || prev.iced.milkAmount
              },
              places: data.preferences.places || prev.places
            };
            console.log('Merged preferences:', merged);
            return merged;
          });
          setHasExistingPreferences(true);
          setIsEditMode(false);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log('Saving preferences:', preferences);
    try {
      const response = await fetch('/api/coffee-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName,
          operation,
          line,
          preferences
        })
      });
      
      if (response.ok) {
        console.log('Preferences saved successfully');
        setHasExistingPreferences(true);
        setIsEditMode(false);
        // Don't close the modal, just show the saved view
      } else {
        console.error('Failed to save preferences:', await response.text());
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (type: 'hot' | 'iced', field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };


  const setBlackCoffee = (type: 'hot' | 'iced') => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        milk: "None",
        milkAmount: "None",
        sugar: "None"
      }
    }));
  };

  const togglePlace = (placeId: keyof CoffeePreferences['places']) => {
    setPreferences(prev => ({
      ...prev,
      places: {
        ...prev.places,
        [placeId]: {
          ...prev.places[placeId],
          enabled: !prev.places[placeId].enabled
        }
      }
    }));
  };

  const updatePlaceOrder = (placeId: keyof CoffeePreferences['places'], order: string) => {
    setPreferences(prev => ({
      ...prev,
      places: {
        ...prev.places,
        [placeId]: {
          ...prev.places[placeId],
          customOrder: order
        }
      }
    }));
  };

  const formatCoffeeOrder = (prefs: typeof preferences.hot | typeof preferences.iced) => {
    let orderText = `${prefs.size} ${prefs.type}`;
    
    if (prefs.milk === 'None' && prefs.sugar === 'None') {
      orderText += ' (Black)';
    } else {
      const details = [];
      
      if (prefs.milk !== 'None') {
        if (prefs.milkAmount !== 'None' && prefs.milkAmount !== '1') {
          details.push(`${prefs.milkAmount} ${prefs.milk}`);
        } else {
          details.push(prefs.milk);
        }
      }
      
      if (prefs.sugar !== 'None') {
        details.push(prefs.sugar);
      }
      
      if (details.length > 0) {
        orderText += ` with ${details.join(', ')}`;
      }
    }
    
    return orderText;
  };

  const getEnabledPlaces = () => {
    return COFFEE_PLACES.filter(place => 
      preferences.places?.[place.id as keyof CoffeePreferences['places']]?.enabled
    );
  };

  const hasAnyCoffeeEnabled = () => {
    return preferences.hot.enabled || preferences.iced.enabled;
  };

  const toggleCoffeeType = (type: 'hot' | 'iced') => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled
      }
    }));
  };

  if (!isOpen) return null;

  const currentPrefs = activeTab === 'places' ? null : preferences[activeTab as 'hot' | 'iced'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md max-h-[90vh] rounded-lg ${styles.cardBg} shadow-xl overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 border-b ${styles.borderDefault}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${styles.textPrimary}`}>☕ Coffee Order</h2>
              <p className={`text-sm ${styles.textMuted}`}>{employeeName}</p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${styles.hoverOverlay}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        {(!hasExistingPreferences || isEditMode) && (
          <div className={`flex border-b ${styles.borderDefault}`}>
            <button
              onClick={() => setActiveTab('hot')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'hot'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : styles.textMuted
              }`}
            >
              🔥 Hot
            </button>
            <button
              onClick={() => setActiveTab('iced')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'iced'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : styles.textMuted
              }`}
            >
              🧊 Iced
            </button>
            <button
              onClick={() => setActiveTab('places')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'places'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : styles.textMuted
              }`}
            >
              📍 Places
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : hasExistingPreferences && !isEditMode ? (
            // Saved Orders View
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${styles.secondaryBg}`}>
                <h3 className={`font-semibold ${styles.textPrimary} mb-3`}>☕ Saved Coffee Orders</h3>
                
                {!hasAnyCoffeeEnabled() ? (
                  <div className="text-center py-4">
                    <p className={`${styles.textSecondary} mb-2`}>No coffee preferences enabled</p>
                    <p className={`text-sm ${styles.textMuted}`}>Click "Edit Order" to set up your preferences</p>
                  </div>
                ) : (
                  <>
                    {/* Hot Coffee Order */}
                    {preferences.hot.enabled && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-red-500">🔥</span>
                          <span className={`text-sm font-medium ${styles.textSecondary}`}>Hot Coffee</span>
                        </div>
                        <p className={styles.textPrimary}>{formatCoffeeOrder(preferences.hot)}</p>
                        {preferences.hot.notes && (
                          <p className={`text-sm ${styles.textMuted} mt-1 italic`}>"{preferences.hot.notes}"</p>
                        )}
                      </div>
                    )}
                    
                    {/* Iced Coffee Order */}
                    {preferences.iced.enabled && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-500">🧊</span>
                          <span className={`text-sm font-medium ${styles.textSecondary}`}>Iced Coffee</span>
                        </div>
                        <p className={styles.textPrimary}>{formatCoffeeOrder(preferences.iced)}</p>
                        {preferences.iced.notes && (
                          <p className={`text-sm ${styles.textMuted} mt-1 italic`}>"{preferences.iced.notes}"</p>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {/* Preferred Places */}
                {getEnabledPlaces().length > 0 && (
                  <div className={`border-t pt-3 mt-3 ${styles.borderDefault}`}>
                    <p className={`text-sm font-medium ${styles.textSecondary} mb-2`}>📍 Preferred Places</p>
                    <div className="space-y-2">
                      {getEnabledPlaces().map(place => {
                        const placePrefs = preferences.places[place.id as keyof CoffeePreferences['places']];
                        return (
                          <div key={place.id} className="flex items-start gap-2">
                            <span className="text-lg">{place.icon}</span>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${styles.textPrimary}`}>{place.name}</p>
                              {placePrefs.customOrder && (
                                <p className={`text-sm ${styles.textSecondary}`}>{placePrefs.customOrder}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${styles.buttonSecondary}`}
                >
                  ✏️ Edit Order
                </button>
                <button
                  onClick={() => {
                    setHasExistingPreferences(false);
                    setIsEditMode(true);
                  }}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all ${styles.buttonSecondary}`}
                >
                  ➕ New
                </button>
              </div>
            </div>
          ) : activeTab === 'hot' || activeTab === 'iced' ? (
            <>
              {/* Enable/Disable Toggle */}
              <div className={`p-3 rounded-lg ${styles.secondaryBg} mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={activeTab === 'hot' ? 'text-red-500' : 'text-blue-500'}>
                      {activeTab === 'hot' ? '🔥' : '🧊'}
                    </span>
                    <span className={`font-medium ${styles.textPrimary}`}>
                      {activeTab === 'hot' ? 'Hot Coffee' : 'Iced Coffee'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleCoffeeType(activeTab as 'hot' | 'iced')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      currentPrefs?.enabled
                        ? 'bg-blue-600'
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentPrefs?.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                {!currentPrefs?.enabled && (
                  <p className={`text-sm ${styles.textMuted} mt-2`}>
                    Enable to set preferences for {activeTab} coffee
                  </p>
                )}
              </div>

              {currentPrefs?.enabled ? (
                <>
                  {/* Quick Presets */}
                  <div>
                    <label className={`block text-sm font-medium ${styles.textPrimary} mb-2`}>Quick Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setBlackCoffee(activeTab as 'hot' | 'iced')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentPrefs?.milk === 'None' && currentPrefs?.sugar === 'None'
                            ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                            : `${styles.cardBg} ${styles.textPrimary} border ${styles.borderDefault}`
                        }`}
                      >
                        ⚫ Black
                      </button>
                      <button
                        onClick={() => {
                          updatePreference(activeTab as 'hot' | 'iced', 'milk', 'Cream');
                          updatePreference(activeTab as 'hot' | 'iced', 'milkAmount', '1');
                          updatePreference(activeTab as 'hot' | 'iced', 'sugar', '1 Sugar');
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentPrefs?.milk === 'Cream' && currentPrefs?.milkAmount === '1' && currentPrefs?.sugar === '1 Sugar'
                            ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                            : `${styles.cardBg} ${styles.textPrimary} border ${styles.borderDefault}`
                        }`}
                      >
                        ☕ Regular
                      </button>
                      <button
                        onClick={() => {
                          updatePreference(activeTab as 'hot' | 'iced', 'milk', 'Cream');
                          updatePreference(activeTab as 'hot' | 'iced', 'milkAmount', '2');
                          updatePreference(activeTab as 'hot' | 'iced', 'sugar', '2 Sugars');
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentPrefs?.milk === 'Cream' && currentPrefs?.milkAmount === '2' && currentPrefs?.sugar === '2 Sugars'
                            ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                            : `${styles.cardBg} ${styles.textPrimary} border ${styles.borderDefault}`
                        }`}
                      >
                        ☕☕ Double Double
                      </button>
                      <button
                        onClick={() => {
                          updatePreference(activeTab as 'hot' | 'iced', 'milk', 'Cream');
                          updatePreference(activeTab as 'hot' | 'iced', 'milkAmount', '3');
                          updatePreference(activeTab as 'hot' | 'iced', 'sugar', '3 Sugars');
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          currentPrefs?.milk === 'Cream' && currentPrefs?.milkAmount === '3' && currentPrefs?.sugar === '3 Sugars'
                            ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                            : `${styles.cardBg} ${styles.textPrimary} border ${styles.borderDefault}`
                        }`}
                      >
                        ☕☕☕ Triple Triple
                      </button>
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className={`block text-sm font-medium ${styles.textPrimary} mb-2`}>Size</label>
                    <div className="grid grid-cols-4 gap-2">
                      {SIZES.map(size => (
                        <button
                          key={size}
                          onClick={() => updatePreference(activeTab as 'hot' | 'iced', 'size', size)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            currentPrefs?.size === size
                              ? 'bg-blue-500 text-white'
                              : `${styles.cardBg} ${styles.textPrimary} border ${styles.borderDefault}`
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className={`block text-sm font-medium ${styles.textPrimary} mb-2`}>Type</label>
                    <select
                      value={currentPrefs?.type || ''}
                      onChange={(e) => updatePreference(activeTab as 'hot' | 'iced', 'type', e.target.value)}
                      className={`w-full p-3 rounded-lg ${styles.inputBg} ${styles.textPrimary} border ${styles.borderDefault} appearance-none bg-no-repeat bg-[length:20px] bg-[center_right_0.75rem]`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${theme === 'dark' ? '%23666' : '%23999'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`
                      }}
                    >
                      {COFFEE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Milk Type & Amount - Side by Side */}
                  <div>
                    <label className={`block text-sm font-medium ${styles.textPrimary} mb-2`}>Milk/Cream</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={currentPrefs?.milk || ''}
                        onChange={(e) => {
                          updatePreference(activeTab as 'hot' | 'iced', 'milk', e.target.value);
                          // Reset amount to None if milk type is None
                          if (e.target.value === 'None') {
                            updatePreference(activeTab as 'hot' | 'iced', 'milkAmount', 'None');
                          }
                        }}
                        className={`p-3 rounded-lg ${styles.inputBg} ${styles.textPrimary} border ${styles.borderDefault} appearance-none bg-no-repeat bg-[length:20px] bg-[center_right_0.75rem]`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${theme === 'dark' ? '%23666' : '%23999'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`
                        }}
                      >
                        {MILK_TYPES.map(milk => (
                          <option key={milk} value={milk}>{milk}</option>
                        ))}
                      </select>
                      
                      {currentPrefs?.milk !== 'None' && (
                        <select
                          value={currentPrefs?.milkAmount || '1'}
                          onChange={(e) => updatePreference(activeTab as 'hot' | 'iced', 'milkAmount', e.target.value)}
                          className={`p-3 rounded-lg ${styles.inputBg} ${styles.textPrimary} border ${styles.borderDefault} appearance-none bg-no-repeat bg-[length:20px] bg-[center_right_0.75rem]`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${theme === 'dark' ? '%23666' : '%23999'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`
                          }}
                        >
                          {MILK_AMOUNTS.slice(1).map(amount => (
                            <option key={amount} value={amount}>{amount}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Sugar */}
                  <div>
                    <label className={`block text-sm font-medium ${styles.textPrimary} mb-2`}>Sugar</label>
                    <select
                      value={currentPrefs?.sugar || ''}
                      onChange={(e) => updatePreference(activeTab as 'hot' | 'iced', 'sugar', e.target.value)}
                      className={`w-full p-3 rounded-lg ${styles.inputBg} ${styles.textPrimary} border ${styles.borderDefault} appearance-none bg-no-repeat bg-[length:20px] bg-[center_right_0.75rem]`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${theme === 'dark' ? '%23666' : '%23999'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`
                      }}
                    >
                      {SUGAR_OPTIONS.map(sugar => (
                        <option key={sugar} value={sugar}>{sugar}</option>
                      ))}
                    </select>
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <label className={`block text-sm font-medium ${styles.textPrimary} mb-2`}>Special Instructions</label>
                    <textarea
                      value={currentPrefs?.notes || ''}
                      onChange={(e) => updatePreference(activeTab as 'hot' | 'iced', 'notes', e.target.value)}
                      placeholder="Any special requests? (e.g., extra hot, decaf, whipped cream, extra shot)"
                      rows={2}
                      className={`w-full p-3 rounded-lg ${styles.inputBg} ${styles.textPrimary} border ${styles.borderDefault}`}
                    />
                  </div>

                  {/* Preview */}
                  <div className={`p-3 rounded-lg ${styles.secondaryBg}`}>
                    <p className={`text-sm font-medium ${styles.textPrimary}`}>
                      {activeTab === 'hot' ? '🔥' : '🧊'} {currentPrefs?.size} {currentPrefs?.type}
                    </p>
                    <p className={`text-xs ${styles.textSecondary} mt-1`}>
                      {currentPrefs?.milk === 'None' && currentPrefs?.sugar === 'None' ? (
                        'Black'
                      ) : (
                        <>
                          {currentPrefs?.milk !== 'None' && (
                            <>
                              {currentPrefs?.milkAmount !== 'None' && currentPrefs?.milkAmount !== '1' 
                                ? `${currentPrefs?.milkAmount} ${currentPrefs?.milk}`
                                : currentPrefs?.milk
                              }
                            </>
                          )}
                          {currentPrefs?.milk !== 'None' && currentPrefs?.sugar !== 'None' && ', '}
                          {currentPrefs?.sugar !== 'None' && currentPrefs?.sugar}
                        </>
                      )}
                    </p>
                    {currentPrefs?.notes && (
                      <p className={`text-xs ${styles.textMuted} mt-1 italic`}>"{currentPrefs.notes}"</p>
                    )}
                  </div>
                </>
              ) : null}
            </>
          ) : activeTab === 'places' ? (
            <>
              <div className="space-y-4">
                <p className={`text-sm ${styles.textSecondary}`}>
                  Set your preferred coffee places and custom orders
                </p>
                
                {COFFEE_PLACES.map(place => (
                  <div key={place.id} className={`p-4 rounded-lg border ${styles.borderDefault}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{place.icon}</span>
                        <span className={`font-medium ${styles.textPrimary}`}>{place.name}</span>
                      </div>
                      <button
                        onClick={() => togglePlace(place.id as keyof CoffeePreferences['places'])}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          preferences.places?.[place.id as keyof CoffeePreferences['places']]?.enabled
                            ? 'bg-green-500 text-white'
                            : `${styles.cardBg} ${styles.textPrimary} border ${styles.borderDefault}`
                        }`}
                      >
                        {preferences.places?.[place.id as keyof CoffeePreferences['places']]?.enabled ? 'Enabled' : 'Enable'}
                      </button>
                    </div>
                    
                    {preferences.places?.[place.id as keyof CoffeePreferences['places']]?.enabled && (
                      <div>
                        <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
                          Custom Order
                        </label>
                        <textarea
                          value={preferences.places?.[place.id as keyof CoffeePreferences['places']]?.customOrder || ''}
                          onChange={(e) => updatePlaceOrder(place.id as keyof CoffeePreferences['places'], e.target.value)}
                          placeholder={`e.g., "Large double-double" or "Venti iced caramel macchiato"`}
                          rows={2}
                          className={`w-full p-2 text-sm rounded-lg ${styles.inputBg} ${styles.textPrimary} border ${styles.borderDefault}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        {(!hasExistingPreferences || isEditMode) && (
          <div className={`p-4 border-t ${styles.borderDefault}`}>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                isSaving || isLoading
                  ? styles.buttonDisabled
                  : `${styles.buttonPrimary} active:scale-[0.98]`
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Coffee Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}