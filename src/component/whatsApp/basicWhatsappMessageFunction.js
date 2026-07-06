function sendWhatsAppMessage(phoneNumber, message) {
  if (!phoneNumber || !message) {
    console.error("Phone number and message are required");
    return;
  }

  // Remove spaces, +, - for safety
  const formattedNumber = phoneNumber.replace(/\D/g, "");

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

  window.open(whatsappURL, "_blank");
}
export default sendWhatsAppMessage;
