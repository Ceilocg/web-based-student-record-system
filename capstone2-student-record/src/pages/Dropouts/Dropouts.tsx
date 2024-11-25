import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import AdminDropout from "./AdminDropout"; 
import Component from "./DropoutAdviser"


const Dropouts: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setRole(userDocSnap.data()?.role || null);
          } else {
            setError("User data not found.");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setError("An error occurred while fetching user data.");
        }
      } else {
        setError("No user is logged in.");
      }

      setLoading(false);
    };

    fetchUserRole();
  }, []);

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

  if (!role) {
    return <div className="text-gray-500 text-center">No role assigned.</div>;
  }

  return (
    <div className="">
      {role === "Admin" && <AdminDropout />}
      {role === "Adviser" && <Component />}
    </div>
  );
};

export default Dropouts;
