const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const app = express();
const PORT = 8080;
const mongoose = require('mongoose');

require('./config/db');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.use(cors({
  origin: "*",
}));

app.post('/api/generate-cv', upload.single('certificate'), async (req, res) => {
    try {
        console.log('Multipart request received by Node.js. Forwarding to Flask...');

        const flaskServiceUrl = 'http://127.0.0.1:5000/api/generate-cv';
        
        // Create a new FormData object to forward the request
        const form = new FormData();

        // The text data is in req.body.jsonData
        form.append('jsonData', req.body.jsonData);

        // The file (if it exists) is in req.file
        if (req.file) {
            // We append the file buffer from memory
            form.append('certificate', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
            });
        }

        const flaskResponse = await axios.post(flaskServiceUrl, form, {
            headers: {
                ...form.getHeaders(), // Pass the form-data headers
            },
            responseType: 'arraybuffer' // Expect binary data back
        });

        console.log('Response received from Flask. Sending to client.');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
        res.send(flaskResponse.data);

    } catch (error) {
        // If Flask returns an error (like verification failed), try to forward a JSON error.
        if (error.response && error.response.data) {
            // The upstream may return JSON or HTML/text. Normalize to a string first.
            let dataString;
            try {
                if (Buffer.isBuffer(error.response.data)) {
                    dataString = error.response.data.toString('utf8');
                } else if (error.response.data instanceof ArrayBuffer) {
                    dataString = Buffer.from(error.response.data).toString('utf8');
                } else if (typeof error.response.data === 'string') {
                    dataString = error.response.data;
                } else {
                    dataString = JSON.stringify(error.response.data);
                }
            } catch (e) {
                dataString = String(error.response.data);
            }

            // Try to parse JSON; if that fails, send a safe JSON message instead of raw HTML.
            try {
                const errorJson = JSON.parse(dataString);
                console.error('Error from Flask service:', errorJson.message || errorJson);
                return res.status(error.response.status || 400).json(errorJson);
            } catch (e) {
                console.error('Non-JSON error from Flask service. Returning sanitized JSON to client.');
                console.error(dataString.slice ? dataString.slice(0, 1000) : dataString);
                return res.status(error.response.status || 502).json({ message: 'Upstream service error', details: dataString });
            }
        }

        console.error('Internal error in Node.js gateway:', error.message);
        res.status(500).json({ message: 'An internal error occurred.' });
    }
});


// distinct States
app.get('/api/filters/states', async (req, res) => {
  try {
    console.log("GET /api/filters/states called");
    const db = mongoose.connection.db;
    const coll = db.collection('internships');
    const states = await coll.distinct("InternshipState");
    console.log("States fetched:", states);
    res.json(states.filter(s => s));
  } catch (err) {
    console.error("states error", err);
    res.status(500).json({ message: "Failed to fetch states" });
  }
});


// distinct Districts for a given state
app.get('/api/filters/districts/:state', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const coll = db.collection('internships'); 
    const districts = await coll.distinct("InternshipDistrict", { InternshipState: req.params.state });
    res.json(districts.filter(d => d));
  } catch (err) {
    console.error("districts error", err);
    res.status(500).json({ message: "Failed to fetch districts" });
  }
});

// distinct Industries
app.get('/api/filters/industries', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const coll = db.collection('internships');
    const industries = await coll.distinct("Sector");
    res.json(industries.filter(i => i));
  } catch (err) {
    console.error("industries error", err);
    res.status(500).json({ message: "Failed to fetch industries" });
  }
});

// distinct Fields
app.get('/api/filters/fields', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const coll = db.collection('internships'); 
    const fields = await coll.distinct("AreaField");
    res.json(fields.filter(f => f));
  } catch (err) {
    console.error("fields error", err);
    res.status(500).json({ message: "Failed to fetch fields" });
  }
});

// distinct Companies
app.get('/api/filters/companies', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const coll = db.collection('internships'); 
    const companies = await coll.distinct("CompanyName");
    res.json(companies.filter(c => c));
  } catch (err) {
    console.error("companies error", err);
    res.status(500).json({ message: "Failed to fetch companies" });
  }
});


// ---------------- Internships with Filters (Multi-value support) ---------------- //

const Internship = require('./models/Internship');


