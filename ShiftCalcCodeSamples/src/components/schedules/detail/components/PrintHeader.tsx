// src/components/schedules/detail/components/PrintHeader.tsx
import { PrintHeaderProps } from '../types';

export default function PrintHeader({ scheduleLine }: PrintHeaderProps) {
  return (
    <div className="hidden print:block print:mb-4">
      <div className="border-b-2 border-black pb-2">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-black">Shift Schedule Report</h1>
          <div className="text-right">
            <p className="text-black font-bold">Line {scheduleLine || "Unknown"}</p>
            <p className="text-black">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
