import React from 'react';
import { Switch } from './switch';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from './form';

interface StatusToggleFieldProps {
  // For react-hook-form usage
  control?: any;
  name?: string;
  // For standalone usage
  value?: 'active' | 'inactive';
  onChange?: (value: 'active' | 'inactive') => void;
  // Labels
  label?: string;
  activeLabel?: string;
  inactiveLabel?: string;
}

const StatusToggleField: React.FC<StatusToggleFieldProps> = ({
  control,
  name,
  value,
  onChange,
  label = 'Status',
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}) => {
  // If using react-hook-form
  if (control && name) {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 h-full w-full">
            <div className="space-y-0.5">
              <FormLabel className="text-base">{label}</FormLabel>
              <div className="text-sm text-gray-500">
                {field.value === 'active' ? activeLabel : inactiveLabel}
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value === 'active'}
                onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
  // Standalone usage
  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-4 h-full w-full">
      <div className="space-y-0.5">
        <div className="text-base font-semibold">{label}</div>
        <div className="text-sm text-gray-500">
          {value === 'active' ? activeLabel : inactiveLabel}
        </div>
      </div>
      <Switch
        checked={value === 'active'}
        onCheckedChange={(checked) => onChange && onChange(checked ? 'active' : 'inactive')}
      />
    </div>
  );
};

export default StatusToggleField; 