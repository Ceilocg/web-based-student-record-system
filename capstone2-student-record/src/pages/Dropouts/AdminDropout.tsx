import React, { useEffect, useState } from "react"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

interface DropoutRequest {
  id: string
  studentId: string
  studentName: string
  section: string
  dropoutReason: string
  requestedBy: string
  status: "Pending" | "Accepted" | "Rejected"
  timestamp: Date
}

interface Toast {
  message: string
  type: "success" | "error"
}

const AdminDropout: React.FC = () => {
  const [dropoutRequests, setDropoutRequests] = useState<DropoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const fetchDropoutRequests = async () => {
    try {
      setLoading(true)
      setError(null)

      const dropoutsSnapshot = await getDocs(collection(db, "dropouts"))
      const requests: DropoutRequest[] = dropoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DropoutRequest[]

      setDropoutRequests(requests)
    } catch (err) {
      console.error("Error fetching dropout requests:", err)
      setError("Failed to fetch dropout requests.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDropoutRequests()
  }, [])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAccept = async (request: DropoutRequest) => {
    try {
      const dropoutRef = doc(db, "dropouts", request.id)
      await updateDoc(dropoutRef, { status: "Accepted" })

      const studentRef = doc(db, "enrollmentForms", request.studentId)
      await updateDoc(studentRef, { status: "Dropout" })

      setDropoutRequests((prevRequests) =>
        prevRequests.map((r) =>
          r.id === request.id ? { ...r, status: "Accepted" } : r
        )
      )

      showToast("Dropout request accepted, and student's status updated.", "success")
    } catch (error) {
      console.error("Error accepting dropout request:", error)
      showToast("Failed to accept dropout request. Please try again.", "error")
    }
  }

  const handleReject = async (request: DropoutRequest) => {
    try {
      const dropoutRef = doc(db, "dropouts", request.id)
      await updateDoc(dropoutRef, { status: "Rejected" })

      setDropoutRequests((prevRequests) =>
        prevRequests.map((r) =>
          r.id === request.id ? { ...r, status: "Rejected" } : r
        )
      )

      showToast("Dropout request rejected.", "success")
    } catch (error) {
      console.error("Error rejecting dropout request:", error)
      showToast("Failed to reject dropout request. Please try again.", "error")
    }
  }

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-red-500 text-lg font-medium">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white`}>
          {toast.message}
        </div>
      )}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-800">Dropout Requests</h2>
        </div>
        <div className="p-6">
          {dropoutRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dropoutRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.studentName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.section}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.dropoutReason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.requestedBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === "Accepted"
                            ? "bg-green-100 text-green-800"
                            : request.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === "Pending" && (
                          <div className="flex space-x-2">
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-xs"
                              onClick={() => handleAccept(request)}
                            >
                              Accept
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded text-xs"
                              onClick={() => handleReject(request)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">No pending dropout requests.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDropout

