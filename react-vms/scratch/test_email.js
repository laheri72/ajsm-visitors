import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
console.log("Reading .env file from:", envPath);

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log(".env content:\n" + content);
  
  const envVars = {};
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });

  console.log("Parsed Env Vars:", envVars);

  const serviceId = envVars['VITE_EMAILJS_SERVICE_ID'];
  const templateId = envVars['VITE_EMAILJS_TEMPLATE_ID'];
  const publicKey = envVars['VITE_EMAILJS_PUBLIC_KEY'];

  console.log("\nAttempting EmailJS test fetch with:");
  console.log("Service ID:", serviceId);
  console.log("Template ID:", templateId);
  console.log("Public Key:", publicKey);

  if (publicKey === "YOUR_EMAILJS_PUBLIC_KEY") {
    console.error("\n[ERROR] VITE_EMAILJS_PUBLIC_KEY is still set to placeholder 'YOUR_EMAILJS_PUBLIC_KEY'!");
  } else {
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_name: "Ali Asghar",
            to_email: "25687@jameasaifiyah.edu",
            mobile: "7218140821",
            purpose: "VMS Integration Test",
            scheduled_date: "2026-08-21",
            scheduled_time: "10:00",
            visitor_id: "test-ref-12345",
            qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=test",
          }
        })
      });

      console.log("Response Status:", res.status);
      const text = await res.text();
      console.log("Response Text:", text);
    } catch (e) {
      console.error("Fetch Exception:", e);
    }
  }
} else {
  console.log(".env file does NOT exist at", envPath);
}
