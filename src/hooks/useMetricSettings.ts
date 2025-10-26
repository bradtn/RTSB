import { useQuery } from '@tanstack/react-query';
import { MetricSettings } from '@/types/BidLinesClient.types';

interface UseMetricSettingsProps {
  selectedOperation: string;
}

/**
 * Custom hook for fetching metric display settings for operations
 */
export const useMetricSettings = ({ selectedOperation }: UseMetricSettingsProps) => {
  const { data: metricSettings } = useQuery({
    queryKey: ['metricSettings', selectedOperation === 'all' ? null : selectedOperation],
    queryFn: async (): Promise<MetricSettings> => {
      const operationParam = selectedOperation === 'all' ? '' : `?operationId=${selectedOperation}`;
      console.log('Fetching metric settings for operation:', selectedOperation, 'URL param:', operationParam);
      const res = await fetch(`/api/metric-settings${operationParam}`);
      if (!res.ok) {
        // Return defaults on error
        return {
          showWeekends: true,
          showSaturdays: true,
          showSundays: true,
          show5DayBlocks: true,
          show4DayBlocks: true,
          show3DayBlocks: false,
          show2DayBlocks: false,
          show6DayBlocks: false,
          showSingleDays: false,
          showHolidays: true,
          showTotalSaturdays: false,
          showTotalSundays: false,
          showTotalDays: false,
          showTotalMondays: false,
          showTotalTuesdays: false,
          showTotalWednesdays: false,
          showTotalThursdays: false,
          showTotalFridays: false,
          showLongestStretch: false,
          showFridayWeekendBlocks: false,
          showWeekdayBlocks: false,
        };
      }
      const data = await res.json();
      console.log('Received metric settings:', data);
      return data;
    },
  });

  return { metricSettings };
};