"use client";

import React, { useState, useEffect } from 'react';
import { Search, Bell, User, MapPin, Building, Star, X, Upload } from 'lucide-react';
import { DM_Sans } from "next/font/google";

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Remote' | 'On-site';
  description: string;
  skills: string[];
  match: number;
  skill_scores?: Record<string, number>;
  category: string;
  logo?: string;
}

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


const InternshipPortal = () => {
  const [appliedCount] = useState(1);
  const maxApplications = 3;
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [fields, setFields] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [filtersActive, setFiltersActive] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8080/api/filters/states")
      .then((res) => res.json())
      .then(setStates);

    fetch("http://localhost:8080/api/filters/industries")
      .then((res) => res.json())
      .then(setIndustries);

    fetch("http://localhost:8080/api/filters/fields")
      .then((res) => res.json())
      .then(setFields);

    fetch("http://localhost:8080/api/filters/companies")
      .then((res) => res.json())
      .then(setCompanies);
  }, []);
   useEffect(() => {
    if (selectedState) {
      fetch(`http://localhost:8080/api/filters/districts/${selectedState}`)
        .then((res) => res.json())
        .then(setDistricts);
    } else {
      setDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedState]);

  const handleReset = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedIndustry("");
    setSelectedField("");
    setSelectedCompany("");
    setFiltersActive(false);
    setInternships([]);
    setPage(1);
  };

  const [internships, setInternships] = useState<Internship[]>([]); 

