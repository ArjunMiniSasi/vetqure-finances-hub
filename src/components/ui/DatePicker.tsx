import React, { useState } from 'react';
import { Calendar } from './calendar';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <input
        type="text"
        readOnly
        value={value ? value.toLocaleDateString() : ''}
        onClick={() => setOpen((o) => !o)}
        className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Select date"
      />
      {open && (
        <div className="absolute z-10 bg-white border rounded shadow mt-2">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setOpen(false);
              }
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker; 