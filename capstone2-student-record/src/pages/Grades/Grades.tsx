import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // Consistent Firebase import
import GradeAdmin from "./GradeAdmin";
import GradeAdviser from "./GradeAdviser";

const Grades: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Handles local loading state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setRole(userDocSnap.data()?.role || null);
          } else {
            throw new Error("User data not found.");
          }
        } else {
          throw new Error("No user is logged in.");
        }
      } catch (err: any) {
        console.error("Error fetching user role:", err.message);
        setError(err.message || "An error occurred while fetching user data.");
      } finally {
        setLoading(false); // Ensure loading stops after fetching
      }
    };

    fetchUserRole();
  }, []);

  // Render loading spinner exclusively
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-300 rounded-full animate-spin"></div>
          <span className="text-gray-200 text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // Render error message
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500 text-lg font-medium">{error}</div>
      </div>
    );
  }

  // Render fallback if no role is assigned
  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-gray-500 text-lg font-medium">
          No role assigned. Please contact the administrator.
        </div>
      </div>
    );
  }

  // Render specific components based on the role
  return (
    <div className="">
      {role === "Admin" && <GradeAdmin />}
      {role === "Adviser" && <GradeAdviser />}
    </div>
  );
};

export default Grades;
