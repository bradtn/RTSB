# Adding Translations Guide

## Overview
When adding new UI features with translations, you must update translations in the correct order through the entire data flow chain.

## Translation Flow
```
Translation Files (JSON) 
    ↓
Page Component (page.tsx) 
    ↓
Client Component (BidLinesClient.tsx) 
    ↓
Child Components (BidLineCard, Modals, etc.)
```

## Required Steps for New Translations

### 1. Add to Translation Files
Add your translations to both language files:
- `/public/locales/en/common.json`
- `/public/locales/fr/common.json`

Example:
```json
{
  "scheduleMetrics": {
    "newFeature": "New Feature",
    "newFeatureTitle": "New Feature Title",
    "newFeatureDescription": "Description here",
    "newFeatureExplanation": "Explanation here"
  }
}
```

### 2. Add to Page Component
In `/src/app/[locale]/bid-lines/page.tsx`, add to the translations object:

```typescript
const translations = {
  // ...existing translations
  scheduleMetrics: {
    // ...existing metrics
    newFeature: t('scheduleMetrics.newFeature'),
    newFeatureTitle: t('scheduleMetrics.newFeatureTitle'),
    newFeatureDescription: t('scheduleMetrics.newFeatureDescription'),
    newFeatureExplanation: t('scheduleMetrics.newFeatureExplanation'),
  }
}
```

### 3. Pass Through Client Component
In `/src/app/[locale]/bid-lines/BidLinesClient.tsx`, we now use the spread operator to automatically pass all translations:

```typescript
<BidLineCard
  translations={{
    // ...other translations
    ...translations.scheduleMetrics,  // This passes ALL scheduleMetrics translations
    // ...other translations
  }}
/>
```

**✅ GOOD:** Using spread operator - new translations automatically flow through
**❌ BAD:** Manually mapping each field - requires updates for every new translation

### 4. Update Component Interfaces
Update TypeScript interfaces to include new translation keys:

```typescript
interface MetricModalProps {
  translations: {
    // ...existing fields
    newFeature?: string;
    newFeatureTitle?: string;
    newFeatureDescription?: string;
    newFeatureExplanation?: string;
  }
}
```

## Best Practices

### DO:
- Use spread operators (`...translations.scheduleMetrics`) to pass entire translation objects
- Group related translations together in the JSON files
- Keep translation keys consistent across all languages
- Test in both English and French after adding translations

### DON'T:
- Don't manually map individual translation fields in intermediate components
- Don't hardcode fallback strings in components (put them in translation files)
- Don't forget to update TypeScript interfaces

## Testing Checklist
After adding new translations:
- [ ] Added to `/public/locales/en/common.json`
- [ ] Added to `/public/locales/fr/common.json`
- [ ] Added to page.tsx translations object
- [ ] Verified spread operator is used in BidLinesClient
- [ ] Updated TypeScript interfaces
- [ ] Tested in English mode
- [ ] Tested in French mode
- [ ] No hardcoded English text appears in French mode

## Common Issues and Solutions

### Issue: Translations show in English even in French mode
**Cause:** Translation not being passed through one of the components
**Solution:** Check the entire flow from page.tsx → BidLinesClient → Component

### Issue: TypeScript errors about missing properties
**Cause:** Interface not updated with new translation keys
**Solution:** Add the new keys to the component's translation interface

### Issue: Translation is undefined
**Cause:** Translation key not added to page.tsx
**Solution:** Add the translation to the page.tsx translations object

## Architecture Recommendation
Consider implementing a translation context provider that automatically provides all translations to child components, eliminating the need to pass translations through props at every level.