const handleApply = async () => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters only if a value is selected
    if (selectedState) queryParams.append("state", selectedState);
    if (selectedDistrict) queryParams.append("district", selectedDistrict);
    if (selectedIndustry) queryParams.append("industry", selectedIndustry);
    if (selectedField) queryParams.append("field", selectedField);
    if (selectedCompany) queryParams.append("company", selectedCompany);

    // Candidate skills: try to read the user's CV skills from localStorage first
    let skills: string[] = [];
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('resume_skills');
        if (stored) skills = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading resume_skills from localStorage', e);
    }
    if (!skills || skills.length === 0) {
      skills = ['CCTV Systems', 'Computer Networks', 'Hardware', 'Surveillance', 'Alertness', 'Observation', 'Reliability'];
    }

    if (skills && skills.length > 0) {
      queryParams.append("skills", skills.join(","));
    }

    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    const url = `${base}/api/internships?page=1&limit=10&${queryParams.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const result = await response.json();

    // Map incoming internships to our UI shape
    const mapped: Internship[] = (result.data || []).map((d: any) => ({
      id: d._id || d.InternshipID || String(d._id),
      title: d.InternshipTitle || d.title || "Untitled",
      company: d.CompanyName || d.company || "Unknown",
      location: `${d.InternshipDistrict || ""}${d.InternshipDistrict || d.InternshipState ? ', ' : ''}${d.InternshipState || ""}`,
      type: 'On-site',
      description: d.JobDescription || d.description || "",
      skills: Array.isArray(d.ext_skills) ? d.ext_skills.slice(0, 5) : ((d.PreferredSkills && typeof d.PreferredSkills === 'string') ? d.PreferredSkills.split(/[;,]\s*/).slice(0,5) : (d.skills || []).slice(0,5)),
      match: d.match ?? 0,
      skill_scores: d.skill_scores || {},
      category: d.Sector || d.category || "General",
      logo: "🏢"
    }));

   
    setInternships(mapped);
    setPage(1);
    setHasMore((result.total || 0) > mapped.length);
    setFiltersActive(true);
  } catch (err) {
    console.error("Error fetching internships:", err);
  }
};



  const openModal = async (internship: Internship) => {
    // fetch dynamic details for this internship, including per-skill matches
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
      // prefer resume skills from localStorage if available
      let skills: string[] = [];
      try { const stored = localStorage.getItem('resume_skills'); if (stored) skills = JSON.parse(stored); } catch {}

      const q = skills.length ? `?skills=${encodeURIComponent(skills.join(','))}` : '';
      const res = await fetch(`${base}/api/internships/${internship.id}${q}`);
      if (res.ok) {
        const data = await res.json();
        // normalize to our Internship shape
        const mapped: Internship = {
          id: data._id || data.InternshipID || internship.id,
          title: data.InternshipTitle || data.title || internship.title,
          company: data.CompanyName || data.company || internship.company,
          location: `${data.InternshipDistrict || ''}${data.InternshipDistrict || data.InternshipState ? ', ' : ''}${data.InternshipState || ''}`,
          type: 'On-site',
          description: data.JobDescription || data.description || internship.description,
          skills: Array.isArray(data.ext_skills) ? data.ext_skills : (data.PreferredSkills ? (typeof data.PreferredSkills === 'string' ? data.PreferredSkills.split(/[;,]\s*/) : data.PreferredSkills) : (data.skills || internship.skills)),
          match: data.match ?? internship.match ?? 0,
          skill_scores: data.skill_scores || internship.skill_scores || {},
          category: data.Sector || data.category || internship.category,
          logo: internship.logo || '🏢'
        };
        setSelectedInternship(mapped);
        setIsModalOpen(true);
      } else {
        // fallback: show the passed-in object
        setSelectedInternship(internship);
        setIsModalOpen(true);
      }
    } catch (e) {
      console.error('Error fetching internship details:', e);
      setSelectedInternship(internship);
      setIsModalOpen(true);
    }
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
 // const [internships, setInternships] = useState<Internship[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't run paginated fetch when a filtered result is active
    if (filtersActive) return;

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
  }, [page, filtersActive]);

  const InternshipCard = ({ internship, isTopInternship = false }: { internship: Internship; isTopInternship?: boolean }) => (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow ${dmSans.className}`}>
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
                  <h3 className="font-semibold">Admin</h3>
                  <p className="text-sm text-gray-600">admin@gmail.com</p>
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
                <select
                  className="mt-1 block w-full text-sm border border-gray-300 rounded"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                >
                  <option value="">All states</option>
                  {states.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">District</label>
                <select
                  className="mt-1 block w-full text-sm border border-gray-300 rounded"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedState}
                >
                  <option value="">All districts</option>
                  {districts.map((d, i) => (
                    <option key={i} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Industry</label>
          <select
            className="mt-2 block w-full text-sm border border-gray-300 rounded"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            <option value="">All industries</option>
            {industries.map((ind, i) => (
              <option key={i} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Field</label>
          <select
            className="mt-2 block w-full text-sm border border-gray-300 rounded"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="">All fields</option>
            {fields.map((f, i) => (
              <option key={i} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Company</label>
          <select
            className="mt-2 block w-full text-sm border border-gray-300 rounded"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">All companies</option>
            {companies.map((c, i) => (
              <option key={i} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2 pt-4">
          <button
            className="text-sm text-gray-600 hover:text-gray-800"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            onClick={handleApply}
          >
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
                {internships.slice(0, 5).map((internship) => (
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
         <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">

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
                  {selectedInternship.description || `As a ${selectedInternship.title} at ${selectedInternship.company}, you will be responsible for contributing to various projects and gaining hands-on experience in the field.`}
                </p>
              </div>

              {/* Key Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Key Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Internship ID:</span>
                    <div className="font-medium">{selectedInternship.id}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Field:</span>
                    <div className="font-medium">{selectedInternship.category}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Company:</span>
                    <div className="font-medium">{selectedInternship.company}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Location:</span>
                    <div className="font-medium">{selectedInternship.location}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Type:</span>
                    <div className="font-medium">{selectedInternship.type}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-600">Match Score:</span>
                    <div className="font-medium text-green-600">{selectedInternship.match}%</div>
                  </div>
                </div>
              </div>

              {/* Skills with Color Coding */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                <div className="mb-2 text-sm text-gray-600">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                  Matched Skills
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-4 mr-1"></span>
                  Skills Gap
                </div>
                <div className="flex flex-wrap gap-2">
                  {
                    // build a normalized map from skill name -> numeric flag (0/1)
                    (() => {
                      const raw = selectedInternship.skill_scores || {};
                      const normMap: Record<string, number> = {};
                      Object.keys(raw).forEach(k => {
                        try {
                          const val = raw[k];
                          const n = (typeof val === 'string') ? Number(val) : (typeof val === 'boolean' ? (val ? 1 : 0) : Number(val));
                          normMap[String(k).trim().toLowerCase()] = Number.isFinite(n) ? n : 0;
                        } catch { /* ignore */ }
                      });

                      const nodes = selectedInternship.skills.map((skill, index) => {
                        const key = String(skill).trim().toLowerCase();
                        const isMatched = normMap[key] === 1;
                        return (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${isMatched ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}
                          >
                            {skill}
                          </span>
                        );
                      });

                      return nodes;
                    })()
                  }
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {
                    (() => {
                      const raw = selectedInternship.skill_scores || {};
                      const normMap: Record<string, number> = {};
                      Object.keys(raw).forEach(k => {
                        try {
                          const val = raw[k];
                          const n = (typeof val === 'string') ? Number(val) : (typeof val === 'boolean' ? (val ? 1 : 0) : Number(val));
                          normMap[String(k).trim().toLowerCase()] = Number.isFinite(n) ? n : 0;
                        } catch { /* ignore */ }
                      });
                      const matched = selectedInternship.skills.reduce((acc, s) => acc + (normMap[String(s).trim().toLowerCase()] === 1 ? 1 : 0), 0);
                      return `${matched} of ${selectedInternship.skills.length} skills matched`;
                    })()
                  }
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
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/10">

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
                <h3 className="font-semibold text-gray-900 mb-4">Skills Match Analysis</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      ✓ Matched Skills ({Object.values(selectedInternship.skill_scores || {}).filter(v => v === 1).length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedInternship.skills
                        .filter(skill => selectedInternship.skill_scores?.[skill] === 1)
                        .map((skill, index) => (
                          <span key={index} className="bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      {Object.values(selectedInternship.skill_scores || {}).filter(v => v === 1).length === 0 && (
                        <span className="text-sm text-gray-500">No matched skills</span>
                      )}
                    </div>
                  </div>
                  {/* Skills gap column removed as requested */}
                </div>
                
                {/* Match Percentage */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Match Score:</span>
                    <span className="text-2xl font-bold text-blue-600">{selectedInternship.match}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${selectedInternship.match}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Additional Information</h3>
                <textarea
                  value={applicationNote}
                  onChange={(e) => setApplicationNote(e.target.value)}
                  placeholder="Add a short note to the recruiter (availability, project links, relevant experience with gap skills, etc.)"
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