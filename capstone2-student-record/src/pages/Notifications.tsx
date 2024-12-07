import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import axios from 'axios';

interface Request {
  id: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  suffix?: string;
  depedForm: string;
  lrn: string;
  contactNumber: string;
  email: string;
  strand: string;
  tvlSubOption?: string;
  yearGraduated?: string;
  gradeLevel?: string;
  status: string;
  timestamp: any;
  fileName?: string;
}

const fetchSignedUrl = async (fileName: string) => {
  try {
    const response = await axios.get('https://backend-q0jpghqts-ceilocgs-projects.vercel.app/generate-signed-url', {
      params: { fileName },
    });

    if (response.data.url) {
      window.open(response.data.url, '_blank'); // Open in a new tab
    } else {
      console.error('No signed URL returned.');
    }
  } catch (error) {
    console.error('Error fetching signed URL:', error);
    alert('An error occurred while fetching the download link.');
  }
};



// Format the timestamp
const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'No timestamp available';

  try {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error('Error formatting timestamp: ', error);
    return 'Invalid date';
  }
};

// Get the current school year
const getCurrentSchoolYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are zero-indexed
  return currentMonth >= 6 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
};

// Get today's date in a readable format
const getFormattedDate = () => {
  const today = new Date();
  return today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const Notifications: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);

  // Fetch the requests from Firestore when the component is mounted
  useEffect(() => {
    const fetchRequests = async () => {
      const requestQuery = query(collection(db, 'form_requests'));

      onSnapshot(requestQuery, (querySnapshot) => {
        const requestsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          firstName: doc.data().firstName,
          middleInitial: doc.data().middleInitial || '',
          lastName: doc.data().lastName,
          suffix: doc.data().suffix || '',
          depedForm: doc.data().depedForm,
          lrn: doc.data().lrn !== 'N/A' ? doc.data().lrn : '',
          contactNumber: doc.data().contactNumber !== 'N/A' ? doc.data().contactNumber : '',
          email: doc.data().email !== 'N/A' ? doc.data().email : '',
          strand: doc.data().strand !== 'N/A' ? doc.data().strand : '',
          tvlSubOption: doc.data().tvlSubOption || null,
          yearGraduated: doc.data().yearGraduated !== 'N/A' ? doc.data().yearGraduated : '',
          gradeLevel: doc.data().gradeLevel !== 'N/A' ? doc.data().gradeLevel : '',
          status: doc.data().status || 'pending',
          timestamp: doc.data().timestamp ? formatTimestamp(doc.data().timestamp) : 'N/A',
        }));

        // Sort requests so that "pending" is at the top and "done" is at the bottom
        const sortedRequests = requestsData.sort((a, b) => {
          if (a.status === 'done') return 1;
          if (b.status === 'done') return -1;
          return 0;
        });

        setRequests(sortedRequests);
      });
    };

    fetchRequests();
  }, []);

  const markAsDone = async (id: string) => {
    try {
      const requestDoc = doc(db, 'form_requests', id);
      await updateDoc(requestDoc, {
        status: 'done',
      });
      console.log('Status updated to done');
    } catch (error) {
      console.error('Error updating status: ', error);
    }
  };

  const generateCertificate = async (request: Request) => {
    try {
      const fullName = `${request.firstName} ${request.middleInitial || ''} ${request.lastName}`;
      const payload = {
        fullName: fullName.trim(),
        gradeLevel: request.gradeLevel || '',
        schoolYear: getCurrentSchoolYear(),
        date: getFormattedDate(),
      };
  
      const response = await axios.post('https://backend-q0jpghqts-ceilocgs-projects.vercel.app/generate-pdf', payload);

  
      if (response.data.fileName) {
        console.log('Certificate generated:', response.data.fileName);
  
        // Update the request with the generated fileName
        setRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.id === request.id ? { ...req, fileName: response.data.fileName } : req
          )
        );
      } else {
        console.error('Failed to generate certificate: No fileName returned.');
      }
    } catch (error: any) {
      console.error('Error generating certificate:', error.response?.data || error.message || error);
      alert('An error occurred while generating the certificate. Please try again.');
    }
  };
  
  

  return (
    <div className="container mx-auto p-8 bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-4xl font-extrabold mb-6 text-gray-900 text-center">
          Certificate Request List
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border-collapse border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Full Name</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Form/Certificate</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">LRN</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Contact</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Email</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Strand/Track</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Year Graduated</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Grade Level</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Status</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Timestamp</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Action</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Generate Data</th>
                <th className="text-left px-6 py-3 text-gray-700 font-bold">Download</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center px-6 py-4 text-gray-500">
                    No requests found.
                  </td>
                </tr>
              ) : (
                requests.map((request, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {request.firstName !== 'N/A' && request.firstName}{' '}
                      {request.middleInitial !== 'N/A' && request.middleInitial}{' '}
                      {request.lastName !== 'N/A' && request.lastName}{' '}
                      {request.suffix && request.suffix !== 'N/A' && `${request.suffix}`}
                    </td>

                    <td className="px-6 py-4">
                      {request.depedForm}
                    </td>
                    <td className="px-6 py-4">{request.lrn}</td>
                    <td className="px-6 py-4">{request.contactNumber}</td>
                    <td className="px-6 py-4">
                      <a href={`mailto:${request.email}`} className="text-blue-500 hover:underline">
                        {request.email}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {request.strand}
                      {request.strand === 'TVL' && request.tvlSubOption ? (
                        <span className="block text-gray-500 text-sm">
                          ({request.tvlSubOption})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">{request.yearGraduated}</td>
                    <td className="px-6 py-4">{request.gradeLevel}</td>
                    <td
                      className={`px-6 py-4 font-semibold text-center rounded-lg ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600'
                          : request.status === 'accepted'
                          ? 'bg-green-100 text-green-600'
                          : request.status === 'done'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {request.status}
                    </td>
                    <td className="px-6 py-4">{request.timestamp}</td>
                    <td className="px-6 py-4">
                      {request.status === 'accepted' && (
                        <button
                          onClick={() => markAsDone(request.id)}
                          className="bg-blue-500 text-white px-3 py-2 rounded-md shadow-md hover:bg-blue-600 transition-colors"
                        >
                          Mark as Done
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
  {request.depedForm === 'Certificate of Enrollment' && (
    <button
      onClick={() => generateCertificate(request)}
      className="bg-green-500 text-white px-3 py-2 rounded-md shadow-md hover:bg-green-600 transition-colors"
    >
      Generate Certificate
    </button>
  )}
</td>
<td className="px-6 py-4">
  {request.fileName && (
    <button
      onClick={() => fetchSignedUrl(request.fileName!)}
      className="bg-blue-500 text-white px-3 py-2 rounded-md shadow-md hover:bg-blue-600 transition-colors"
    >
      Download
    </button>
  )}
</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
