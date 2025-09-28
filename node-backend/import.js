const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

// 🔹 Replace with your MongoDB Atlas connection string
const uri = "mongodb+srv://rajnandani31:RAJnand2005@sih.avsckh6.mongodb.net/?retryWrites=true&w=majority&appName=SIH";

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ Connection error:", err));

// Schema (fields same as your CSV headers)
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
  PreferredSkills: String
});

const Internship = mongoose.model('Internship', internshipSchema);
// Read CSV and insert into DB
const results = [];

fs.createReadStream("Job_Descriptions.csv.xls") // make sure students.csv is in the same folder
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", () => {
    Internship.insertMany(results)
      .then(() => {
        console.log("🎉 Data inserted successfully!");
        mongoose.connection.close();
      })
      .catch(err => {
        console.error("❌ Error inserting data:", err);
        mongoose.connection.close();
      });
  });
