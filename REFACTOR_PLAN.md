# BidLinesClient.tsx Refactoring Plan

## Current Status
- **File Size**: 1,882 lines
- **Complexity**: Very high with multiple concerns mixed together
- **Components Extracted**: ModernToggle, ModernSelect, TypeScript types
- **Utilities Extracted**: sorting, localization, constants

## Refactoring Strategy

### Phase 1: Core Extractions (COMPLETED ✅)
- [x] TypeScript interfaces and types → `types/BidLinesClient.types.ts`
- [x] UI components → `components/UI/ModernToggle.tsx`, `components/UI/ModernSelect.tsx`  
- [x] Utility functions → `utils/sorting.ts`, `utils/localization.ts`
- [x] Constants → `constants/bidLineCategories.ts`, `constants/permissions.ts`

### Phase 2: Hook Extractions (IN PROGRESS ⏳)
- [x] Data fetching → `hooks/useBidLineData.ts`
- [x] Metric settings → `hooks/useMetricSettings.ts` 
- [x] Filter state → `hooks/useBidLineFilters.ts`
- [x] UI state → `hooks/useBidLineUI.ts`
- [ ] Mutations → `hooks/useBidLineMutations.ts`
- [ ] Day-off matching → `hooks/useDayOffMatches.ts`
- [ ] WebSocket/realtime → `hooks/useRealtimeUpdates.ts`

### Phase 3: Component Extractions (PENDING 📋)
- [ ] Filter section → `components/BidLine/BidLineFilters.tsx`
- [ ] Favorites section → `components/BidLine/FavoritesSection.tsx`
- [ ] Operation controls → `components/BidLine/OperationControls.tsx`
- [ ] Main content → `components/BidLine/BidLineContent.tsx`

### Phase 4: Business Logic (PENDING 📋)
- [ ] Grouping logic → `utils/bidLineGrouping.ts`
- [ ] Filter functions → `utils/bidLineFilters.ts` 
- [ ] Operation management → `utils/operationControls.ts`

### Phase 5: Integration & Testing (PENDING 📋)
- [ ] Update main BidLinesClient to use all extracted modules
- [ ] Ensure TypeScript compliance
- [ ] Test all functionality works correctly
- [ ] Performance verification

## Critical Dependencies
- React Query for data fetching
- WebSocket for real-time updates  
- Session management for auth
- Translation system
- Toast notifications

## Risk Mitigation
- Keep backup copy of working version
- Extract incrementally with testing at each step
- Maintain exact naming and behavior
- Preserve all TypeScript types