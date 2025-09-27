// src/app/cv_generate/page.tsx

"use client";

import React, { useState } from "react";
import axios from "axios";

export default function CVGeneratePage() {
  const [cvData, setCvData] = useState({
    fullName: "Divyam Kulshrestha",
    phone: "+91 12345 67890",
    cityState: "Guwahati, Assam",
    email: "divyam.k@example.com",
    education: [
      { specialization: "B.Tech in Computer Science", grade: "8.5 CGPA" },
    ],
    experience: [
      {
        title: "Software Engineering Intern",
        company: "Tech Solutions Inc.",
        description: "Developed a key feature for the main product.",
      },
    ],
    skills: ["Python", "JavaScript", "React"],
    languages: ["English", "Hindi"],
    certifications: ["Certified Python Developer (PCEP)"],
  });

  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setCvData({ ...cvData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleComplexItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    section: keyof typeof cvData
  ) => {
    const { name, value } = e.target;
    const list = [...(cvData[section] as any[])];
    list[index][name] = value;
    setCvData({ ...cvData, [section]: list });
  };

  const handleSimpleItemChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    section: keyof typeof cvData
  ) => {
    const list = [...(cvData[section] as string[])];
    list[index] = e.target.value;
    setCvData({ ...cvData, [section]: list });
  };

  const addItem = (section: keyof typeof cvData) => {
    const list = [...(cvData[section] as any[])];
    if (section === "education") list.push({ specialization: "", grade: "" });
    else if (section === "experience")
      list.push({ title: "", company: "", description: "" });
    else list.push("");
    setCvData({ ...cvData, [section]: list });
  };

  const removeItem = (index: number, section: keyof typeof cvData) => {
    const list = [...(cvData[section] as any[])];
    list.splice(index, 1);
    setCvData({ ...cvData, [section]: list });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("jsonData", JSON.stringify(cvData));
    if (certificateFile) {
      formData.append("certificate", certificateFile);
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/generate-cv",
        formData,
        {
          responseType: "blob",
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute(
        "download",
        `${cvData.fullName.replace(" ", "_")}_CV.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      if (error.response && error.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          const errorData = JSON.parse(reader.result as string);
          setErrorMessage(errorData.message || "An unknown error occurred.");
        };
        reader.readAsText(error.response.data);
      } else {
        setErrorMessage("Error generating CV. The server might be down.");
      }
      console.error("Error generating CV:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App p-6">
      <h1 className="text-2xl font-bold mb-4">
        Simple CV Builder with Verification
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Certificate Upload */}
        <div className="form-section">
          <h2 className="text-lg font-semibold">Degree Certificate Upload</h2>
          <p className="upload-note text-sm">
            Upload an image of your certificate for verification (PDFs will
            bypass this check).
          </p>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, application/pdf"
          />
          {certificateFile && (
            <p className="file-name">Selected: {certificateFile.name}</p>
          )}
        </div>

        {/* Personal Details */}
        <div className="form-section">
          <h2>Personal Details</h2>
          <input
            name="fullName"
            value={cvData.fullName}
            onChange={handleInputChange}
            placeholder="Full Name"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="phone"
              value={cvData.phone}
              onChange={handleInputChange}
              placeholder="Phone Number"
              required
            />
            <input
              name="email"
              value={cvData.email}
              onChange={handleInputChange}
              placeholder="Email ID"
              type="email"
              required
            />
          </div>
          <input
            name="cityState"
            value={cvData.cityState}
            onChange={handleInputChange}
            placeholder="City, State"
            required
          />
        </div>

        {/* Education */}
        <div className="form-section">
          <h2>Education</h2>
          {cvData.education.map((edu, index) => (
            <div key={index} className="dynamic-item">
              <input
                name="specialization"
                value={edu.specialization}
                onChange={(e) => handleComplexItemChange(e, index, "education")}
                placeholder="Specialization (e.g., B.Tech in CS)"
              />
              <input
                name="grade"
                value={edu.grade}
                onChange={(e) => handleComplexItemChange(e, index, "education")}
                placeholder="Grade / CGPA"
              />
              <button
                type="button"
                onClick={() => removeItem(index, "education")}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("education")}>
            + Add Education
          </button>
        </div>

        {/* Experience */}
        <div className="form-section">
          <h2>Past Experience (If Any)</h2>
          {cvData.experience.map((exp, index) => (
            <div key={index} className="dynamic-item">
              <input
                name="title"
                value={exp.title}
                onChange={(e) => handleComplexItemChange(e, index, "experience")}
                placeholder="Job Title"
              />
              <input
                name="company"
                value={exp.company}
                onChange={(e) => handleComplexItemChange(e, index, "experience")}
                placeholder="Company"
              />
              <textarea
                name="description"
                value={exp.description}
                onChange={(e) => handleComplexItemChange(e, index, "experience")}
                placeholder="Description (use new lines for bullet points)"
              />
              <button
                type="button"
                onClick={() => removeItem(index, "experience")}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("experience")}>
            + Add Experience
          </button>
        </div>

        {/* Skills */}
        <div className="form-section">
          <h2>Skills</h2>
          {cvData.skills.map((skill, index) => (
            <div key={index} className="dynamic-item">
              <input
                value={skill}
                onChange={(e) => handleSimpleItemChange(e, index, "skills")}
                placeholder="Skill (e.g., Python)"
              />
              <button type="button" onClick={() => removeItem(index, "skills")}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("skills")}>
            + Add Skill
          </button>
        </div>

        {/* Languages */}
        <div className="form-section">
          <h2>Languages Known</h2>
          {cvData.languages.map((lang, index) => (
            <div key={index} className="dynamic-item">
              <input
                value={lang}
                onChange={(e) => handleSimpleItemChange(e, index, "languages")}
                placeholder="Language (e.g., English)"
              />
              <button
                type="button"
                onClick={() => removeItem(index, "languages")}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("languages")}>
            + Add Language
          </button>
        </div>

        {/* Certifications */}
        <div className="form-section">
          <h2>Additional Certifications (If Any)</h2>
          {cvData.certifications.map((cert, index) => (
            <div key={index} className="dynamic-item">
              <input
                value={cert}
                onChange={(e) =>
                  handleSimpleItemChange(e, index, "certifications")
                }
                placeholder="Certification Name"
              />
              <button
                type="button"
                onClick={() => removeItem(index, "certifications")}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("certifications")}>
            + Add Certification
          </button>
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button
          type="submit"
          className="generate-btn"
          disabled={isLoading}
        >
          {isLoading ? "Verifying & Generating..." : "Generate CV"}
        </button>
      </form>
    </div>
  );
}
