"use client";

import React, { useState, useEffect } from 'react';
import { Search, Bell, User, MapPin, Building, Star, X, Upload } from 'lucide-react';

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Remote' | 'On-site';
  description: string;
  skills: string[];
  match: number;
  category: string;
  logo?: string;
}

const InternshipPortal = () => {
  const [appliedCount] = useState(1);
  const maxApplications = 3;
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');

  const openModal = (internship: Internship) => {
    setSelectedInternship(internship);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedInternship(null);
    setIsModalOpen(false);
  };

  const openApplicationModal = (internship: Internship) => {
    setSelectedInternship(internship);
    setIsApplicationModalOpen(true);
    setIsModalOpen(false); // Close view modal if open
  };

  const closeApplicationModal = () => {
    setSelectedInternship(null);
    setIsApplicationModalOpen(false);
    setApplicationNote('');
  };

  const handleSubmitApplication = () => {
    // Handle application submission logic here
    console.log('Submitting application for:', selectedInternship?.title);
    closeApplicationModal();
  };
  // dynamic internships state
  const [internships, setInternships] = useState<Internship[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchPage = async (p: number) => {
      setLoading(true);
      setError(null);
      try {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  const res = await fetch(`${base}/api/internships?page=${p}&limit=${limit}`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const body = await res.json();
        const mapped: Internship[] = (body.data || []).map((d: any) => ({
          id: d.InternshipID || d._id || String(d._id),
          title: d.InternshipTitle || d.title || 'Untitled',
          company: d.CompanyName || d.company || 'Unknown',
          location: ((d.InternshipDistrict || d.InternshipState) ? `${d.InternshipDistrict || ''}, ${d.InternshipState || ''}` : (d.location || '')),
          type: 'On-site',
          description: d.JobDescription || d.description || '',
          skills: (d.PreferredSkills && typeof d.PreferredSkills === 'string') ? d.PreferredSkills.split(/[;,]\s*/).slice(0,5) : (d.skills || []).slice(0,5),
          match: Math.min(100, Math.max(0, parseInt(d.match) || Math.floor(Math.random() * 50) + 50)),
          category: d.Sector || d.category || 'General',
          logo: '�'
        }));

        if (!mounted) return;
        setInternships((cur) => [...cur, ...mapped]);
        setHasMore((body.total || 0) > p * limit && mapped.length > 0);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPage(page);
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const InternshipCard = ({ internship, isTopInternship = false }: { internship: Internship; isTopInternship?: boolean }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
            {internship.logo}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{internship.title}</h3>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {internship.category}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Building className="w-4 h-4 mr-1" />
              <span className="mr-4">{internship.company}</span>
              <MapPin className="w-4 h-4 mr-1" />
              <span>{internship.location}</span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{internship.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {internship.skills.map((skill, index) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-600">
                <Star className="w-4 h-4 mr-1 fill-current" />
                <span className="text-sm font-medium">{internship.match}% match</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => openModal(internship)}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 text-sm"
                >
                  View
                </button>
                <button 
                  onClick={() => openApplicationModal(internship)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <a href="#" className="hover:text-blue-200">Internships For You</a>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Rajesh Kumar</h3>
                  <p className="text-sm text-gray-600">rajesh.k@gmail.com</p>
                  <button className="text-sm text-blue-600 hover:underline">Profile</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex space-x-4">
                      <div>
                        <label className="text-sm text-gray-600">State</label>
                        <select className="mt-1 block w-full text-sm border border-gray-300 rounded">
                          <option>Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">District</label>
                        <select className="mt-1 block w-full text-sm border border-gray-300 rounded">
                          <option>Select</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Industry</label>
                  <select className="mt-2 block w-full text-sm border border-gray-300 rounded">
                    <option>Select industry</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Field</label>
                  <select className="mt-2 block w-full text-sm border border-gray-300 rounded">
                    <option>Select field</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company</label>
                  <select className="mt-2 block w-full text-sm border border-gray-300 rounded">
                    <option>Select company</option>
                  </select>
                </div>
                <div className="flex space-x-2 pt-4">
                  <button className="text-sm text-gray-600 hover:text-gray-800">Reset</button>
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg p-4 mb-6">
              <h2 className="font-semibold mb-4">Application Progress</h2>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                    <span className="ml-2">Registration</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                    <span className="ml-2">Application</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs">3</div>
                    <span className="ml-2 text-gray-500">Offer Received</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs">4</div>
                    <span className="ml-2 text-gray-500">Offer Accepted</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs">5</div>
                    <span className="ml-2 text-gray-500">Internship</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600">2 of 5 steps</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search internships, companies, keywords, etc."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Top Internships Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Top Internships For You</h2>
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center">
                  <span className="mr-2">⚠️</span>
                  You can apply to a maximum of 3 internships.
                  <span className="ml-2 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                    Applied: {appliedCount} / {maxApplications}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {internships.slice(0, 3).map((internship) => (
                  <InternshipCard key={internship.id} internship={internship} isTopInternship={true} />
                ))}
                {internships.length === 0 && !loading && (
                  <div className="text-sm text-gray-500">No internships found.</div>
                )}
              </div>
            </div>

            {/* More Internships Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">More Internships</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2">
                {internships.slice(3).map((internship) => (
                  <div key={internship.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{internship.title}</h3>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        {internship.category}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <span className="mr-1">{internship.logo}</span>
                      <span>{internship.company}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-600">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        <span className="text-sm font-medium">{internship.match}% match</span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openModal(internship)}
                          className="px-3 py-1 text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-50"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => openApplicationModal(internship)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-center">
                {error && <div className="text-red-600 mr-4">{error}</div>}
                {loading && <div className="text-gray-600">Loading...</div>}
                {!loading && hasMore && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Load more
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>© 2025 Internship Portal</span>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-gray-900">About Us</a>
              <a href="#" className="hover:text-gray-900">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && selectedInternship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedInternship.company} - {selectedInternship.title}
              </h2>
              <button 
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Job Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Job Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  As a {selectedInternship.title} at {selectedInternship.company}, you will contribute to building performant, accessible user 
                  interfaces. You will collaborate with design and product to ship features, write clean, maintainable code, 
                  and help improve developer tooling and documentation.
                </p>
              </div>

              {/* Key Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Key Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Internship ID:</span>
                    <div className="font-medium">INT-{selectedInternship.category.toUpperCase()}-{selectedInternship.id}841</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Field:</span>
                    <div className="font-medium">{selectedInternship.category}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Sector:</span>
                    <div className="font-medium">Technology</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Location:</span>
                    <div className="font-medium">{selectedInternship.location}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Candidates Applied:</span>
                    <div className="font-medium">{Math.floor(Math.random() * 200) + 50}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Total Opportunities:</span>
                    <div className="font-medium">{Math.floor(Math.random() * 500) + 100}</div>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Location Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Mode:</span>
                    <div className="font-medium">
                      {selectedInternship.type === 'Remote' ? 'Remote-first, optional office visits' : 'On-site with flexible hours'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Time zone overlap:</span>
                    <div className="font-medium">4 hrs with PST</div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedInternship.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Performance</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Testing</span>
                </div>
              </div>

              {/* Qualifications Required */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Qualifications Required</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Minimum Qualification:</span>
                    <div className="font-medium">Bachelor's (ongoing) or higher</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Course:</span>
                    <div className="font-medium">B.Tech / B.Sc / M.Sc in CS or related</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Specialization:</span>
                    <div className="font-medium">Web Technologies / HCI</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Certifications:</span>
                    <div className="font-medium">Any React/TS certification preferred</div>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end">
                <button 
                  onClick={() => openApplicationModal(selectedInternship)}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">📧</span>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {isApplicationModalOpen && selectedInternship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Confirm Application — {selectedInternship.title}
              </h2>
              <button 
                onClick={closeApplicationModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Upload Resume */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Upload Resume</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Resume.pdf</div>
                        <div className="text-sm text-gray-500">PDF or DOCX, max 5MB</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        Replace
                      </button>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Match */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Skills Match</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Overlapping Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedInternship.skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        User Research
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        Wireframing
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Skills Needed</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedInternship.skills.slice(2).map((skill, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        TypeScript
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        Design Systems
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Helpful but not mandatory. Highlight any exposure below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Additional Information</h3>
                <textarea
                  value={applicationNote}
                  onChange={(e) => setApplicationNote(e.target.value)}
                  placeholder="Add a short note to the recruiter (availability, project links, visa, etc.)"
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button 
                  onClick={handleSubmitApplication}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">📧</span>
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipPortal;