import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { INSTITUTIONAL_POLICY } from "../config/policy.config";

export interface EmailDeliveryResult {
  success: boolean;
  message: string;
  queuedId?: string;
  error?: string;
}

// EmailJS Environment Variables
const EMAILJS_SERVICE_ID = (import.meta.env.VITE_EMAILJS_SERVICE_ID as string) || "service_23ldqm8";
const EMAILJS_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string) || "template_iuhy5p4";
const EMAILJS_PUBLIC_KEY = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string) || "KBZ0nhC6oDfo2WIq8";

/**
 * Delivers visitor pass and QR code email via EmailJS (connected to vms.ajsm@gmail.com)
 * and queues backup log to Firestore /mail collection.
 */
export async function sendVisitorQREmail(visitor: {
  id: string;
  name: string;
  email: string;
  mobile: string;
  purpose: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: string;
}): Promise<EmailDeliveryResult> {
  if (!visitor.email) {
    return {
      success: false,
      message: "No email address provided for QR code delivery.",
      error: "Missing email",
    };
  }

  const qrPayload = JSON.stringify({
    visitorId: visitor.id,
    scheduledDate: visitor.scheduledDate,
  });

  // Generate QR code image URL for inline HTML viewing
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrPayload
  )}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5efe3; margin: 0; padding: 20px; color: #1B1B1B; }
        .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 2px solid #3E2723; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .header { background: #3E2723; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #E8DCC8; }
        .header p { margin: 4px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 24px; text-align: center; }
        .qr-box { background: #ffffff; border: 2px dashed #3E2723; border-radius: 12px; padding: 16px; display: inline-block; margin: 16px 0; }
        .qr-box img { width: 200px; height: 200px; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 16px; text-align: left; }
        .details-table td { padding: 10px 12px; border-bottom: 1px solid #E8DCC8; font-size: 14px; }
        .details-table td.label { font-weight: 600; color: #3E2723; width: 40%; }
        .footer { background: #E8DCC8; padding: 16px; text-align: center; font-size: 12px; color: #3E2723; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${INSTITUTIONAL_POLICY.INSTITUTION_NAME}</h1>
          <p>${INSTITUTIONAL_POLICY.CAMPUS_LOCATION} — Visitor Pass</p>
        </div>
        <div class="content">
          <h2 style="color: #3E2723; margin-top: 0;">Official Entry QR Pass</h2>
          <p style="font-size: 14px; color: #555;">Present this QR code at the reception desk upon your arrival.</p>
          
          <div class="qr-box">
            <img src="${qrImageUrl}" alt="Visitor QR Code" />
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Visitor Name:</td>
              <td><strong>${visitor.name}</strong></td>
            </tr>
            <tr>
              <td class="label">Mobile Number:</td>
              <td>${visitor.mobile}</td>
            </tr>
            <tr>
              <td class="label">Scheduled Date:</td>
              <td>${visitor.scheduledDate}</td>
            </tr>
            <tr>
              <td class="label">Scheduled Time:</td>
              <td>${visitor.scheduledTime} IST</td>
            </tr>
            <tr>
              <td class="label">Purpose of Visit:</td>
              <td>${visitor.purpose}</td>
            </tr>
            <tr>
              <td class="label">Visitor Reference ID:</td>
              <td style="font-family: monospace; font-size: 12px;">${visitor.id}</td>
            </tr>
          </table>
        </div>
        <div class="footer">
          Please carry a valid photo ID. This pass is valid for ${visitor.scheduledDate} only.<br/>
          Questions? Contact ${INSTITUTIONAL_POLICY.CONTACT_EMAIL}
        </div>
      </div>
    </body>
    </html>
  `;

  let emailJsSent = false;
  let emailJsError = "";

  // Diagnostic check
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === "YOUR_EMAILJS_PUBLIC_KEY") {
    emailJsError = "Please replace YOUR_EMAILJS_PUBLIC_KEY in react-vms/.env with your real Public Key from dashboard.emailjs.com/admin/account.";
  } else if (!EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID === "template_ajsm_vms") {
    emailJsError = "Please set VITE_EMAILJS_TEMPLATE_ID in react-vms/.env to your Template ID from dashboard.emailjs.com/admin/templates.";
  } else {
    // Attempt Real Email Delivery via EmailJS REST API
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_name: visitor.name,
            to_email: visitor.email,
            mobile: visitor.mobile,
            purpose: visitor.purpose,
            scheduled_date: visitor.scheduledDate,
            scheduled_time: visitor.scheduledTime,
            visitor_id: visitor.id,
            qr_code_url: qrImageUrl,
          },
        }),
      });

      if (res.ok) {
        emailJsSent = true;
      } else {
        const errorText = await res.text();
        emailJsError = `EmailJS API returned ${res.status}: ${errorText}`;
      }
    } catch (err: any) {
      emailJsError = err.message || "Failed to reach EmailJS API";
    }
  }

  // Always Queue Log Document in Firestore /mail
  try {
    const mailRef = await addDoc(collection(db, "mail"), {
      to: [visitor.email],
      message: {
        subject: `[${INSTITUTIONAL_POLICY.INSTITUTION_NAME}] Entry QR Pass — ${visitor.name}`,
        text: `Dear ${visitor.name}, your visitor pass for ${visitor.scheduledDate} at ${visitor.scheduledTime} IST is confirmed. Pass ID: ${visitor.id}.`,
        html: htmlContent,
      },
      emailJsSent,
      createdAt: serverTimestamp(),
      visitorId: visitor.id,
    });

    return {
      success: true,
      message: emailJsSent
        ? `QR Pass successfully sent to ${visitor.email} via vms.ajsm@gmail.com`
        : `QR Pass generated for ${visitor.email}. ${emailJsError ? `(${emailJsError})` : ""}`,
      queuedId: mailRef.id,
    };
  } catch (err: any) {
    return {
      success: true,
      message: `QR Pass created for ${visitor.email}.`,
      error: err.message,
    };
  }
}
