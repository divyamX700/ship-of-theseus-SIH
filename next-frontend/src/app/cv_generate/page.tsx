'use client';

import React, { useState } from 'react'
import { User, Bell, LogOut, Plus, Trash2 } from 'lucide-react'
import { DM_Sans } from "next/font/google";
import axios from 'axios';

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface PersonalDetails {
  name: string
  email: string
  phone: string
  location: string
}

interface Education {
  degree: string
  institution: string
  grade: string
  year: string
}

interface Experience {
  title: string
  company: string
  description: string
  duration: string
}

interface CVData {
  personalDetails: PersonalDetails
  education: Education[]
  experience: Experience[]
  skills: string[]
  languages: string[]
  certifications: string[]
}

const CVBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal')
  const [cvData, setCvData] = useState<CVData>({
    personalDetails: {
      name: '',
      email: '',
      phone: '',
      location: ''
    },
    education: [{ degree: '', institution: '', grade: '', year: '' }],
    experience: [{ title: '', company: '', description: '', duration: '' }],
    skills: [''],
    languages: [''],
    certifications: ['']
  })

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update personal details
  const updatePersonalDetails = (field: keyof PersonalDetails, value: string) => {
    setCvData(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [field]: value
      }
    }))
  }

  // Update education
  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', grade: '', year: '' }]
    }))
  }

  const removeEducation = (index: number) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  // Update experience
  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, { title: '', company: '', description: '', duration: '' }]
    }))
  }

  const removeExperience = (index: number) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  // Update array fields (skills, languages, certifications)
  const updateArrayField = (
    field: keyof Pick<CVData, 'skills' | 'languages' | 'certifications'>,
    index: number,
    value: string
  ) => {
    setCvData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayField = (field: keyof Pick<CVData, 'skills' | 'languages' | 'certifications'>) => {
    setCvData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayField = (field: keyof Pick<CVData, 'skills' | 'languages' | 'certifications'>, index: number) => {
    setCvData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // ✅ Replace handleSave with backend CV generation
  const handleGenerateCV = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // persist cleaned skills so other pages can use them for recommendations
      try {
        const cleanedSkills = cvData.skills.map(s => s.trim()).filter(Boolean);
        if (typeof window !== 'undefined') {
          localStorage.setItem('resume_skills', JSON.stringify(cleanedSkills));
        }
      } catch (e) {
        console.warn('Could not persist resume skills to localStorage', e);
      }
      // Build multipart/form-data with field name `jsonData` so the Node gateway
      // (which uses multer and expects req.body.jsonData) can forward it to Flask.
      const form = new FormData();
      form.append('jsonData', JSON.stringify(cvData));

      // If the page has a file input (certificate) we attach it; otherwise skip.
      const fileInput = document.getElementById('certificate-input') as HTMLInputElement | null;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        form.append('certificate', fileInput.files[0]);
      }

      const response = await axios.post(
        "http://localhost:8080/api/generate-cv",
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          responseType: 'blob'
        }
      );

      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute(
        "download",
        `${cvData.personalDetails.name.replace(/\s+/g, "_") || "CV"}_CV.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error generating CV:", error);
      setErrorMessage("Error generating CV. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Details' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Skills & Languages' },
    { id: 'certifications', label: 'Certifications' }
  ]

  return (
    <div className={`${dmSans.className} bg-[rgba(246,251,255,1)]`}>
      <header className="bg-blue-600 text-white">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex items-center justify-between h-16">
                 <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                     <span className="text-blue-600 font-bold text-sm">🇮🇳</span>
                   </div>
                   <span className="font-semibold">PM Internship Portal</span>
                 </div>
                 <nav className="hidden md:flex items-center space-x-8">
                   <a href="/internship" className="hover:text-blue-200">Internships For You</a>
                   <a href="#" className="hover:text-blue-200">Applied Internships</a>
                   <div className="flex items-center space-x-2">
                     <Bell className="w-5 h-5" />
                     <span>Notifications</span>
                   </div>
                   <span>English</span>
                   <button className="hover:text-blue-200">Logout</button>
                 </nav>
               </div>
             </div>
           </header>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {cvData.personalDetails.name || 'Admin'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {cvData.personalDetails.email || 'admin@gmail.com'}
                </p>
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Personal Details Tab */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Personal Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={cvData.personalDetails.name}
                          onChange={(e) => updatePersonalDetails('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={cvData.personalDetails.email}
                          onChange={(e) => updatePersonalDetails('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={cvData.personalDetails.phone}
                          onChange={(e) => updatePersonalDetails('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+91 12345 67890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location *
                        </label>
                        <input
                          type="text"
                          value={cvData.personalDetails.location}
                          onChange={(e) => updatePersonalDetails('location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="City, State"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Certificate (optional)
                        </label>
                        <input
                          id="certificate-input"
                          type="file"
                          accept="image/*"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800">Education</h2>
                      <button
                        onClick={addEducation}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Education
                      </button>
                    </div>
                    {cvData.education.map((edu, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        {cvData.education.length > 1 && (
                          <button
                            onClick={() => removeEducation(index)}
                            className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Degree/Course *
                            </label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="B.Tech in Computer Science"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Institution *
                            </label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="University/College Name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Grade/CGPA
                            </label>
                            <input
                              type="text"
                              value={edu.grade}
                              onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="8.5 CGPA"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Year
                            </label>
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) => updateEducation(index, 'year', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="2020-2024"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Experience Tab */}
                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800">Experience</h2>
                      <button
                        onClick={addExperience}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Experience
                      </button>
                    </div>
                    {cvData.experience.map((exp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        {cvData.experience.length > 1 && (
                          <button
                            onClick={() => removeExperience(index)}
                            className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Job Title *
                            </label>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => updateExperience(index, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Software Engineering Intern"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Company *
                            </label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Tech Solutions Inc."
                            />
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Jan 2024 - Present"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(index, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="- Developed a key feature for the main product.&#10;- Collaborated with cross-functional teams."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills & Languages Tab */}
                {activeTab === 'skills' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Skills & Languages</h2>
                    
                    {/* Skills Section */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-700">Skills</h3>
                        <button
                          onClick={() => addArrayField('skills')}
                           className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Skill
                        </button>
                      </div>
                      <div className="space-y-2">
                        {cvData.skills.map((skill, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={skill}
                              onChange={(e) => updateArrayField('skills', index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Python, JavaScript, React"
                            />
                            {cvData.skills.length > 1 && (
                              <button
                                onClick={() => removeArrayField('skills', index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Languages Section */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-700">Languages</h3>
                        <button
                          onClick={() => addArrayField('languages')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Language
                        </button>
                      </div>
                      <div className="space-y-2">
                        {cvData.languages.map((language, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={language}
                              onChange={(e) => updateArrayField('languages', index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="English, Hindi"
                            />
                            {cvData.languages.length > 1 && (
                              <button
                                onClick={() => removeArrayField('languages', index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Certifications Tab */}
                {activeTab === 'certifications' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800">Certifications</h2>
                      <button
                        onClick={() => addArrayField('certifications')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Certification
                      </button>
                    </div>
                    <div className="space-y-3">
                      {cvData.certifications.map((cert, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) => updateArrayField('certifications', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Certified Python Developer (PCEP)"
                          />
                          {cvData.certifications.length > 1 && (
                            <button
                              onClick={() => removeArrayField('certifications', index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {/* <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save CV Data
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end pr-40 gap-3 mt-8 pt-6 border-t border-gray-200">
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleGenerateCV}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {isLoading ? "Generating..." : "Generate CV"}
        </button>
      </div>

      {errorMessage && (
        <p className="text-red-600 mt-4">{errorMessage}</p>
      )}
    </div>
  )
}

export default CVBuilder
