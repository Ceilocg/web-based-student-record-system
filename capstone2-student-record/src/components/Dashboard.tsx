import { collection, getDocs, query, orderBy, limit,where } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { Line, Bar } from 'react-chartjs-2';
import { ChartOptions, TooltipItem } from "chart.js";
import { UserCircle2, Users, BookOpen, BarChart3, Moon, Sun } from 'lucide-react';
import { db } from "../firebaseConfig";
import DoughnutChart from './pie';
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
import ChartDataLabels from 'chartjs-plugin-datalabels';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartDataLabels);
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
  const [subjectAverages, setSubjectAverages] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<{ name: string; averageGrade: number }[]>([]);
  const [completers2025, setCompleters2025] = useState(0);
  const [graduates2025, setGraduates2025] = useState(0);




  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Completers (Grade 10)
        const completersQuery = query(
          collection(db, "grades"),
          where("gradeLevel", "==", "10")
        );
        const completersSnapshot = await getDocs(completersQuery);
        setCompleters2025(completersSnapshot.size);
  
        //Fetch Graduates 
        const graduatesQuery = query(
          collection(db, "grades"),
          where("semester", "==", "2nd")
        );
        const graduatesSnapshot = await getDocs(graduatesQuery);
        setGraduates2025(graduatesSnapshot.size); 
      } catch (error) {
        console.error("Error fetching data for 2025:", error);
      }
    };
  
    fetchData();
  }, []);
  
  const datacg = {
    labels: ["2020", "2021", "2022", "2023", "2024", "2025"], // Updated with 2025
    datasets: [
      {
        label: "Graduates",
        data: [200, 300, 500, 250, 200, graduates2025], // Updated with dynamic data for 2025
        backgroundColor: "#85C1E9", // Light Blue
        borderColor: "#3498DB", // Blue
        borderWidth: 1,
      },
      {
        label: "Completers",
        data: [120, 360, 460, 230, 220, completers2025], // Updated with dynamic data for 2025
        backgroundColor: "#2196f3",
        borderColor: "#1976d2",
        borderWidth: 1,
      },
    ],
  };
  
  const optionscg = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const, // Fixed: Explicit type cast
        labels: {
          color: darkMode ? "#D1D5DB" : "#374151",
        },
      },
      title: {
        display: true,
        text: "Counts of Graduates and Completers by Year",
        color: darkMode ? "#D1D5DB" : "#374151",
        font: {
          size: 16,
          weight: "bold" as const, // Explicit type cast to resolve error
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Year",
          color: darkMode ? "#D1D5DB" : "#374151",
        },
        ticks: {
          color: darkMode ? "#D1D5DB" : "#374151",
        },
        grid: {
          color: darkMode ? "#374151" : "#E5E7EB",
        },
      },
      y: {
        beginAtZero: true,
        max: 600,
        title: {
          display: true,
          text: "Count",
          color: darkMode ? "#D1D5DB" : "#374151",
        },
        ticks: {
          color: darkMode ? "#D1D5DB" : "#374151",
        },
        grid: {
          color: darkMode ? "#374151" : "#E5E7EB",
          
            drawOnChartArea: false,
          
        },
      },
    },
  };
  
  
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
    const fetchSubjectsAndAverages = async () => {
      setIsLoading(true);
      setError(null);
  
      try {
        const gradesCollection = collection(db, "grades");
        const gradesSnapshot = await getDocs(gradesCollection);
  
        const subjectGrades: Record<string, { total: number; count: number }> = {};
        const allSubjects = new Set<string>();
  
        gradesSnapshot.forEach((doc) => {
          const data = doc.data();
          const learningAreas = data.learningAreas || [];
  
          learningAreas.forEach((area: { name: string, finalGrade: number }) => {
            allSubjects.add(area.name);
  
            // Accumulate grades for each subject
            if (!subjectGrades[area.name]) {
              subjectGrades[area.name] = { total: 0, count: 0 };
            }
            subjectGrades[area.name].total += area.finalGrade;
            subjectGrades[area.name].count += 1;
          });
        });
  
        // Calculate average grades
        const averages: Record<string, number> = {};
        for (const subject in subjectGrades) {
          averages[subject] = subjectGrades[subject].total / subjectGrades[subject].count;
        }
  
        setSubjects(
          Array.from(allSubjects).sort().map((subject) => ({
            name: subject,
            averageGrade: averages[subject] || 0,
          }))
        );
      } catch (error) {
        console.error("Error fetching subjects and averages:", error);
        setError("Failed to load subjects and averages. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchSubjectsAndAverages();
  }, []);

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
  
        // Set dropout data
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
  


const dropoutChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      display: true,
      color: darkMode ? '#FFFFFF' : '#000000',
      font: {
        size: 12,
        weight: 'bold',
      },
      formatter: (value: number) => {
        const total = dropoutCounts.reduce((sum, count) => sum + count, 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        return `${value} (${percentage}%)`;
      },
      anchor: 'end',
      align: 'end',
      offset: -4,
    },
    legend: {
      display: true,
      position: 'top',
      labels: {
        generateLabels: (_chart) => {
          const total = dropoutCounts.reduce((sum, count) => sum + count, 0);
          return dropoutLabels.map((label, index) => {
            const count = dropoutCounts[index];
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            return {
              text: `${label} (${percentage}%)`,
              fillStyle: gradientColors[index],
              fontColor: darkMode ? '#FFFFFF' : '#000000',
              hidden: false,
            };
          });
        },
      },
    },
    title: {
      display: true,
      text: 'Bar Graph Dropouts (2024-2025)',
      color: darkMode ? '#D1D5DB' : '#374151',
      font: {
        size: 16,
        weight: 'bold',
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Dropout Reasons',
        color: darkMode ? '#D1D5DB' : '#374151',
        font: {
          size: 14,
        },
      },
      ticks: {
        color: darkMode ? '#D1D5DB' : '#374151',
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0,
        font: {
          size: 12,
        },
        padding: 10,
        callback: function (_value, index) {
          const reason = dropoutLabels[index];
          return reason.length > 12 ? reason.slice(0, 12) + '...' : reason;
        },
      },
      grid: {
        drawTicks: true,
        color: darkMode ? '#374151' : '#E5E7EB',
      },
    },
    y: {
      beginAtZero: true,
      max: 10,
      title: {
        display: true,
        text: 'Count',
        color: darkMode ? '#D1D5DB' : '#374151',
        font: {
          size: 14,
        },
      },
      ticks: {
        color: darkMode ? '#D1D5DB' : '#374151',
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  },
};

  

  
  const [chartData, setChartData] = useState<{
    labels: string[];
    enrollments: number[];
    dropouts: number[];
    juniorHigh: number[];
    seniorHigh: number[];
  }>({
    labels: [],
    enrollments: [],
    dropouts: [],
    juniorHigh: [],
    seniorHigh: [],
  });

  const [sampleData] = useState({
    "2019": { enrollments: 100, dropouts: 10, juniorHigh: 60, seniorHigh: 40 },
    "2020": { enrollments: 350, dropouts: 20, juniorHigh: 200, seniorHigh: 150 },
    "2021": { enrollments: 500, dropouts: 25, juniorHigh: 300, seniorHigh: 200 },
    "2022": { enrollments: 156, dropouts: 15, juniorHigh: 100, seniorHigh: 56 },
    "2023": { enrollments: 562, dropouts: 30, juniorHigh: 400, seniorHigh: 162 },
  });

  useEffect(() => {
    const fetchEnrollmentData = async () => {
      const enrollmentCounts: Record<
        string,
        { enrollments: number; dropouts: number; juniorHigh: number; seniorHigh: number }
      > = { ...sampleData };
  
      try {
        const querySnapshot = await getDocs(collection(db, "enrollmentForms"));
        querySnapshot.forEach((doc) => {
          const schoolYear: string = doc.data().schoolYear;
          const startYear = schoolYear.split("-")[0];
          const gradeLevel = doc.data().gradeLevel;
          const status = doc.data().status;
  
          // Initialize counts for the year if not already present
          if (!enrollmentCounts[startYear]) {
            enrollmentCounts[startYear] = { enrollments: 0, dropouts: 0, juniorHigh: 0, seniorHigh: 0 };
          }
  
          // Count dropouts
          if (status === "Dropout") {
            enrollmentCounts[startYear].dropouts += 1;
          } else {
            // Count non-dropout enrollments
            enrollmentCounts[startYear].enrollments += 1;
  
            // Count junior high students
            if (["7", "8", "9", "10"].includes(gradeLevel)) {
              enrollmentCounts[startYear].juniorHigh += 1;
            }
  
            // Count senior high students
            if (["11", "12"].includes(gradeLevel)) {
              enrollmentCounts[startYear].seniorHigh += 1;
            }
          }
        });
  
        // Prepare chart data
        const labels = Object.keys(enrollmentCounts).sort();
        const enrollments = labels.map((year) => enrollmentCounts[year].enrollments);
        const dropouts = labels.map((year) => enrollmentCounts[year].dropouts);
        const juniorHigh = labels.map((year) => enrollmentCounts[year].juniorHigh);
        const seniorHigh = labels.map((year) => enrollmentCounts[year].seniorHigh);
  
        setChartData({ labels, enrollments, dropouts, juniorHigh, seniorHigh });
      } catch (error) {
        console.error("Error fetching enrollment data: ", error);
      }
    };
  
    fetchEnrollmentData();
  }, [sampleData]);
  
  
  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Enrollments",
        data: chartData.enrollments,
        tension: 0.4, // Smooth line
        backgroundColor: (context: any) => {
          const { chart } = context;
          const ctx = chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
          gradient.addColorStop(0, "rgba(75, 192, 192, 0.5)");
          gradient.addColorStop(1, "rgba(75, 192, 192, 1)");
          return gradient;
        },
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        fill: false,
      },
      {
        label: "Dropouts",
        data: chartData.dropouts,
        tension: 0.4, // Smooth line
        backgroundColor: (context: any) => {
          const { chart } = context;
          const ctx = chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
          gradient.addColorStop(0, "rgba(255, 99, 132, 0.5)");
          gradient.addColorStop(1, "rgba(255, 99, 132, 1)");
          return gradient;
        },
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        fill: false,
      },
      {
        label: "Junior High Counts",
        data: chartData.juniorHigh,
        tension: 0.4, // Smooth line
        backgroundColor: (context: any) => {
          const { chart } = context;
          const ctx = chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
          gradient.addColorStop(0, "rgba(54, 162, 235, 0.5)");
          gradient.addColorStop(1, "rgba(54, 162, 235, 1)");
          return gradient;
        },
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        fill: false,
      },
      {
        label: "Senior High Counts",
        data: chartData.seniorHigh,
        tension: 0.4, // Smooth line
        backgroundColor: (context: any) => {
          const { chart } = context;
          const ctx = chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
          gradient.addColorStop(0, "rgba(255, 206, 86, 0.5)");
          gradient.addColorStop(1, "rgba(255, 206, 86, 1)");
          return gradient;
        },
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
        fill: false,
      },
    ],
  };
  

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top", // Keep the legend at the top
      },
      tooltip: {
        enabled: true, // Enable tooltips on hover
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.raw; // Raw value of the data point
            return `Value: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "School Year",
        },
        grid: {
          drawOnChartArea: false, // Remove grid lines from chart area
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Count",
        },
        grid: {
          drawOnChartArea: false, // Remove grid lines from chart area
        },
      },
    },
    elements: {
      point: {
        radius: 5, // Set point size to a reasonable value
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
      const studentList = querySnapshot.docs
        .filter((doc) => doc.data().status !== "Dropout") // Exclude "Dropout" status
        .map((doc) => {
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
      setStudentCount(studentList.length); // Count only non-dropout students
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
      const userList = querySnapshot.docs
        .filter((doc) => doc.data().status !== "Inactive") // Exclude users with "Inactive" status
        .map((doc) => {
          const data = doc.data();
          return {
            fullname: data.fullname || "N/A",
            role: data.role || "N/A",
          };
        });
  
      setUsers(userList);
      setUserCount(userList.length); // Count only active users
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  

  useEffect(() => {
    const fetchSubjectAverages = async () => {
      try {
        const gradesCollection = collection(db, "grades");
        const gradesSnapshot = await getDocs(gradesCollection);
        
        const subjectTotals: { [key: string]: { sum: number; count: number } } = {};

        gradesSnapshot.forEach((doc) => {
          const data = doc.data();
          const learningAreas = data.learningAreas || [];

          learningAreas.forEach((area: { subject: string; finalGrade: number }) => {
            if (!subjectTotals[area.subject]) {
              subjectTotals[area.subject] = { sum: 0, count: 0 };
            }
            subjectTotals[area.subject].sum += area.finalGrade;
            subjectTotals[area.subject].count += 1;
          });
        });

        const averages: { [key: string]: number } = {};
        for (const [subject, { sum, count }] of Object.entries(subjectTotals)) {
          averages[subject] = Math.round((sum / count) * 10) / 10; // Round to 1 decimal place
        }

        setSubjectAverages(averages);
      } catch (error) {
        console.error("Error fetching subject averages:", error);
      }
    };

    fetchSubjectAverages();
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
            <div className="text-2xl font-bold">
              {Object.values(subjectAverages).length > 0
                ? (Object.values(subjectAverages).reduce((sum, grade) => sum + grade, 0) / Object.values(subjectAverages).length).toFixed(1) + '%'
                : 'N/A'}
            </div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Across all subjects</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
 {/* Doughnut Chart Section */}
 <div className={`lg:col-span-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
          <DoughnutChart /> {/* Use the DoughnutChart component */}
        </div>
          
          {/* Top Students Section */}
          <div
  className={`lg:col-span-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}
  style={{
    maxHeight: '500px',
    overflowY: 'auto',
    scrollbarWidth: 'none', // For Firefox
    msOverflowStyle: 'none', // For Internet Explorer
  }}
>
  <style>
    {`
    /* Hide scrollbar for WebKit browsers */
    .hide-scroll::-webkit-scrollbar {
      display: none;
    }
    `}
  </style>
  <h3
    className={`text-lg font-semibold mb-4 text-center ${
      darkMode ? 'text-gray-200' : 'text-gray-800'
    }`}
  >
    Top Students
  </h3>
  <div className="space-y-4 hide-scroll">
    {topStudents.length > 0 ? (
      topStudents.map((student, index) => (
        <div
          key={index}
          className={`flex items-center space-x-3 p-3 ${
            darkMode ? 'bg-gray-700' : 'bg-gray-100'
          } rounded-lg`}
        >
          <div
            className={`w-8 h-8 rounded-full ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            } flex items-center justify-center`}
          >
            {index + 1}
          </div>
          <div>
            <p className="font-medium">{student.studentName}</p>
            <p
              className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Grade {student.gradeLevel} - {student.generalAverage}%
            </p>
          </div>
        </div>
      ))
    ) : (
      <p
        className={`text-center ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        No students data available.
      </p>
    )}
  </div>
</div>


    
{/* Average Grade by Subjects */}
<div
  className={`lg:col-span-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}
>
  <h3 className="text-lg font-semibold mb-4">Average Grade by Subjects</h3>
  {isLoading ? (
    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading average grades...</p>
  ) : error ? (
    <p className="text-center text-red-500">{error}</p>
  ) : (
    <div
      className="space-y-4 max-h-96 overflow-y-auto pr-2"
      style={{
        scrollbarWidth: 'none', // Hides scrollbar in Firefox
      }}
    >
      <style>
        {`.h-48::-webkit-scrollbar {
          display: none;
        }`}
      </style>
      {subjects.length > 0 ? (
        // Sort subjects by averageGrade in descending order before mapping
        [...subjects]
          .sort((a, b) => b.averageGrade - a.averageGrade) // Sort by highest grade first
          .map((subject) => (
            <div key={subject.name} className="space-y-2">
              <div className="flex justify-between">
                <span>{subject.name}</span>
                {/* Apply red color if grade is below 75 */}
                <span
                  className={`${
                    subject.averageGrade < 75 ? 'text-red-500' : darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  {subject.averageGrade.toFixed(2)}%
                </span>
              </div>
              <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                <div
                  className={`h-2 rounded-full ${
                    subject.averageGrade < 75 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(subject.averageGrade, 100)}%` }}
                />
              </div>
            </div>
          ))
      ) : (
        <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No subjects available.</p>
      )}
    </div>
  )}
</div>

</div>



        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6">
          
{/* Graduates and Completers Bar Chart by Year */}
<div className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow-md`}>
  <div className="h-96">
    <Bar data={datacg} options={optionscg} />
  </div>
  </div>



          {/* Line Chart */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
            <h3 className="text-lg font-semibold mb-4 text-center">Enrollment Trends</h3>
            <div className="h-64">
              <Line data={data} options={options} />
            </div>
          </div>

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

        </div>
      </div>
    </div>
  );
};

export default Dashboard;

