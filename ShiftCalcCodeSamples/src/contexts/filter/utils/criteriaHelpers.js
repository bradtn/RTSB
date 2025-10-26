// src/contexts/filter/utils/criteriaHelpers.js
// Functions for manipulating and validating criteria

// Validate and normalize criteria
export function validateCriteria(criteria) {
  if (!criteria) return null;
  
  try {
    // Create a validated copy with proper defaults for everything
    const validatedCriteria = {
      selectedGroups: criteria.selectedGroups || [],
      dayOffDates: criteria.dayOffDates || [],
      selectedShiftCodes: criteria.selectedShiftCodes || [],
      selectedShiftCategories: criteria.selectedShiftCategories || [],
      selectedShiftLengths: criteria.selectedShiftLengths || [],
      shiftCategoryIntent: criteria.shiftCategoryIntent || 'any', // 'any' or 'mix'
      province: criteria.province || null, // Added for holiday support
      weights: {
        groupWeight: Number(criteria.weights?.groupWeight ?? 1),
        daysWeight: Number(criteria.weights?.daysWeight ?? 1),
        shiftWeight: Number(criteria.weights?.shiftWeight ?? 1),
        blocks5dayWeight: Number(criteria.weights?.blocks5dayWeight ?? 0),
        blocks4dayWeight: Number(criteria.weights?.blocks4dayWeight ?? 0),
        weekendWeight: Number(criteria.weights?.weekendWeight ?? 1),
        saturdayWeight: Number(criteria.weights?.saturdayWeight ?? 1),
        sundayWeight: Number(criteria.weights?.sundayWeight ?? 1)
      }
    };
    
    // Fix any potential date issues
    if (validatedCriteria.dayOffDates) {
      const validatedDates = Array.isArray(validatedCriteria.dayOffDates)
        ? validatedCriteria.dayOffDates
            .filter(d => d !== null && d !== undefined)
            .map(d => {
              try {
                return d instanceof Date ? d : new Date(d);
              } catch (e) {
                console.error("Invalid date encountered:", d, e);
                return null;
              }
            })
            .filter(d => d instanceof Date && !isNaN(d.getTime()))
        : [];
      
      validatedCriteria.dayOffDates = validatedDates;
    }
    
    return validatedCriteria;
  } catch (error) {
    console.error("Error validating criteria:", error);
    return null;
  }
}

// Helper to expand shift categories and lengths to specific shift codes
export function expandShiftCategoriesAndLengths(criteria, shiftCodes) {
  if (!criteria || !criteria.selectedShiftCategories || !criteria.selectedShiftLengths) {
    console.warn("No criteria for expanding categories and lengths");
    return [];
  }
  
  if (!criteria.selectedShiftCategories.length && !criteria.selectedShiftLengths.length) {
    console.log("No categories or lengths selected to expand");
    return [];
  }
  
  console.log("Expanding categories:", criteria.selectedShiftCategories);
  console.log("Expanding lengths:", criteria.selectedShiftLengths);
  console.log("Available shift codes:", shiftCodes ? shiftCodes.length : 0);
  
  const expanded = shiftCodes
    .filter(code => 
      (criteria.selectedShiftCategories.length === 0 || 
       criteria.selectedShiftCategories.includes(code.category)) &&
      (criteria.selectedShiftLengths.length === 0 || 
       criteria.selectedShiftLengths.includes(code.length))
    )
    .map(code => code.code);
    
  console.log("Expanded shift codes:", expanded);
  return expanded;
}
