
import React from 'react';

interface StepProps {
  title: string;
  children: React.ReactNode;
}

export const Step: React.FC<StepProps> = ({ title, children }) => {
  return (
    <section className="bg-gray-50/50 border border-gray-200 p-6 rounded-lg">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 border-b-2 border-blue-500 pb-2 mb-4 inline-block">{title}</h2>
      <div className="text-gray-700">{children}</div>
    </section>
  );
};
