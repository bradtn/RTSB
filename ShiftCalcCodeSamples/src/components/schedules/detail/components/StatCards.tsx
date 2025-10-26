// src/components/schedules/detail/components/StatCards.tsx
import { StatCardsProps } from '../types';

export default function StatCards({ theme, totalDays, workDays, daysOff, holidaysOn }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:grid-cols-2 print:gap-2 print:mb-4">
      {[
        { title: "Total Days", value: totalDays, bg: "bg-blue-100 dark:bg-blue-900" },
        { title: "Work Days", value: workDays, bg: "bg-emerald-100 dark:bg-emerald-900" },
        { title: "Days Off", value: daysOff, bg: "bg-indigo-100 dark:bg-indigo-900" }, 
        { title: "Holidays Worked", value: holidaysOn, bg: "bg-rose-100 dark:bg-rose-900" }
      ].map((card, index) => (
        <div key={index} className={`
          ${card.bg} p-5 rounded-xl shadow-md
          print:bg-white print:p-2 print:rounded-none print:shadow-none print:border print:border-gray-300
        `}>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 print:text-black">
            {card.title}
          </p>
          <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white print:text-black print:text-2xl">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
