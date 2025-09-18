// node-backend/server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const PORT = 8080;

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
        // If Flask returns an error (like verification failed), forward it
        if (error.response && error.response.data) {
            // The error data is a buffer, so we convert it to a string
            const errorJson = JSON.parse(error.response.data.toString());
            console.error('Error from Flask service:', errorJson.message);
            return res.status(400).json(errorJson);
        }
        console.error('Internal error in Node.js gateway:', error.message);
        res.status(500).json({ message: 'An internal error occurred.' });
    }
});

app.listen(PORT, () => {
    console.log(`Node.js API Gateway listening on http://localhost:${PORT}`);
});

