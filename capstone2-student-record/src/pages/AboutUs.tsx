import React from 'react'

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-rose-800 to-rose-700 px-6 py-8 sm:px-10 sm:py-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center tracking-tight">
              About Us
            </h1>
          </div>
          
          <div className="px-6 py-8 sm:px-10 sm:py-12 space-y-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Welcome to <span className="font-semibold text-rose-700">Valentina B. Boncan National High School</span>, a beacon of education and empowerment in the heart of Bulan, Sorsogon. Formerly known as Gate National High School, our institution has undergone significant transformations over the years, solidifying its commitment to providing quality education and fostering a culture of excellence, integrity, and inclusivity.
            </p>

            <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6 shadow-inner">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Our History</h2>
              <p className="text-gray-700">
                Founded to serve the growing educational needs of the community, the school was originally referred to as "Gate," a name synonymous with access and opportunity. Over time, it was renamed Valentina B. Boncan National High School to honor the remarkable contributions of Valentina B. Boncan to education and community development in the region.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl p-6 shadow-inner">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
              <p className="text-gray-700">
                We aim to equip our students with the knowledge, skills, and values necessary for lifelong learning and global competitiveness while nurturing their individuality and potential. Our school is committed to developing well-rounded individuals prepared to meet the challenges of the 21st century.
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6 shadow-inner">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Vision</h2>
              <p className="text-gray-700">
                To be a center of excellence in secondary education, fostering innovation, creativity, and leadership among our students and educators while maintaining a strong connection to our community's rich cultural heritage.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl p-6 shadow-inner">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Core Values</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Excellence', description: 'Striving for the highest standards in education and personal development.' },
                  { name: 'Integrity', description: 'Building a foundation of trust and honesty within the school community.' },
                  { name: 'Inclusivity', description: 'Ensuring a safe, supportive, and nurturing environment for all learners.' },
                ].map((value, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 text-center shadow">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">{value.name}</h3>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6 shadow-inner">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Community</h2>
              <p className="text-gray-700">
                Situated in the vibrant town of Bulan, Sorsogon, Valentina B. Boncan National High School serves as a pillar of the community, cultivating future leaders who honor their roots while embracing global perspectives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUs

