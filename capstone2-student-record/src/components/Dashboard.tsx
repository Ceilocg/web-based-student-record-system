import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { Line } from 'react-chartjs-2';
import { FontSpec } from 'chart.js';
import { UserCircle2, Users, BookOpen, BarChart3, Moon, Sun } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { db } from "../firebaseConfig";
import { dropoutReasons } from "../reasons";
import {
  coreSubjectsForGrades7to10,
  coreSubjectsForGrades11to12,
  abmSubjectsForGrades11to12,
  stemSubjectsForGrades11to12,
  gasSubjectsForGrades11to12,
  humssSubjectsForGrades11to12,
  heSubjectsForGrades11to12,
  cssSubjectsForGrades11to12,
  cookerySubjectsForGrades11to12,
} from "../subjects";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js"
import { Chart } from 'chart.js'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const predefinedSubjects = [
  ...coreSubjectsForGrades7to10,
  ...coreSubjectsForGrades11to12,
  ...abmSubjectsForGrades11to12,
  ...stemSubjectsForGrades11to12,
  ...gasSubjectsForGrades11to12,
  ...humssSubjectsForGrades11to12,
  ...heSubjectsForGrades11to12,
  ...cssSubjectsForGrades11to12,
  ...cookerySubjectsForGrades11to12,
];

const Dashboard: React.FC = () => {
  const [studentCount, setStudentCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [students, setStudents] = useState<any[]>([]);
  const [showStudentList, setShowStudentList] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserList, setShowUserList] = useState<boolean>(false);
  const [dbSubjects, setDbSubjects] = useState<string[]>([]);
  const [showSubjectList, setShowSubjectList] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [topStudents, setTopStudents] = useState<{ studentName: string; generalAverage: number; gradeLevel: string }[]>([]);
  const [dropoutData, setDropoutData] = useState<{ [reason: string]: number }>({});

// Generate gradient colors
const generateGradientColors = (baseColor: string, steps: number): string[] => {
  const shades: string[] = [];
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    const color = lightenDarkenColor(baseColor, factor * 50 - 25);
    shades.push(color);
  }
  return shades;
};

const lightenDarkenColor = (hex: string, percent: number): string => {
  let num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = ((num >> 8) & 0x00ff) + amt,
    B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + (B < 255 ? (B < 1 ? 0 : B) : 255))
      .toString(16)
      .slice(1)
  );
};

  useEffect(() => {
    const fetchDropouts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'dropouts'));
  
        // Initialize counts for each dropout reason
        const reasonCounts: { [reason: string]: number } = {};
        dropoutReasons.forEach((reason) => {
          reasonCounts[reason] = 0; // Start with zero counts
        });
  
        // Count the occurrences of each reason
        querySnapshot.forEach((doc) => {
          const { dropoutReason } = doc.data();
          if (dropoutReason && reasonCounts.hasOwnProperty(dropoutReason)) {
            reasonCounts[dropoutReason]++;
          }
        });
  
        setDropoutData(reasonCounts);
      } catch (error) {
        console.error('Error fetching dropout data:', error);
      }
    };
  
    fetchDropouts();
  }, []);
  
  
  useEffect(() => {
    const fetchTopStudents = async () => {
      try {
        const studentsQuery = query(
          collection(db, 'grades'),
          orderBy('generalAverage', 'desc'),
          limit(10) 
        );
        const querySnapshot = await getDocs(studentsQuery);

        const students = querySnapshot.docs.map((doc) => ({
          studentName: doc.data().studentName,
          gradeLevel: doc.data().gradeLevel,
          generalAverage: doc.data().generalAverage,
        }));

        setTopStudents(students);
      } catch (error) {
        console.error('Error fetching top students:', error);
      }
    };

    fetchTopStudents();
  }, []);
  

  const allSubjects = [...predefinedSubjects, ...dbSubjects];

  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: [],
});

const [sampleData] = useState({
  "2019": 0,
  "2020": 350,
  "2021": 500, // Example sample data
  "2022": 156,
  "2023": 562,
});


const dropoutLabels = Object.keys(dropoutData); 
const dropoutCounts = Object.values(dropoutData); 
const baseColor = "#3b82f6";
const gradientColors = generateGradientColors(baseColor, dropoutLabels.length);


const dropoutChartData = {
  labels: dropoutLabels,
  datasets: [
    {
      label: 'Dropout Reasons',
      data: dropoutCounts,
      backgroundColor: gradientColors,
      borderColor: gradientColors,
      borderWidth: 1,
    },
  ],
};

const dropoutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        generateLabels: (_chart: Chart) => { // Explicitly type chart
          return dropoutLabels.map((label, index) => ({
            text: label,
            fillStyle: gradientColors[index], // Bar color
            fontColor: darkMode ? '#FFFFFF' : '#000000', // White for dark mode, black for light mode
            hidden: false,
          }));
        },
      },
    },
    title: {
      display: true,
      text: 'Bar Graph Dropouts (2024-2025)',
      color: darkMode ? '#D1D5DB' : '#374151', // Title color
      font: {
        size: 16,
        weight: 'bold',
      } as Partial<FontSpec>,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Dropout Reasons', // Set meaningful text
        color: darkMode ? '#D1D5DB' : '#374151', // Axis label color
        font: {
          size: 14,
        },
      },
      ticks: {
        color: darkMode ? '#D1D5DB' : '#374151', // Tick color
        autoSkip: false, // Display all labels
        maxRotation: 0, // Keep labels horizontal
        minRotation: 0,
        font: {
          size: 12,
        },
        padding: 10, // Add spacing for better readability
        callback: function (_value: string | number, index: number) {
          const reason = dropoutLabels[index]; // Map index to the corresponding reason
          return reason.length > 12
            ? reason.slice(0, 12) + '...' // Truncate if too long
            : reason; // Return full text if short
        },
      },
      grid: {
        drawTicks: true,
        drawOnChartArea: false,
        color: darkMode ? '#374151' : '#E5E7EB', // Grid line color
      },
    },
    y: {
      beginAtZero: true,
      max:20,
      title: {
        display: true,
        text: 'Count', // Show "Count" on y-axis
        color: darkMode ? '#D1D5DB' : '#374151',
        font: {
          size: 14,
        },
      },
      ticks: {
        color: darkMode ? '#D1D5DB' : '#374151', // Tick color
      },
    },
  },  
};




useEffect(() => {
  const fetchEnrollmentData = async () => {
      const enrollmentCounts: { [year: string]: number } = { ...sampleData }; // Initialize with sample data

      try {
          const querySnapshot = await getDocs(collection(db, 'enrollmentForms'));
          querySnapshot.forEach((doc) => {
              const schoolYear: string = doc.data().schoolYear;
              const startYear = schoolYear.split('-')[0]; // Extract the start year (e.g., 2024 from "2024-2025")
              enrollmentCounts[startYear] = (enrollmentCounts[startYear] || 0) + 1;
          });

          // Prepare data for the chart
          const labels = Object.keys(enrollmentCounts).sort(); // Sort years
          const data = labels.map((year) => enrollmentCounts[year]); // Map counts to sorted years

          setChartData({ labels, data });
      } catch (error) {
          console.error('Error fetching enrollment data: ', error);
      }
  };

  fetchEnrollmentData();
}, [sampleData]); // Rerun if sample data changes

// Chart.js Data
const data = {
  labels: chartData.labels,
  datasets: [
      {
          label: 'Enrollments',
          data: chartData.data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          tension: 0.3, // Smooth curves
      },
  ],
};

