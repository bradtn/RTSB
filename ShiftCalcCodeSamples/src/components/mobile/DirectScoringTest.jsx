// src/components/mobile/DirectScoringTest.jsx - DEBUGGING VERSION WITH CATEGORY EXPANSION
"use client";
import { useState, useEffect } from "react";
import { calculateScheduleScore } from "@/lib/scheduler/scoring";

// Helper function to inspect shift codes in a schedule
function getShiftCodesFromSchedule(schedule) {
  const shiftCodes = [];
  
  for (const key in schedule) {
    if (key.startsWith('DAY_') && schedule[key] && schedule[key] !== '----') {
      const shiftCode = schedule[key];
      if (!shiftCodes.includes(shiftCode)) {
        shiftCodes.push(shiftCode);
      }
    }
  }
  
  return shiftCodes;
}

// Count occurrences of each shift code
function countShiftCodeOccurrences(schedule) {
  const counts = {};
  
  for (const key in schedule) {
    if (key.startsWith('DAY_') && schedule[key] && schedule[key] !== '----') {
      const shiftCode = schedule[key];
      counts[shiftCode] = (counts[shiftCode] || 0) + 1;
    }
  }
  
  return counts;
}

// NEW FUNCTION: Expand shift categories and lengths into specific codes
function expandShiftCategoriesAndLengths(selectedCategories, selectedLengths, shiftCodes) {
  if (!selectedCategories.length && !selectedLengths.length) return [];
  
  return shiftCodes
    .filter(code => 
      (selectedCategories.length === 0 || selectedCategories.includes(code.category)) &&
      (selectedLengths.length === 0 || selectedLengths.includes(code.length))
    )
    .map(code => code.code);
}

