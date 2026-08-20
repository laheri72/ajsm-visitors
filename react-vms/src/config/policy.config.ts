/**
 * Institutional Policy Configuration for Al-Jamea-tus-Saifiyah (AJSM)
 * Visitor Management System (VMS)
 */
export const INSTITUTIONAL_POLICY = {
  /**
   * Registration Cutoff Time in 24-hour format ("HH:mm").
   * Same-day visitor registration will close after this time.
   * Example: "17:00" = 5:00 PM IST.
   * Set to null or empty string to disable the cutoff restriction.
   */
  REGISTRATION_CUTOFF_TIME: "17:00",

  /**
   * Institution Local Timezone (Mumbai / IST)
   */
  TIMEZONE: "Asia/Kolkata",

  /**
   * Rolling Barricade Window (in hours).
   * A visitor cannot register more than once using the same mobile or email
   * within this rolling window.
   */
  DUPLICATE_REGISTRATION_WINDOW_HOURS: 24,

  /**
   * Flag indicating whether email is the primary delivery channel for QR codes.
   */
  PRIMARY_EMAIL_DELIVERY: true,

  /**
   * Institution Details for Email Templates & UI Headers
   */
  INSTITUTION_NAME: "Al-Jamea-tus-Saifiyah",
  CAMPUS_LOCATION: "Marol, Mumbai",
  CONTACT_EMAIL: "vms@ajsm.edu",
};
