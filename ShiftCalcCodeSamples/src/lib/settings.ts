// src/lib/settings.ts

// Default settings for fallback when admin settings are not available
export const DEFAULT_SETTINGS = {
  startDate: "2025-10-09",
  numCycles: 3
};

// NO DEFAULT SETTINGS - Everything must come from admin panel
// If no settings exist, the system should prompt admin to configure them

// For server-side usage in API routes
export async function getSettingsFromDB() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const settings = await prisma.systemSettings.findUnique({
      where: {
        setting_key: 'app_settings'
      }
    });
    
    if (settings && settings.setting_value) {
      // Handle both JSON string and object formats
      const settingValue = typeof settings.setting_value === 'string' 
        ? JSON.parse(settings.setting_value) 
        : settings.setting_value;
      return settingValue;
    }
    
    throw new Error('No admin settings configured. Please configure start date and cycles in Admin Settings.');
  } catch (error) {
    console.error('Error fetching settings from DB (server):', error);
    throw new Error('Failed to load admin settings. Please check database connection and ensure admin settings are configured.');
  }
}

/**
 * Get the start date for the schedule calculation
 */
export function getStartDate(): string {
  // This function should not be used - all components should fetch from admin settings API
  throw new Error('getStartDate() is deprecated. Use admin settings API instead.');
}

/**
 * Get the number of cycles for the schedule calculation
 */
export function getNumCycles(): number {
  // This function should not be used - all components should fetch from admin settings API
  throw new Error('getNumCycles() is deprecated. Use admin settings API instead.');
}

/**
 * Update schedule settings
 */
export async function updateSettings(settings: { startDate?: string; numCycles?: number }) {
  try {
    // Save to database via API
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate: settings.startDate,
        numCycles: settings.numCycles
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Failed to save settings: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}