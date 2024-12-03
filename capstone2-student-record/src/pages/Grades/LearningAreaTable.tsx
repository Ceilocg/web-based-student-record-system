import React from 'react';

interface LearningArea {
  name: string;
  finalGrade: number;
  quarters: {
    [key: number]: number;
  };
}

interface LearningAreaTableProps {
  learningAreas: LearningArea[];
  gradeLevel: string; // Pass gradeLevel to determine if Senior High
}

const LearningAreaTable: React.FC<LearningAreaTableProps> = ({
  learningAreas,
  gradeLevel,
}) => {
  const isSeniorHigh = parseInt(gradeLevel) >= 11; // Check if the grade level is for Senior High

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Subject
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Q1
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Q2
            </th>
            {!isSeniorHigh && (
              <>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Q3
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Q4
                </th>
              </>
            )}
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Final Grade
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {learningAreas.map((area, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {area.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                {area.quarters[1]}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                {area.quarters[2]}
              </td>
              {!isSeniorHigh && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {area.quarters[3]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {area.quarters[4]}
                  </td>
                </>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                {area.finalGrade}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LearningAreaTable;

