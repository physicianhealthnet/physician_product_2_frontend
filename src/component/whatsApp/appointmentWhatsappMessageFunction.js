function sendAppointmentWhatsApp(patientName, phone, date, time) {
  const message = `Hello ${patientName},

Your physician appointment is confirmed.
🗓 Date: ${date}
⏰ Time: ${time}

Please arrive 10 minutes early.
Thank you!`;

  sendWhatsAppMessage(phone, message);
}
export default sendAppointmentWhatsApp;