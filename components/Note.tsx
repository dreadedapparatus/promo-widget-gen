
import React from 'react';

interface NoteProps {
    children: React.ReactNode;
}

export const Note: React.FC<NoteProps> = ({ children }) => {
  return (
    <div className="text-sm bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md my-4 text-blue-800">
        {children}
    </div>
  );
};