app.get('/api/internships', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // --- build filter ---
    const filter = {};
    const normalize = (param) => {
      if (!param) return null;
      if (Array.isArray(param)) return param.map(p => String(p).trim()).filter(Boolean);
      const parts = String(param).split(',').map(p => p.trim()).filter(Boolean);
      return parts.length ? parts : null;
    };

    const states = normalize(req.query.state);
    const districts = normalize(req.query.district);
    const industries = normalize(req.query.industry);
    const fields = normalize(req.query.field);
    const companies = normalize(req.query.company);

    if (states) filter.InternshipState = { $in: states };
    if (districts) filter.InternshipDistrict = { $in: districts };
    if (industries) filter.Sector = { $in: industries };
    if (fields) filter.AreaField = { $in: fields };
    if (companies) filter.CompanyName = { $in: companies };

    console.log("Applied Filters:", filter);

    // --- fetch ALL matching internships (don't apply skip/limit yet) ---
    const allData = await Internship.find(filter).lean();
    const total = allData.length;

    // --- build job_descriptions using ext_skills ---
    const jobDescriptions = allData.map(d => ({
      jd_id: d._id.toString(),
      jd_skills: Array.isArray(d.ext_skills) ? d.ext_skills : []
    }));

    // --- call FastAPI recommender ---
    const candidateSkills = (req.query.skills || "")
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let scores = [];
    if (candidateSkills.length && jobDescriptions.length) {
      const response = await axios.post("http://localhost:8000/recommend", {
        resume_skills: candidateSkills,
        job_descriptions: jobDescriptions
      });
      scores = response.data; // [{ jd_id, score, skill_scores }]
    }

    // --- merge scores back into internships ---
    const scoredData = allData.map(d => {
      const scoreEntry = scores.find(s => s.jd_id === d._id.toString());
      return {
        ...d,
        match: scoreEntry ? Math.round(scoreEntry.score * 100) : 0, // Default to 0 instead of null
        skill_scores: scoreEntry ? scoreEntry.skill_scores : {}
      };
    });

    // --- SORT BY MATCH SCORE IN DECREASING ORDER ---
    scoredData.sort((a, b) => (b.match || 0) - (a.match || 0));

    // --- NOW apply pagination to the sorted results ---
    const paginatedData = scoredData.slice(skip, skip + limit);

    res.json({ 
      data: paginatedData, 
      page, 
      limit, 
      total, 
      filter,
      sorted_by: "match_score_desc" // Add this to indicate sorting
    });
  } catch (err) {
    console.error('internships error', err);
    res.status(500).json({ message: 'Failed to fetch internships' });
  }
});

// Fetch a single internship by id and optionally compute skill matches
app.get('/api/internships/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const dbDoc = await Internship.findById(id).lean();
    if (!dbDoc) return res.status(404).json({ message: 'Not found' });

    // parse candidate skills from query string
    const candidateSkills = (req.query.skills || '')
      .split(',')
      .map(s => String(s).trim())
      .filter(Boolean);

    let scoreEntry = null;
    if (candidateSkills.length && Array.isArray(dbDoc.ext_skills) && dbDoc.ext_skills.length) {
      const jobDescriptions = [{ jd_id: dbDoc._id.toString(), jd_skills: dbDoc.ext_skills }];
      try {
        const response = await axios.post('http://localhost:8000/recommend', {
          resume_skills: candidateSkills,
          job_descriptions: jobDescriptions
        });
        if (Array.isArray(response.data) && response.data.length) scoreEntry = response.data[0];
      } catch (e) {
        console.error('recommender error for single internship', e?.message || e);
      }
    }

    // Normalize match value: if recommender returned score, handle both [0..1] and [0..100] outputs
    let match = 0;
    let skill_scores = {};
    if (scoreEntry) {
      const s = Number(scoreEntry.score) || 0;
      match = s > 1 ? Math.round(s) : Math.round(s * 100);
      skill_scores = scoreEntry.skill_scores || {};
    }

    const out = {
      ...dbDoc,
      match,
      skill_scores
    };
    res.json(out);
  } catch (err) {
    console.error('single internship error', err);
    res.status(500).json({ message: 'Failed to fetch internship' });
  }
});

app.listen(PORT, () => {
    console.log(`Node.js API Gateway listening on http://localhost:${PORT}`);
});

