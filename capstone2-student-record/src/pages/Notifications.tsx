import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import axios from 'axios'
import { Download, FileCheck, FileText } from 'lucide-react'

interface Request {
  id: string
  firstName: string
  middleInitial?: string
  lastName: string
  suffix?: string
  depedForm: string
  lrn: string
  contactNumber: string
  email: string
  strand: string
  tvlSubOption?: string
  yearGraduated?: string
  gradeLevel?: string
  status: string
  timestamp: any
  fileName?: string
}

interface GroupedRequest {
  fullName: string
  depedForm: string
  requests: Request[]
}

type TabStatus = 'pending' | 'accepted' | 'done'

const fetchSignedUrl = async (fileName: string) => {
  try {
    const response = await axios.get(
      'https://backend-pv9l5h6qz-ceilocgs-projects.vercel.app/generate-signed-url',
      { params: { fileName } }
    )

    if (response.data.url) {
      window.open(response.data.url, '_blank')
    } else {
      console.error('No signed URL returned.')
    }
  } catch (error) {
    console.error('Error fetching signed URL:', error)
    alert('An error occurred while fetching the download link.')
  }
}

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'No timestamp available'

  try {
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date)
  } catch (error) {
    console.error('Error formatting timestamp: ', error)
    return 'Invalid date'
  }
}

const getCurrentSchoolYear = () => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  return currentMonth >= 6 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`
}

const getFormattedDate = () => {
  const today = new Date()
  return today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const CleanGroupedNotifications: React.FC = () => {
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([])
  const [openAccordions, setOpenAccordions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<TabStatus>('pending')

  useEffect(() => {
    const fetchRequests = async () => {
      const requestQuery = query(collection(db, 'form_requests'))

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
          fileName: doc.data().fileName || '',
        }))

        const grouped = requestsData.reduce((acc: GroupedRequest[], request: Request) => {
          const fullName = [
            request.firstName !== 'N/A' ? request.firstName : '',
            request.middleInitial !== 'N/A' ? request.middleInitial : '',
            request.lastName !== 'N/A' ? request.lastName : '',
            request.suffix !== 'N/A' ? request.suffix : ''
          ]
            .filter(Boolean)
            .join(' ')
            .trim();
        
          const existingGroup = acc.find(
            (group) => group.fullName === fullName && group.depedForm === request.depedForm
          );
        
          if (existingGroup) {
            existingGroup.requests.push(request);
          } else {
            acc.push({ fullName: fullName || 'Unknown', depedForm: request.depedForm, requests: [request] });
          }
        
          return acc;
        }, []);
        

        setGroupedRequests(grouped)
      })
    }

    fetchRequests()
  }, [])

  const markAsDone = async (id: string) => {
    try {
      const requestDoc = doc(db, 'form_requests', id)
      await updateDoc(requestDoc, {
        status: 'done',
      })
      console.log('Status updated to done')
    } catch (error) {
      console.error('Error updating status: ', error)
    }
  }

  const generateCertificate = async (request: Request) => {
    try {
      const middleInitial =
        request.middleInitial && request.middleInitial.toUpperCase() !== 'N/A'
          ? request.middleInitial
          : ''
  
      const fullName = `${request.firstName} ${middleInitial} ${request.lastName}`
      const payload = {
        fullName: fullName.trim(),
        gradeLevel: request.gradeLevel || '',
        schoolYear: getCurrentSchoolYear(),
        date: getFormattedDate(),
      }
  
      const response = await axios.post(
        'https://backend-pv9l5h6qz-ceilocgs-projects.vercel.app/generate-pdf',
        payload
      )
  
      if (response.data.fileName) {
        console.log('Certificate generated:', response.data.fileName)
  
        setGroupedRequests(prevGroups =>
          prevGroups.map(group => ({
            ...group,
            requests: group.requests.map(req =>
              req.id === request.id ? { ...req, fileName: response.data.fileName } : req
            )
          }))
        )
      } else {
        console.error('Failed to generate certificate: No fileName returned.')
      }
    } catch (error: any) {
      console.error(
        'Error generating certificate:',
        error.response?.data || error.message || error
      )
      alert('An error occurred while generating the certificate. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      case 'accepted':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Accepted</span>
      case 'done':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Done</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Unknown</span>
    }
  }

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const filteredGroups = groupedRequests.filter(group => 
    group.requests.some(request => request.status === activeTab)
  )

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-center">Certificate Request List</h2>
        </div>
        <div className="flex border-b">
          {(['pending', 'accepted', 'done'] as TabStatus[]).map((status) => (
            <button
              key={status}
              className={`flex-1 py-2 px-4 text-center ${
                activeTab === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-6">
          {filteredGroups.length === 0 ? (
            <p className="text-center text-gray-500">No {activeTab} requests found.</p>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full text-left p-4 focus:outline-none hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                    onClick={() => toggleAccordion(`item-${index}`)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{group.fullName !== 'Unknown' ? group.fullName : 'N/A'}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{group.depedForm}</span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            openAccordions.includes(`item-${index}`) ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </button>
                  {openAccordions.includes(`item-${index}`) && (
                    <div className="p-4 bg-gray-50">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LRN</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strand/Track</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year/Grade</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.requests.filter(request => request.status === activeTab).map((request, requestIndex) => (
                              <tr key={requestIndex} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.lrn}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.contactNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <a href={`mailto:${request.email}`} className="text-blue-500 hover:underline">
                                    {request.email}
                                  </a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {request.strand}
                                  {request.strand === 'TVL' && request.tvlSubOption && (
                                    <span className="block text-xs text-gray-400">
                                      ({request.tvlSubOption})
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {request.yearGraduated || request.gradeLevel}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(request.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    {request.status === 'accepted' && (
                                      <button
                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2focus:ring-blue-500"
                                        onClick={() => markAsDone(request.id)}
                                      >
                                        <FileCheck className="w-4 h-4 mr-1" />
                                        Done
                                      </button>
                                    )}
                                    {request.depedForm === 'Certificate of Enrollment' && (
                                      <button
                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        onClick={() => generateCertificate(request)}
                                      >
                                        <FileText className="w-4 h-4 mr-1" />
                                        Generate
                                      </button>
                                    )}
                                    {request.fileName && (
                                      <button
                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        onClick={() => fetchSignedUrl(request.fileName!)}
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CleanGroupedNotifications

