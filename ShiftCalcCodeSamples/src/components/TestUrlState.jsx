// src/components/TestUrlState.jsx
import React from 'react';
import { updateUrlWithState, encodeState, decodeState } from '@/utils/stateEncoding';

export default function TestUrlState() {
  const testUrlUpdate = () => {
    const testState = {
      test: 'value',
      timestamp: Date.now()
    };
    console.log("Testing URL state update with:", testState);
    updateUrlWithState(testState);
  };

  return (
    <div className="p-4 border border-red-500 m-4">
      <h2 className="text-xl font-bold mb-2">URL State Test</h2>
      <button 
        onClick={testUrlUpdate}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Test URL State
      </button>
    </div>
  );
}