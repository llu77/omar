# **App Name**: Wassel TeleRehab

## Core Features:

- Secure Authentication: Secure user registration and login system with bcrypt password hashing.
- Patient Assessment Form: Assessment form for entering patient details including medical history, neck control, trunk control, standing, walking, medications and fractures.
- AI-Powered Rehab Plan Generation: Generates a detailed 12-week rehabilitation plan using the OpenAI API based on the entered patient assessment data including expected recovery rate, precautions, and review appointments. The tool is used to consider if certain pieces of patient information should influence the rehab plan.
- Secure Report Saving: Saves patient reports with AES-256 encryption in the database, ensuring patient data confidentiality.
- Report Retrieval: Report retrieval page allowing authorized users to access stored reports by entering the patient's unique file number.
- Unique File Number Generation: Generation of unique file numbers based on date and incrementing sequence number. This number helps track patients over time.
- Responsive Design with RTL: Responsive web design that provides a consistent and intuitive experience across devices of different sizes.  RTL support.

## Style Guidelines:

- Primary color: Medical Blue (#3391CC) for a calm and professional feel.
- Background color: Light-Tinted Blue (#E0F0F8) creates a soothing and clean backdrop.
- Accent color: Muted Green (#29AB87) for emphasis and positive reinforcement.
- Body and headline font: 'PT Sans' (sans-serif) offers readability and a modern look for both headings and body text.
- Clean and professional layout with intuitive navigation to enhance usability, RTL support.
- Use of simple, clear icons to represent different functionalities within the app.
- Subtle transitions and animations for a smooth user experience.