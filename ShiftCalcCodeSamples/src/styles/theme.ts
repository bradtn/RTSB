// src/styles/theme.ts
export const themes = {
    dark: {
      // Backgrounds - Modern dark theme with subtle purple undertones
      bodyBg: "bg-gray-950", // Deeper, richer dark background
      pageBg: "bg-gray-950", // Consistent with body
      cardBg: "bg-gray-900/90 backdrop-blur-sm", // Slightly transparent with blur
      secondaryBg: "bg-gray-800/50 backdrop-blur-sm", // Softer secondary with transparency
      tertiaryBg: "bg-gray-700/30 backdrop-blur-sm", // Very subtle tertiary
      
      // Borders - Subtle and modern
      borderDefault: "border-gray-800",
      borderLight: "border-gray-700/50",
      borderFocus: "border-indigo-500",
      
      // Headers (by color) - Vibrant but sophisticated
      blueHeader: "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-sm text-blue-100 border-b border-blue-500/20",
      purpleHeader: "bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm text-purple-100 border-b border-purple-500/20",
      orangeHeader: "bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm text-orange-100 border-b border-orange-500/20",
      indigoHeader: "bg-gradient-to-r from-indigo-600/20 to-blue-600/20 backdrop-blur-sm text-indigo-100 border-b border-indigo-500/20",
      slateHeader: "bg-gradient-to-r from-slate-700/40 to-gray-700/40 backdrop-blur-sm text-slate-100 border-b border-slate-600/20",
      amberHeader: "bg-gradient-to-r from-amber-600/20 to-yellow-600/20 backdrop-blur-sm text-amber-100 border-b border-amber-500/20",
      
      // Text colors - Better contrast
      textPrimary: "text-gray-50",
      textSecondary: "text-gray-300",
      textMuted: "text-gray-500",
      textAccent: "text-indigo-400",
      
      // Buttons - Modern with gradients
      buttonPrimary: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/20 transition-all duration-200",
      buttonSecondary: "bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 backdrop-blur-sm border border-gray-700/50",
      buttonDisabled: "bg-gray-800/50 text-gray-600 cursor-not-allowed",
      buttonDanger: "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/20",
      
      // Group buttons - Cleaner selection states
      groupButtonSelected: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/30",
      groupButtonUnselected: "bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 backdrop-blur-sm border border-gray-700/50",
      
      // Alerts/warnings - More modern approach
      warningBg: "bg-gradient-to-r from-amber-900/20 to-orange-900/20 backdrop-blur-sm",
      warningBorder: "border-amber-500/50",
      warningText: "text-amber-200",
      
      errorBg: "bg-gradient-to-r from-red-900/20 to-pink-900/20 backdrop-blur-sm",
      errorBorder: "border-red-500/50",
      errorText: "text-red-200",
      
      successBg: "bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm",
      successBorder: "border-emerald-500/50",
      successText: "text-emerald-200",
      
      // Stats cards - Vibrant gradients
      statBlue: "bg-gradient-to-br from-blue-600/20 to-indigo-600/20 text-blue-200 backdrop-blur-sm border border-blue-500/20",
      statTeal: "bg-gradient-to-br from-teal-600/20 to-cyan-600/20 text-teal-200 backdrop-blur-sm border border-teal-500/20",
      statCyan: "bg-gradient-to-br from-cyan-600/20 to-blue-600/20 text-cyan-200 backdrop-blur-sm border border-cyan-500/20",
      statEmerald: "bg-gradient-to-br from-emerald-600/20 to-green-600/20 text-emerald-200 backdrop-blur-sm border border-emerald-500/20",
      statGreen: "bg-gradient-to-br from-green-600/20 to-emerald-600/20 text-green-200 backdrop-blur-sm border border-green-500/20",
      
      // Additional elements
      inputBg: "bg-gray-900/50 backdrop-blur-sm border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
      hoverOverlay: "hover:bg-white/5",
      focusRing: "focus:ring-2 focus:ring-indigo-500/50",
    },
    light: {
      // Backgrounds - Clean and modern light theme
      bodyBg: "bg-gray-50", // Soft light background
      pageBg: "bg-gray-50", // Consistent with body
      cardBg: "bg-white shadow-sm", // Clean white cards with subtle shadow
      secondaryBg: "bg-gray-100/80", // Soft secondary
      tertiaryBg: "bg-gray-50/50", // Very subtle tertiary
      
      // Borders - Clean and minimal
      borderDefault: "border-gray-200",
      borderLight: "border-gray-100",
      borderFocus: "border-indigo-500",
      
      // Headers (by color) - Soft pastels
      blueHeader: "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border-b border-blue-200",
      purpleHeader: "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 border-b border-purple-200",
      orangeHeader: "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-900 border-b border-orange-200",
      indigoHeader: "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 border-b border-indigo-200",
      slateHeader: "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-900 border-b border-slate-200",
      amberHeader: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border-b border-amber-200",
      
      // Text colors - Crisp and readable
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-700",
      textMuted: "text-gray-500",
      textAccent: "text-indigo-600",
      
      // Buttons - Clean with subtle gradients
      buttonPrimary: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/10 transition-all duration-200",
      buttonSecondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm",
      buttonDisabled: "bg-gray-100 text-gray-400 cursor-not-allowed",
      buttonDanger: "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-md shadow-red-500/10",
      
      // Group buttons - Clean selection states
      groupButtonSelected: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md",
      groupButtonUnselected: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm",
      
      // Alerts/warnings - Soft and friendly
      warningBg: "bg-gradient-to-r from-amber-50 to-orange-50",
      warningBorder: "border-amber-300",
      warningText: "text-amber-800",
      
      errorBg: "bg-gradient-to-r from-red-50 to-pink-50",
      errorBorder: "border-red-300",
      errorText: "text-red-800",
      
      successBg: "bg-gradient-to-r from-emerald-50 to-green-50",
      successBorder: "border-emerald-300",
      successText: "text-emerald-800",
      
      // Stats cards - Soft gradients
      statBlue: "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-900 border border-blue-200",
      statTeal: "bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-900 border border-teal-200",
      statCyan: "bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-900 border border-cyan-200",
      statEmerald: "bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-900 border border-emerald-200",
      statGreen: "bg-gradient-to-br from-green-50 to-emerald-50 text-green-900 border border-green-200",
      
      // Additional elements
      inputBg: "bg-white border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
      hoverOverlay: "hover:bg-gray-50",
      focusRing: "focus:ring-2 focus:ring-indigo-500/20",
    }
  };
  
  // Helper function for safe migration - will return the themed version if available, or fall back to the original
  export function themed(themeStyles, originalClassName, styleName) {
    if (!themeStyles || !styleName) return originalClassName;
    return themeStyles[styleName] || originalClassName;
  }