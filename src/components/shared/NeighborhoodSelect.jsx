import React from 'react';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';

/**
 * Reusable neighborhood dropdown.
 * Props:
 *   value        - current neighborhood_id
 *   onChange     - called with (neighborhood_id, neighborhood_name)
 *   className    - optional extra classes for the <select>
 *   placeholder  - optional placeholder text
 */
export default function NeighborhoodSelect({ value, onChange, className = '', placeholder = 'Select neighborhood…' }) {
  const { data: neighborhoods = [] } = useNeighborhoods();

  const handleChange = (e) => {
    const id = e.target.value;
    const found = neighborhoods.find(n => n.id === id);
    onChange(id, found?.name || '');
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      className={`w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
    >
      <option value="">{placeholder}</option>
      {neighborhoods.map(n => (
        <option key={n.id} value={n.id}>{n.name}</option>
      ))}
    </select>
  );
}