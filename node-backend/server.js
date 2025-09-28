// node-backend/server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const app = express();
const PORT = 8080;

// ensure DB connection (connects to MongoDB Atlas)
require('./config/db');

// Use multer for handling multipart/form-data. We'll store the file in memory.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
// We don't need express.json() for multipart/form-data routes

// Updated endpoint to handle file uploads
// 'upload.single('certificate')' is the middleware that processes the file
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

// Paginated internships endpoint
app.get('/api/internships', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const db = mongoose.connection.db;

    // 🔍 Debug: check which DB + collections are available
    console.log("Connected DB:", db.databaseName);
    console.log("Collections:", await db.listCollections().toArray());

        // Try the collection that the Python importer writes to first
        let coll = db.collection('job_descriptions');
        let data = await coll.find({}).skip(skip).limit(limit).toArray();
        let total = await coll.countDocuments();

        // Fallback: some scripts (node import.js) inserted into the pluralized 'internships' collection
        if ((!data || data.length === 0) && total === 0) {
            console.log("No documents in 'job_descriptions', trying 'internships' collection as fallback");
            coll = db.collection('internships');
            data = await coll.find({}).skip(skip).limit(limit).toArray();
            total = await coll.countDocuments();
        }

        res.json({ data, page, limit, total });
  } catch (err) {
    console.error('internships error', err);
    res.status(500).json({ message: 'Failed to fetch internships' });
  }
});


app.listen(PORT, () => {
    console.log(`Node.js API Gateway listening on http://localhost:${PORT}`);
});