export default function DirectScoringTest() {
  const [schedule, setSchedule] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lineNumber, setLineNumber] = useState("72"); // Default to line 72
  const [message, setMessage] = useState("");
  const [shiftCodes, setShiftCodes] = useState([]);
  const [scheduleShifts, setScheduleShifts] = useState([]);
  const [shiftCodeDetails, setShiftCodeDetails] = useState({});
  const [shiftCategoryCounts, setShiftCategoryCounts] = useState({});
  const [debugView, setDebugView] = useState(false);
  const [expandCategories, setExpandCategories] = useState(true); // Default to expansion ON

  // Fetch all shift codes
  useEffect(() => {
    const fetchShiftCodes = async () => {
      try {
        const response = await fetch("/api/shift-codes");
        if (!response.ok) throw new Error("Failed to fetch shift codes");
        const data = await response.json();
        setShiftCodes(data);
        
        // Create a lookup map for quick reference
        const lookup = {};
        data.forEach(code => {
          lookup[code.code] = code;
        });
        setShiftCodeDetails(lookup);
        
        console.log("Loaded shift codes:", data.slice(0, 5));
        console.log("Sample categories:", [...new Set(data.map(code => code.category))].slice(0, 10));
      } catch (error) {
        console.error("Error fetching shift codes:", error);
      }
    };
    
    fetchShiftCodes();
  }, []);

  // Fetch a specific schedule by line number
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setMessage(`Fetching schedule for line ${lineNumber}...`);
      
      // First get all schedules
      const response = await fetch("/api/schedules");
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }
      
      const allSchedules = await response.json();
      
      // Find the schedule with the matching line number
      const matchingSchedule = allSchedules.find(s => 
        String(s.LINE).trim() === String(lineNumber).trim()
      );
      
      if (!matchingSchedule) {
        setMessage(`No schedule found with line number ${lineNumber}`);
        setSchedule(null);
        return;
      }
      
      setSchedule(matchingSchedule);
      
      // Extract all shift codes from this schedule
      const codesInSchedule = getShiftCodesFromSchedule(matchingSchedule);
      setScheduleShifts(codesInSchedule);
      
      // Count occurrences of each code
      const codeCounts = countShiftCodeOccurrences(matchingSchedule);
      
      // Count by category if we have shift code details
      if (Object.keys(shiftCodeDetails).length > 0) {
        const categoryCount = {};
        let totalShifts = 0;
        
        for (const code in codeCounts) {
          const count = codeCounts[code];
          totalShifts += count;
          
          const details = shiftCodeDetails[code];
          if (details && details.category) {
            categoryCount[details.category] = (categoryCount[details.category] || 0) + count;
          } else {
            categoryCount["Unknown"] = (categoryCount["Unknown"] || 0) + count;
          }
        }
        
        setShiftCategoryCounts({
          counts: categoryCount,
          total: totalShifts
        });
        
        console.log("Shift category distribution:", categoryCount);
      }
      
      setMessage(`Loaded schedule for line ${lineNumber}. Contains ${codesInSchedule.length} unique shift codes.`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get shift info
  const getShiftInfo = (code) => {
    const shiftInfo = shiftCodes.find(s => s.code === code);
    return shiftInfo ? 
      `${code} (${shiftInfo.category || 'Unknown'}, ${shiftInfo.length || 'Unknown'})` : 
      `${code} (Unknown)`;
  };

  // Test scoring with different criteria
  const testScoring = () => {
    if (!schedule) {
      setMessage("No schedule loaded to test");
      return;
    }
    
    // Function to run a test and log detailed results
    const runDetailedTest = (testCase) => {
      console.group(`Running test: ${testCase.name}`);
      console.log("Original criteria:", testCase.criteria);
      
      let finalCriteria = {...testCase.criteria};
      
      // Apply category expansion if enabled
      if (expandCategories && (testCase.criteria.selectedShiftCategories.length > 0 || 
                              testCase.criteria.selectedShiftLengths.length > 0)) {
        const expandedCodes = expandShiftCategoriesAndLengths(
          testCase.criteria.selectedShiftCategories,
          testCase.criteria.selectedShiftLengths,
          shiftCodes
        );
        
        console.log(`Expanded ${testCase.criteria.selectedShiftCategories.length} categories and ${testCase.criteria.selectedShiftLengths.length} lengths into ${expandedCodes.length} specific shift codes:`, expandedCodes);
        
        finalCriteria = {
          ...finalCriteria,
          selectedShiftCodes: [...finalCriteria.selectedShiftCodes, ...expandedCodes]
        };
      }
      
      console.log("Final criteria after expansion:", finalCriteria);
      const result = calculateScheduleScore(schedule, finalCriteria);
      
      console.log("Result:", result);
      console.groupEnd();
      
      return {
        testName: testCase.name,
        score: result.score,
        explanation: result.explanation,
        raw: result,
        originalCriteria: testCase.criteria,
        finalCriteria: finalCriteria
      };
    };
    
    try {
      setMessage("Testing scoring with different criteria...");
      
      // Per your request: COMMERCIAL group with max weight, Afternoons + 10.5hr shift with max weight
      const testCases = [
        {
          name: "Desktop Style: COMMERCIAL + Afternoons + 10.5hr",
          criteria: {
            selectedGroups: ["COMMERCIAL"],
            dayOffDates: [],
            selectedShiftCodes: [],
            selectedShiftCategories: ["Afternoons"],
            selectedShiftLengths: ["10.5 Hour Shift"],
            weights: {
              groupWeight: 5.0,  // Maximum weight as requested
              daysWeight: 1.0,
              shiftWeight: 5.0,  // Maximum weight as requested
              blocks5dayWeight: 1.0,
              blocks4dayWeight: 1.0,
              weekendWeight: 1.0,
              saturdayWeight: 1.0,
              sundayWeight: 1.0
            }
          }
        },
        {
          name: "Mobile Style (no expansion): COMMERCIAL + Afternoons + 10.5hr",
          criteria: {
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
          }
        },
        {
          name: "Group Only (COMMERCIAL)",
          criteria: {
            selectedGroups: ["COMMERCIAL"],
            dayOffDates: [],
            selectedShiftCodes: [],
            selectedShiftCategories: [],
            selectedShiftLengths: [],
            weights: {
              groupWeight: 5.0,
              daysWeight: 1.0,
              shiftWeight: 1.0,
              blocks5dayWeight: 1.0,
              blocks4dayWeight: 1.0,
              weekendWeight: 1.0,
              saturdayWeight: 1.0,
              sundayWeight: 1.0
            }
          }
        },
        {
          name: "Categories Only (Afternoons)",
          criteria: {
            selectedGroups: [],
            dayOffDates: [],
            selectedShiftCodes: [],
            selectedShiftCategories: ["Afternoons"],
            selectedShiftLengths: [],
            weights: {
              groupWeight: 1.0,
              daysWeight: 1.0,
              shiftWeight: 5.0,
              blocks5dayWeight: 1.0,
              blocks4dayWeight: 1.0,
              weekendWeight: 1.0,
              saturdayWeight: 1.0,
              sundayWeight: 1.0
            }
          }
        },
        {
          name: "Shift Length Only (10.5hr)",
          criteria: {
            selectedGroups: [],
            dayOffDates: [],
            selectedShiftCodes: [],
            selectedShiftCategories: [],
            selectedShiftLengths: ["10.5 Hour Shift"],
            weights: {
              groupWeight: 1.0,
              daysWeight: 1.0,
              shiftWeight: 5.0,
              blocks5dayWeight: 1.0,
              blocks4dayWeight: 1.0,
              weekendWeight: 1.0,
              saturdayWeight: 1.0,
              sundayWeight: 1.0
            }
          }
        }
      ];
      
      // Temporarily disable category expansion for the "Mobile Style" test
      const savedExpansionSetting = expandCategories;
      
      // Run tests with expansion enabled for all except the explicitly mobile test
      const results = testCases.map((testCase, index) => {
        if (index === 1) { // Second test case is the Mobile Style
          setExpandCategories(false);
        } else {
          setExpandCategories(savedExpansionSetting);
        }
        return runDetailedTest(testCase);
      });
      
      // Restore original expansion setting
      setExpandCategories(savedExpansionSetting);
      
      setScoreResult(results);
      setMessage("Testing complete. Check browser console for detailed logs.");
    } catch (error) {
      setMessage(`Scoring error: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Direct Scoring Test (Category Expansion Debug)</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <p>Status: {message}</p>
      </div>
      
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={lineNumber}
          onChange={(e) => setLineNumber(e.target.value)}
          placeholder="Enter line number"
          className="px-3 py-2 border rounded-lg"
        />
        <button 
          onClick={fetchSchedule}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Fetch Schedule
        </button>
        <button 
          onClick={testScoring}
          disabled={!schedule}
          className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400"
        >
          Test Scoring
        </button>
        <button
          onClick={() => setDebugView(!debugView)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          {debugView ? "Hide Debug" : "Show Debug"}
        </button>
        <div className="flex items-center ml-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={expandCategories}
              onChange={() => setExpandCategories(!expandCategories)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Expand Categories (Desktop Style)</span>
          </label>
        </div>
      </div>
      
      {schedule && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Schedule Data</h2>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p>Line: {schedule.LINE}</p>
            <p>Group: {schedule.GROUP}</p>
            <p>Shift Codes: {scheduleShifts.map(code => getShiftInfo(code)).join(', ')}</p>
          </div>
          
          {/* Category distribution */}
          {Object.keys(shiftCategoryCounts.counts || {}).length > 0 && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">Shift Category Distribution</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(shiftCategoryCounts.counts).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span className="font-medium">{category}:</span>
                    <span>
                      {count} shifts ({Math.round((count / shiftCategoryCounts.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {debugView && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
              <div className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-auto max-h-[200px] font-mono text-sm">
                <p>Shift Code Details Map:</p>
                <pre>{JSON.stringify(shiftCodeDetails, null, 2)}</pre>
                <p>Category Counts:</p>
                <pre>{JSON.stringify(shiftCategoryCounts, null, 2)}</pre>
              </div>
            </div>
          )}
          
          <details>
            <summary className="cursor-pointer">View Raw Schedule Data</summary>
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[200px] mt-2">
              <pre>{JSON.stringify(schedule, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
      
      {scoreResult && (
        <div>
          <h2 className="text-xl font-bold mb-2">Scoring Results</h2>
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="font-bold">Testing Category Expansion</p>
            <p>Testing the effect of expanding categories and lengths into specific shift codes before scoring.</p>
            <p>The desktop version automatically does this expansion, the mobile version needs it added.</p>
          </div>
          
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Test Case</th>
                <th className="p-2 text-left">Score</th>
                <th className="p-2 text-left">Explanation</th>
                {debugView && <th className="p-2 text-left">Criteria</th>}
              </tr>
            </thead>
            <tbody>
              {scoreResult.map((result, index) => (
                <tr key={index} className={`border-b ${
                  index === 0 ? "bg-green-50" : // Desktop style test
                  index === 1 ? "bg-red-50" :   // Mobile style test
                  ""
                }`}>
                  <td className="p-2 font-medium">{result.testName}</td>
                  <td className="p-2 font-bold">{result.score.toFixed(1)}</td>
                  <td className="p-2">{result.explanation}</td>
                  {debugView && (
                    <td className="p-2">
                      <details>
                        <summary className="cursor-pointer text-blue-600">Show Details</summary>
                        <div className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-[200px]">
                          <p className="font-bold">Original Criteria:</p>
                          <pre className="mb-2">{JSON.stringify(result.originalCriteria, null, 2)}</pre>
                          <p className="font-bold">Final Criteria (after expansion):</p>
                          <pre>{JSON.stringify(result.finalCriteria, null, 2)}</pre>
                        </div>
                      </details>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          <div>
            <h3 className="text-lg font-bold mb-2">Conclusion:</h3>
            <p className="mb-2">
              The desktop app pre-processes category and length filters by expanding them into specific shift codes
              before passing to the scoring function. This is why it works correctly.
            </p>
            <p className="mb-2">
              The mobile app needs to implement the same expansion logic to work the same way.
            </p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <h4 className="font-bold text-yellow-800 mb-1">Implementation Fix:</h4>
              <p className="mb-2 text-yellow-800">To fix the mobile app, add the category expansion function to <code>MobileFilterFlow.jsx</code> before calling <code>calculateScheduleScore</code>:</p>
              <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
{`// Add this function to MobileFilterFlow.jsx:
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
        // ... rest of function
      });
    // ... rest of function
  };
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}