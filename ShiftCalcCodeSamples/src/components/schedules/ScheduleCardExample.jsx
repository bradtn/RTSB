// Example usage in a ScheduleCard component:

// src/components/schedules/ScheduleCard.jsx
import React from 'react';
import ICalButton from './ICalButton';

const ScheduleCard = ({ schedule, line }) => {
  // This is an example of how to integrate the ICalButton
  // with your existing schedule cards
  
  return (
    <div className="schedule-card">
      <div className="schedule-header">
        <h3>Line {line.id}</h3>
        <div className="score">{line.score}</div>
      </div>
      
      {/* Your existing content */}
      
      {/* Action buttons section */}
      <div className="grid grid-cols-3 gap-1 mt-2">
        <button className="p-3 text-center text-blue-400 border-r border-gray-700">
          View Details
        </button>
        <button className="p-3 text-center text-green-400 border-r border-gray-700">
          Compare
        </button>
        
        {/* Add the ICalButton as the third action */}
        <ICalButton 
          lineId={line.id}
          schedule={{
            line: line.id,
            // Other schedule metadata
          }}
          startDate={schedule.startDate} 
          cycleDays={schedule.cycleDays || 7}
          cycleCount={schedule.cycleCount || 13}
          shifts={schedule.shifts}
        />
      </div>
    </div>
  );
};

export default ScheduleCard;
