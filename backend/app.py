# backend/app.py
import os
from dotenv import load_dotenv
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
import base64
import json
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from fpdf import FPDF
import io
from groq import Groq

app = Flask(__name__)
CORS(app)


def verify_certificate_with_groq(certificate_file):
    """
    Verifies if an uploaded image file appears to be a certificate using the Groq API.
    Returns a tuple: (is_verified: bool, reason: str)
    """
    if not certificate_file:
        return True, "No file uploaded, skipping verification."

    allowed_mimetypes = ["image/jpeg", "image/png", "image/webp"]
    if certificate_file.mimetype not in allowed_mimetypes:
        print(f"Unsupported file type: {certificate_file.mimetype}. Skipping LLM verification.")
        return True, "File is not a supported image, skipping verification."

    try:
        client = Groq(api_key=GROQ_API_KEY)
        
        file_bytes = certificate_file.read()
        base64_image = base64.b64encode(file_bytes).decode("utf-8")
        
        prompt = """
        Analyze the attached image. Does it have the visual structure and characteristics of a formal academic degree certificate, diploma, or transcript or grade card?
        Focus on the layout, seals, signatures, and formal text blocks. Do not read or analyze the actual text content.
        Dont be overtly harsh, if it looks like a certificate in any way, consider it a certificate. We just want to weed out random images that are clearly not certificates.
        Respond ONLY with a single, valid JSON object with two keys: "is_certificate" (boolean) and "reason" (a brief string explanation).
        Example of a good response: {"is_certificate": true, "reason": "The document has a formal layout with a university seal and signatures, characteristic of a certificate."}
        Example of a bad response: {"is_certificate": false, "reason": "This is an image of a cat."}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{certificate_file.mimetype};base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            # --- THE FIX: Using the Llama 4 Scout model as requested ---
            model="meta-llama/llama-4-scout-17b-16e-instruct",
        )

        response_text = chat_completion.choices[0].message.content
        print("LLM Response:", response_text)
        
        try:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start != -1 and end != -1:
                json_str = response_text[start:end]
                response_json = json.loads(json_str)
            else:
                raise ValueError("No JSON object found in the response")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Could not parse JSON from LLM response: {e}")
            return False, "The verification model returned an invalid response."

        is_certificate = response_json.get("is_certificate", False)
        reason = response_json.get("reason", "Could not determine certificate status from response.")
        
        return is_certificate, reason

    except Exception as e:
        print(f"An error occurred during Groq API call: {e}")
        return False, "An error occurred during the verification process."


def generate_simple_cv_pdf(data):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font('Helvetica', '', 12)
    pdf.set_font('Helvetica', 'B', 22)
    pdf.cell(0, 10, data.get('fullName', ''), 0, 1, 'C')
    pdf.set_font('Helvetica', '', 11)
    contact_info = f"{data.get('phone', '')}  |  {data.get('email', '')}  |  {data.get('cityState', '')}"
    pdf.cell(0, 8, contact_info, 0, 1, 'C')
    pdf.ln(7)
    sections = {
        "EDUCATION": data.get('education', []), "EXPERIENCE": data.get('experience', []),
        "SKILLS": data.get('skills', []), "LANGUAGES": data.get('languages', []),
        "CERTIFICATIONS": data.get('certifications', [])
    }
    for title, items in sections.items():
        if not items: continue
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(0, 10, title, 0, 1, 'L')
        pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
        pdf.ln(5)
        pdf.set_font('Helvetica', '', 11)
        if title == "EDUCATION":
            for item in items:
                pdf.set_font('Helvetica', 'B', 11)
                pdf.cell(0, 7, item.get('specialization', ''), 0, 0, 'L')
                pdf.set_font('Helvetica', '', 11)
                pdf.cell(0, 7, f"Grade: {item.get('grade', '')}", 0, 1, 'R')
            pdf.ln(5)
        elif title == "EXPERIENCE":
            for item in items:
                pdf.set_font('Helvetica', 'B', 11)
                pdf.cell(0, 7, item.get('title', ''), 0, 1, 'L')
                pdf.set_font('Helvetica', 'I', 11)
                pdf.cell(0, 7, item.get('company', ''), 0, 1, 'L')
                pdf.set_font('Helvetica', '', 11)
                if item.get('description'):
                    points = item['description'].split('\n')
                    for point in points:
                        if point.strip():
                            pdf.set_x(pdf.l_margin + 5)
                            pdf.multi_cell(0, 5, f"- {point.strip()}", 0, 'L')
                pdf.ln(3)
            pdf.ln(5)
        elif title in ["SKILLS", "LANGUAGES"]:
            content = ", ".join(items)
            pdf.multi_cell(0, 7, content, 0, 'L')
            pdf.ln(5)
        elif title == "CERTIFICATIONS":
            for item in items:
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(0, 7, f"- {item}", 0, 'L')
            pdf.ln(5)
    # Return bytes suitable for writing to a BytesIO buffer.
    # FPDF.output(dest='S') returns a string in PyFPDF; encode to latin-1 to preserve byte values.
    pdf_str = pdf.output(dest='S')
    try:
        pdf_bytes = pdf_str.encode('latin-1')
    except Exception:
        # Fallback to utf-8 if latin-1 fails for some reason
        pdf_bytes = pdf_str.encode('utf-8')
    return pdf_bytes

@app.route('/api/generate-cv', methods=['POST'])
def generate_cv_endpoint():
    try:
        if 'jsonData' not in request.form:
            return jsonify({"message": "Missing form data."}), 400

        cv_data = json.loads(request.form['jsonData'])
        certificate_file = request.files.get('certificate')

        is_verified, reason = verify_certificate_with_groq(certificate_file)

        if not is_verified:
            return jsonify({"message": f"Certificate Verification Failed: {reason}"}), 400

        pdf_bytes = generate_simple_cv_pdf(cv_data)

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{cv_data.get('fullName', 'resume').replace(' ', '_')}_CV.pdf"
        )
    except Exception as e:
        # Catch-all: return JSON instead of letting Flask show an HTML error page.
        import traceback
        tb = traceback.format_exc()
        print(f"Unhandled exception in generate_cv_endpoint: {e}\n{tb}")
        return jsonify({"message": "Internal server error in generate-cv endpoint.", "details": str(e), "traceback": tb}), 500


# Global handler to ensure any uncaught exceptions are returned as JSON
@app.errorhandler(Exception)
def handle_all_exceptions(e):
    try:
        # If it's an HTTPException, it has a code and description
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return jsonify({"message": e.description}), e.code
    except Exception:
        pass
    print(f"Unhandled exception: {e}")
    return jsonify({"message": "An internal server error occurred.", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)