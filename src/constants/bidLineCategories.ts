/**
 * Standard bid line categories used throughout the application
 */
export const BID_LINE_CATEGORIES = [
  'Days', 
  'Late Days', 
  'Mid Days', 
  'Afternoons', 
  'Midnights'
] as const;

export type BidLineCategory = typeof BID_LINE_CATEGORIES[number];