// Chart.js Options
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
      legend: {
          display: true,
          position: 'top' as const,
      },
  },
  scales: {
      x: {
          title: {
              display: true,
              text: 'School Year',
          },
      },
      y: {
        grid: {
          drawTicks: true,
          drawOnChartArea: false, // Disable grid lines inside the chart
          borderColor: darkMode ? '#374151' : '#4B5563', // Darken x-axis border
        },
          beginAtZero: true,
          title: {
              display: true,
              text: 'Number of Enrollments',
          },
      },
  },
};

  useEffect(() => {
    const fetchSubjectsFromDB = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "subjects"));
        const dbSubjectNames = querySnapshot.docs.map((doc) => doc.data().name as string);
        setDbSubjects(dbSubjectNames);
      } catch (error) {
        console.error("Error fetching subjects from database:", error);
      }
    };

    fetchSubjectsFromDB();
  }, []);

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "enrollmentForms"));
      const studentList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName || "",
          middleName: data.middleName || "",
          lastName: data.lastName || "",
          extensionName: data.extensionName || "",
          gradeLevel: data.gradeLevel || "N/A",
          section: data.section || "N/A",
        };
      });
      setStudents(studentList);
      setStudentCount(studentList.length);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };
  
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          fullname: data.fullname || "N/A",
          role: data.role || "N/A",
        };
      });
      setUsers(userList);
      setUserCount(userList.length);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <button
          onClick={toggleDarkMode}
          className={`fixed top-4 right-4 p-2 rounded-full ${
            darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-900'
          } shadow-lg`}
        >
          {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
        </button>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Student Card */}
          <div
            className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
            onMouseEnter={() => setShowStudentList(true)}
            onMouseLeave={() => setShowStudentList(false)}
          >
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium">Students</h3>
              <UserCircle2 className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total enrolled students</p>

            {/* Student List Modal */}
            {showStudentList && (
              <div className={`absolute ${darkMode ? 'bg-gray-900' : 'bg-white'} p-6 rounded-lg shadow-lg top-full left-0 mt-2 w-96 z-50`}>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 text-center`}>Student List</h2>
                <div
                  className={`h-48 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-md overflow-y-auto`}
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <style>
                    {`
                      .h-48::-webkit-scrollbar {
                        display: none;
                      }
                    `}
                  </style>
                  <table className="min-w-full text-left text-sm">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
                      <tr>
                        <th className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                        <th className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Grade Level</th>
                        <th className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length > 0 ? (
                        students
                          .sort((a, b) => {
                            const gradeA = parseInt(a.gradeLevel, 10) || 0;
                            const gradeB = parseInt(b.gradeLevel, 10) || 0;
                            return gradeA - gradeB;
                          })
                          .map((student, index) => {
                            const fullName = `${student.firstName} ${student.middleName || ""} ${student.lastName} ${student.extensionName || ""}`.trim();
                            const gradeLevel = student.gradeLevel || "N/A";
                            const section = student.section || "N/A";
                            return (
                              <tr
                                key={index}
                                className={`${
                                  darkMode
                                    ? index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"
                                    : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-opacity-80`}
                              >
                                <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fullName}</td>
                                <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{gradeLevel}</td>
                                <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{section}</td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={3} className={`px-4 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                            No students found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* User Card */}
          <div
            className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
            onMouseEnter={() => setShowUserList(true)}
            onMouseLeave={() => setShowUserList(false)}
          >
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium">Users</h3>
              <Users className={`h-4 w-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total registered users</p>

            {/* User List Modal */}
            {showUserList && (
              <div className={`absolute ${darkMode ? 'bg-gray-900' : 'bg-white'} p-6 rounded-lg shadow-lg top-full left-0 mt-2 w-96 z-50`}>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 text-center`}>User List</h2>
                <div
                  className={`h-48 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-md overflow-y-auto`}
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <style>
                    {`
                      .h-48::-webkit-scrollbar {
                        display: none;
                      }
                    `}
                  </style>
                  <table className="min-w-full text-left text-sm">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
                      <tr>
                        <th className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</th>
                        <th className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map((user, index) => (
                          <tr
                            key={index}
                            className={`${
                              darkMode
                                ? index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"
                                : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-opacity-80`}
                          >
                            <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.fullname}</td>
                            <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.role}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className={`px-4 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Subject Card */}
          <div
            className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
            onMouseEnter={() => setShowSubjectList(true)}
            onMouseLeave={() => setShowSubjectList(false)}
          >
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium">Subjects</h3>
              <BookOpen className={`h-4 w-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
            <div className="text-2xl font-bold">{allSubjects.length}</div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Available courses</p>

            {/* Subject List Modal */}
            {showSubjectList && (
              <div className={`absolute ${darkMode ? 'bg-gray-900' : 'bg-white'} p-6 rounded-lg shadow-lg top-full left-0 mt-2 w-96 z-50`}>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 text-center`}>Subjects</h2>
                <div
                  className={`h-48 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-md overflow-y-auto`}
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <style>
                    {`
                      .h-48::-webkit-scrollbar {
                        display: none;
                      }
                    `}
                  </style>
                  <table className="min-w-full text-left text-sm">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
                      <tr>
                        <th className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subject Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSubjects.length > 0 ? (
                        [...allSubjects]
                          .sort((a, b) => a.localeCompare(b))
                          .map((subject, index) => (
                            <tr
                              key={index}
                              className={`${
                                darkMode
                                  ? index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"
                                  : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              } hover:bg-opacity-80`}
                            >
                              <td className={`px-4 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{subject}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td className={`px-4 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                            No subjects found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Average Grade Card */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md`}>
            <div className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium">Average Grade</h3>
              <BarChart3 className={`h-4 w-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div className="text-2xl font-bold">85%</div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Across all subjects</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pie Chart Section */}
          <div className={`lg:col-span-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
            <div className={`aspect-square rounded-full border-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-center`}>
              <p className="text-lg font-semibold">Pie Chart Area</p>
            </div>
          </div>
          
          {/* Top Students Section */}
          <div className={`lg:col-span-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
            <h3 className={`text-lg font-semibold mb-4 text-center ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Top Students</h3>
            <div className="space-y-4">
              {topStudents.length > 0 ? (
                topStudents.map((student, index) => (
                <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}
                     >
                  <div
                    className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center`}
                    >
                      {index + 1}
                  </div>
                  <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Grade {student.gradeLevel} - {student.generalAverage}%
                      </p>
                      
                  </div>
                </div>
              ))
            ) : (
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No students data available.</p>
            )}
        </div>
    </div>
          {/* Average Grade by Subjects */}
          <div className={`lg:col-span-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
            <h3 className="text-lg font-semibold mb-4">Average Grade by Subjects</h3>
            <div className="space-y-4">
              {['Math', 'Science', 'English', 'History'].map((subject) => (
                <div key={subject} className="space-y-2">
                  <div className="flex justify-between">
                    <span>{subject}</span>
                    <span>85%</span>
                  </div>
                  <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6">
          
{/* Bar Chart */}
<div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
  <div className="h-96"> {/* Adjusted height for better visibility */}
    {dropoutLabels.length > 0 ? (
      <Bar
        data={dropoutChartData}
        options={dropoutChartOptions}
      />
    ) : (
      <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading dropout data...</p>
    )}
  </div>
</div>



        {/* Line Chart */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
           <h3 className="text-lg font-semibold mb-4 text-center">Enrollment Trends</h3>
           <div className="h-64">
            <Line data={data} options={options} />
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;