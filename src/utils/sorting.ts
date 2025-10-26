/**
 * Natural sorting function for line numbers with locale support
 * @param a First string to compare
 * @param b Second string to compare
 * @returns Comparison result for sorting
 */
export const naturalSort = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, { 
    numeric: true, 
    sensitivity: 'base',
    caseFirst: 'upper'
  });
};