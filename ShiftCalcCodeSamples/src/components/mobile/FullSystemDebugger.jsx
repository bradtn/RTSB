// src/components/mobile/FullSystemDebugger.jsx
"use client";
import { useState, useEffect } from "react";
import { calculateScheduleScore } from "@/lib/scheduler/scoring";

// Helper function to expand shift categories and lengths into specific codes
function expandShiftCategoriesAndLengths(criteria, shiftCodes) {
  if (!criteria.selectedShiftCategories.length && !criteria.selectedShiftLengths.length) return [];
  
  return shiftCodes
    .filter(code => 
      (criteria.selectedShiftCategories.length === 0 || 
       criteria.selectedShiftCategories.includes(code.category)) &&
      (criteria.selectedShiftLengths.length === 0 || 
       criteria.selectedShiftLengths.includes(code.length))
    )
    .map(code => code.code);
}

export default function FullSystemDebugger() {
  const [schedules, setSchedules] = useState([]);
  const [shiftCodes, setShiftCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading...");
  const [testResults, setTestResults] = useState(null);
  
  // Available options (dynamically populated)
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableLengths, setAvailableLengths] = useState([]);
  
  // Test criteria
  const [criteria, setCriteria] = useState({
    selectedGroups: ["COMMERCIAL"],
    dayOffDates: [],
    selectedShiftCodes: [],
    selectedShiftCategories: ["Afternoons"],
    selectedShiftLengths: ["10.5 Hour Shift"],
    weights: {
      groupWeight: 5.0,
      daysWeight: 1.0,
      shiftWeight: 5.0,
      blocks5dayWeight: 1.0,
      blocks4dayWeight: 1.0,
      weekendWeight: 1.0,
      saturdayWeight: 1.0,
      sundayWeight: 1.0
    }
  });

  // Fetch schedules and shift codes on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setMessage("Fetching shift codes...");
        
        // Fetch shift codes
        const codesResponse = await fetch("/api/shift-codes");
        if (!codesResponse.ok) throw new Error("Failed to fetch shift codes");
        const codesData = await codesResponse.json();
        setShiftCodes(codesData);
        
        // Extract unique categories and lengths
        const categories = [...new Set(codesData.map(code => code.category))].filter(Boolean).sort();
        const lengths = [...new Set(codesData.map(code => code.length))].filter(Boolean).sort();
        
        setAvailableCategories(categories);
        setAvailableLengths(lengths);
        
        setMessage("Fetching schedules...");
        
        // Fetch schedules
        const schedulesResponse = await fetch("/api/schedules");
        if (!schedulesResponse.ok) throw new Error("Failed to fetch schedules");
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData);
        
        // Extract unique groups
        const groups = [...new Set(schedulesData.map(s => s.GROUP))].filter(Boolean).sort();
        setAvailableGroups(groups);
        
        setMessage(`Loaded ${schedulesData.length} schedules and ${codesData.length} shift codes.`);
        
        // Auto-run the test once data is loaded
        setTimeout(() => {
          runComparisonTest();
        }, 500);
      } catch (error) {
        setMessage(`Error: ${error.message}`);
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Run the comparison test
  const runComparisonTest = () => {
    if (!schedules.length || !shiftCodes.length) {
      setMessage("Please wait for schedules and shift codes to load first.");
      return;
    }
    
    try {
      setLoading(true);
      setMessage("Running comparison test...");
      
      // Test with and without category expansion
      const results = {
        withExpansion: [],
        withoutExpansion: [],
        mobileImplementationFixed: [] // New test case
      };
      
      // Get expanded codes based on criteria
      const expandedCodes = expandShiftCategoriesAndLengths(criteria, shiftCodes);
      console.log(`Expanded ${criteria.selectedShiftCategories.length} categories and ${criteria.selectedShiftLengths.length} lengths into ${expandedCodes.length} specific shift codes:`, expandedCodes);
      
      // List the expanded codes with details
      expandedCodes.forEach(code => {
        const details = shiftCodes.find(sc => sc.code === code);
        console.log(`Expanded code: ${code}, Category: ${details?.category}, Length: ${details?.length}`);
      });
      
      // Create processed criteria with expansion
      const processedCriteria = {
        ...criteria,
        selectedShiftCodes: [...criteria.selectedShiftCodes, ...expandedCodes]
      };
      
      // Log some diagnostics
      console.log("Testing criteria:", criteria);
      console.log("Processed criteria:", processedCriteria);
      
      // Process all schedules with expansion (Desktop style)
      results.withExpansion = schedules
        .map(schedule => {
          try {
            const result = calculateScheduleScore(schedule, processedCriteria);
            return {
              id: schedule.id,
              line: String(schedule.LINE),
              group: schedule.GROUP || "Unknown",
              matchScore: result.score,
              weekendsOn: result.weekendsOn,
              saturdaysOn: result.saturdaysOn,
              sundaysOn: result.sundaysOn,
              blocks5day: result.blocks5day,
              blocks4day: result.blocks4day,
              explanation: result.explanation
            };
          } catch (error) {
            console.error(`Error processing schedule ${schedule.id}:`, error);
            return null;
          }
        })
        .filter(schedule => schedule && schedule.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);  // Take top 10
      
      // Process all schedules without expansion (Mobile style)
      results.withoutExpansion = schedules
        .map(schedule => {
          try {
            const result = calculateScheduleScore(schedule, criteria);
            return {
              id: schedule.id,
              line: String(schedule.LINE),
              group: schedule.GROUP || "Unknown",
              matchScore: result.score,
              weekendsOn: result.weekendsOn,
              saturdaysOn: result.saturdaysOn,
              sundaysOn: result.sundaysOn,
              blocks5day: result.blocks5day,
              blocks4day: result.blocks4day,
              explanation: result.explanation
            };
          } catch (error) {
            console.error(`Error processing schedule ${schedule.id}:`, error);
            return null;
          }
        })
        .filter(schedule => schedule && schedule.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);  // Take top 10
      
      // IMPLEMENTATION OF MOBILE FIX
      // This simulates what would happen in MobileFilterFlow.jsx after the fix
      
      // Mobile implementation with fix
      // Step 1: Expand categories and lengths to shift codes (the missing step)
      const mobileExpandedCodes = expandShiftCategoriesAndLengths(criteria, shiftCodes);
      
      // Step 2: Create processed criteria
      const mobileProcessedCriteria = {
        ...criteria,
        selectedShiftCodes: [...criteria.selectedShiftCodes, ...mobileExpandedCodes]
      };
      
      // Step 3: Process all schedules using the fixed approach
      results.mobileImplementationFixed = schedules
        .map(schedule => {
          try {
            const result = calculateScheduleScore(schedule, mobileProcessedCriteria);
            return {
              id: schedule.id,
              line: String(schedule.LINE),
              group: schedule.GROUP || "Unknown",
              matchScore: result.score,
              weekendsOn: result.weekendsOn,
              saturdaysOn: result.saturdaysOn,
              sundaysOn: result.sundaysOn,
              blocks5day: result.blocks5day,
              blocks4day: result.blocks4day,
              explanation: result.explanation
            };
          } catch (error) {
            console.error(`Error processing schedule ${schedule.id}:`, error);
            return null;
          }
        })
        .filter(schedule => schedule && schedule.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);  // Take top 10
      
      // Log some stats about the results
      console.log(`Found ${results.withExpansion.length} matching schedules with expansion`);
      console.log(`Found ${results.withoutExpansion.length} matching schedules without expansion`);
      console.log(`Found ${results.mobileImplementationFixed.length} matching schedules with mobile fix`);
      
      // Log the top results
      if (results.withExpansion.length > 0) {
        console.log("Top result with expansion:", results.withExpansion[0]);
      }
      if (results.withoutExpansion.length > 0) {
        console.log("Top result without expansion:", results.withoutExpansion[0]);
      }
      if (results.mobileImplementationFixed.length > 0) {
        console.log("Top result with mobile fix:", results.mobileImplementationFixed[0]);
      }
      
      setTestResults(results);
      setMessage(`Test completed. Found ${results.withExpansion.length} matches with expansion, ${results.withoutExpansion.length} without.`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Update criteria when form changes
  const updateCriteria = (field, value) => {
    setCriteria({
      ...criteria,
      [field]: value
    });
  };

  // Handle selection change
  const handleSelection = (field, value) => {
    if (field === 'selectedGroups') {
      updateCriteria(field, value ? [value] : []);
    } else if (field === 'selectedShiftCategories') {
      updateCriteria(field, value ? [value] : []);
    } else if (field === 'selectedShiftLengths') {
      updateCriteria(field, value ? [value] : []);
    }
  };

  // Update weights
  const updateWeight = (weightField, value) => {
    setCriteria({
      ...criteria,
      weights: {
        ...criteria.weights,
        [weightField]: value
      }
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Full System Debugger</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <p>Status: {message}</p>
        {loading && (
          <div className="flex justify-center mt-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Criteria</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Group selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <select
              className="w-full p-2 border rounded-md"
              value={criteria.selectedGroups[0] || ""}
              onChange={(e) => handleSelection('selectedGroups', e.target.value)}
            >
              <option value="">Any Group</option>
              {availableGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          
          {/* Group weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Weight: {criteria.weights.groupWeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={criteria.weights.groupWeight}
              onChange={(e) => updateWeight('groupWeight', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* Shift category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Category</label>
            <select
              className="w-full p-2 border rounded-md"
              value={criteria.selectedShiftCategories[0] || ""}
              onChange={(e) => handleSelection('selectedShiftCategories', e.target.value)}
            >
              <option value="">Any Category</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Shift length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Length</label>
            <select
              className="w-full p-2 border rounded-md"
              value={criteria.selectedShiftLengths[0] || ""}
              onChange={(e) => handleSelection('selectedShiftLengths', e.target.value)}
            >
              <option value="">Any Length</option>
              {availableLengths.map(length => (
                <option key={length} value={length}>{length}</option>
              ))}
            </select>
          </div>
          
          {/* Shift weight */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift Weight: {criteria.weights.shiftWeight.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={criteria.weights.shiftWeight}
              onChange={(e) => updateWeight('shiftWeight', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        <button
          onClick={runComparisonTest}
          disabled={loading || !schedules.length || !shiftCodes.length}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
        >
          Run Comparison Test
        </button>
      </div>
      
      {testResults && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h3 className="text-lg font-semibold mb-2">Test Results</h3>
            <p className="mb-2">Comparing all three implementations for the same criteria.</p>
            <div className="mt-2 text-sm">
              <p className="font-medium">Test Details:</p>
              <ul className="list-disc ml-5 mt-1">
                <li>Selected Group: {criteria.selectedGroups.join(", ") || "None"}</li>
                <li>Selected Categories: {criteria.selectedShiftCategories.join(", ") || "None"}</li>
                <li>Selected Lengths: {criteria.selectedShiftLengths.join(", ") || "None"}</li>
                <li>Group Weight: {criteria.weights.groupWeight.toFixed(1)}</li>
                <li>Shift Weight: {criteria.weights.shiftWeight.toFixed(1)}</li>
                <li>Expanded to {expandShiftCategoriesAndLengths(criteria, shiftCodes).length} specific shift codes</li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Desktop Style Results (With Expansion) */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-green-600">
                Desktop Style
              </h3>
              {testResults.withExpansion.length > 0 ? (
                <div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-2 text-left">Rank</th>
                        <th className="p-2 text-left">Line</th>
                        <th className="p-2 text-left">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.withExpansion.map((schedule, idx) => (
                        <tr key={schedule.id} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="p-2">{idx + 1}</td>
                          <td className="p-2 font-medium">{schedule.line}</td>
                          <td className="p-2">{schedule.matchScore.toFixed(1)}</td>
                        </tr>
                      )).slice(0, 5)}
                    </tbody>
                  </table>
                  
                  {/* Top result details */}
                  {testResults.withExpansion.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                      <h4 className="font-medium mb-2">Top Result:</h4>
                      <p>Line: {testResults.withExpansion[0].line}</p>
                      <p>Score: {testResults.withExpansion[0].matchScore.toFixed(1)}</p>
                      <p className="mt-2 text-xs">Explanation:</p>
                      <p className="text-xs">{testResults.withExpansion[0].explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No matching schedules found.</p>
              )}
            </div>
            
            {/* Mobile Style Results (Without Expansion) */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-red-600">
                Current Mobile (Wrong)
              </h3>
              {testResults.withoutExpansion.length > 0 ? (
                <div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-2 text-left">Rank</th>
                        <th className="p-2 text-left">Line</th>
                        <th className="p-2 text-left">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.withoutExpansion.map((schedule, idx) => (
                        <tr key={schedule.id} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="p-2">{idx + 1}</td>
                          <td className="p-2 font-medium">{schedule.line}</td>
                          <td className="p-2">{schedule.matchScore.toFixed(1)}</td>
                        </tr>
                      )).slice(0, 5)}
                    </tbody>
                  </table>
                  
                  {/* Top result details */}
                  {testResults.withoutExpansion.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                      <h4 className="font-medium mb-2">Top Result:</h4>
                      <p>Line: {testResults.withoutExpansion[0].line}</p>
                      <p>Score: {testResults.withoutExpansion[0].matchScore.toFixed(1)}</p>
                      <p className="mt-2 text-xs">Explanation:</p>
                      <p className="text-xs">{testResults.withoutExpansion[0].explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No matching schedules found.</p>
              )}
            </div>
            
            {/* Mobile Implementation Fixed */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-purple-600">
                Mobile with Fix
              </h3>
              {testResults.mobileImplementationFixed && testResults.mobileImplementationFixed.length > 0 ? (
                <div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-2 text-left">Rank</th>
                        <th className="p-2 text-left">Line</th>
                        <th className="p-2 text-left">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.mobileImplementationFixed.map((schedule, idx) => (
                        <tr key={schedule.id} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="p-2">{idx + 1}</td>
                          <td className="p-2 font-medium">{schedule.line}</td>
                          <td className="p-2">{schedule.matchScore.toFixed(1)}</td>
                        </tr>
                      )).slice(0, 5)}
                    </tbody>
                  </table>
                  
                  {/* Top result details */}
                  {testResults.mobileImplementationFixed.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                      <h4 className="font-medium mb-2">Top Result:</h4>
                      <p>Line: {testResults.mobileImplementationFixed[0].line}</p>
                      <p>Score: {testResults.mobileImplementationFixed[0].matchScore.toFixed(1)}</p>
                      <p className="mt-2 text-xs">Explanation:</p>
                      <p className="text-xs">{testResults.mobileImplementationFixed[0].explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No matching schedules found.</p>
              )}
            </div>
          </div>
          
          {/* Implementation fix */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h3 className="text-lg font-semibold mb-2">Implementation Fix</h3>
            <p className="mb-2">To fix the mobile app, add the category expansion function to <code className="bg-gray-200 px-1 rounded">MobileFilterFlow.jsx</code>:</p>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">
{`// In MobileFilterFlow.jsx

// Add this function:
const expandShiftCategoriesAndLengths = () => {
  if (!criteria.selectedShiftCategories.length && !criteria.selectedShiftLengths.length) return [];
  
  return shiftCodes
    .filter(code => 
      (criteria.selectedShiftCategories.length === 0 || 
       criteria.selectedShiftCategories.includes(code.category)) &&
      (criteria.selectedShiftLengths.length === 0 || 
       criteria.selectedShiftLengths.includes(code.length))
    )
    .map(code => code.code);
};

// Then modify the applyFilters function:
const applyFilters = () => {
  setIsLoading(true);
  
  try {
    console.log("Applying filters with criteria:", criteria);
    
    // Expand categories and lengths into specific shift codes
    const expandedCodes = expandShiftCategoriesAndLengths();
    const processedCriteria = {
      ...criteria,
      selectedShiftCodes: [...criteria.selectedShiftCodes, ...expandedCodes]
    };
    
    // Then use processedCriteria instead of criteria
    const processed = schedules
      .map(schedule => {
        const result = calculateScheduleScore(schedule, processedCriteria);
        // ... rest of function unchanged
      });
      
    // ... rest of function unchanged
  } catch (error) {
    // ... error handling unchanged
  }
};`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}