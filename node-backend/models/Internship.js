// models/Internship.js
const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema({
  InternshipID: String,
  CompanyName: String,
  Sector: String,
  InternshipTitle: String,
  AreaField: String,
  InternshipState: String,
  InternshipDistrict: String,
  NumberOfOpportunities: Number,
  CandidatesAlreadyApplied: Number,
  Benefits: String,
  JobDescription: String,
  MinimumQualification: String,
  Course: String,
  Specialization: String,
  PreferredSkills: String,
  ext_skills: [String]
});

module.exports = mongoose.model('Internship', internshipSchema);
