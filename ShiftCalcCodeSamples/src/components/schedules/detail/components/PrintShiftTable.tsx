// src/components/schedules/detail/components/PrintShiftTable.tsx
import { PrintShiftTableProps } from '../types';

export default function PrintShiftTable({ shiftTypeData, totalShifts, totalDaysOff }: PrintShiftTableProps) {
  return (
    <div className="hidden print:block print:mb-4">
      <h3 className="text-lg font-semibold mb-2 text-black">Shift Distribution</h3>
      <div className="border border-gray-300">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left p-2 text-black">Shift Type</th>
              <th className="text-center p-2 text-black">Count</th>
              <th className="text-right p-2 text-black">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {shiftTypeData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="p-2 text-black border-b border-gray-200">{item.name}</td>
                <td className="p-2 text-black text-center border-b border-gray-200">{item.value}</td>
                <td className="p-2 text-black text-right border-b border-gray-200">
                  {Math.round((item.value / (totalShifts + totalDaysOff)) * 100)}%
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100">
              <td className="p-2 text-black font-bold">Total</td>
              <td className="p-2 text-black text-center font-bold">
                {totalShifts + totalDaysOff}
              </td>
              <td className="p-2 text-black text-right font-bold">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
