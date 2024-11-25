import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface DropoutRequest {
  id: string;
  studentId: string;
  studentName: string;
  section: string;
  dropoutReason: string;
  requestedBy: string;
  status: string; // Pending, Accepted, Rejected
  timestamp: Date;
}

const AdminDropout: React.FC = () => {
  const [dropoutRequests, setDropoutRequests] = useState<DropoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dropout requests from the database
  const fetchDropoutRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const dropoutsSnapshot = await getDocs(collection(db, "dropouts"));
      const requests: DropoutRequest[] = dropoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DropoutRequest[];

      setDropoutRequests(requests);
    } catch (err) {
      console.error("Error fetching dropout requests:", err);
      setError("Failed to fetch dropout requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropoutRequests();
  }, []);

  // Handle accepting a dropout request
  const handleAccept = async (request: DropoutRequest) => {
    try {
      // Update the dropout request status to "Accepted" in the `dropouts` collection
      const dropoutRef = doc(db, "dropouts", request.id);
      await updateDoc(dropoutRef, { status: "Accepted" });

      // Update the student's status to "Dropout" in the `enrollmentForms` collection
      const studentRef = doc(db, "enrollmentForms", request.studentId);
      await updateDoc(studentRef, { status: "Dropout" });

      // Update local state for the UI
      setDropoutRequests((prevRequests) =>
        prevRequests.map((r) =>
          r.id === request.id ? { ...r, status: "Accepted" } : r
        )
      );

      alert("Dropout request accepted, and student's status updated.");
    } catch (error) {
      console.error("Error accepting dropout request:", error);
      setError("Failed to accept dropout request. Please try again.");
    }
  };

  // Handle rejecting a dropout request
  const handleReject = async (request: DropoutRequest) => {
    try {
      // Update the dropout request status to "Rejected" in the `dropouts` collection
      const dropoutRef = doc(db, "dropouts", request.id);
      await updateDoc(dropoutRef, { status: "Rejected" });

      // Update local state for the UI
      setDropoutRequests((prevRequests) =>
        prevRequests.map((r) =>
          r.id === request.id ? { ...r, status: "Rejected" } : r
        )
      );

      alert("Dropout request rejected.");
    } catch (error) {
      console.error("Error rejecting dropout request:", error);
      setError("Failed to reject dropout request. Please try again.");
    }
  };

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center"> Dropout Requests</h1>
      {dropoutRequests.length > 0 ? (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="px-4 py-2 border">Student Name</th>
              <th className="px-4 py-2 border">Section</th>
              <th className="px-4 py-2 border">Reason</th>
              <th className="px-4 py-2 border">Requested By</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dropoutRequests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-2 border">{request.studentName}</td>
                <td className="px-4 py-2 border">{request.section}</td>
                <td className="px-4 py-2 border">{request.dropoutReason}</td>
                <td className="px-4 py-2 border">{request.requestedBy}</td>
                <td
                  className={`px-4 py-2 border ${
                    request.status === "Accepted"
                      ? "text-red-500"
                      : request.status === "Rejected"
                      ? "text-gray-500"
                      : "text-blue-500"
                  }`}
                >
                  {request.status}
                </td>
                <td className="px-4 py-2 border text-center space-x-2">
                  {request.status === "Pending" && (
                    <>
                      <button
                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={() => handleAccept(request)}
                      >
                        Accept
                      </button>
                      <button
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => handleReject(request)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No pending dropout requests.</p>
      )}
    </div>
  );
};

export default AdminDropout;
