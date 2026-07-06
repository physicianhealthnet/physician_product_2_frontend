import { AxiosInstance } from "../../utilities/AxiosInstance";

export const sendTemplateWhatsApp = async (toPhone, templateName, variables) => {
  if (!toPhone) {
    console.error("WhatsApp Error: No phone number provided");
    return;
  }

  try {
    const formattedPhone = toPhone.replace(/\D/g, "");
    const finalPhone = formattedPhone.length === 10 ? "91" + formattedPhone : formattedPhone;

    const components = [
      {
        type: "body",
        parameters: variables.map((variable) => ({
          type: "text",
          text: String(variable || "N/A"),
        })),
      },
    ];

    const payload = {
      to: finalPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          policy: "deterministic",
          code: "en",
        },
        components: components,
      },
    };

    const res = await fetch(
      "https://backend.askeva.io/v1/message/send-message?token=9a7a05bc8b2b595ad726bdaa8414d2bf3303b7b463cbbcb431729a51e4aa09a85dc57924fbe452ebe0437d4bff4d90b2af25a4d4344ca31b385f35681298e41b",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("WhatsApp Template Error:", errText);
    } else {
      console.log("WhatsApp Template sent successfully:", templateName);
      
      // Log usage for analytics in the backend
      try {
        const userData = JSON.parse(sessionStorage.getItem("user"));
        const cid = userData?.cid;
        
        if (cid) {
          await AxiosInstance.post("/whatsapp-usage/log", {
            clinicId: cid,
            templateName: templateName,
            phone: finalPhone,
            status: "success"
          });
        }
      } catch (logErr) {
        console.error("Failed to log WhatsApp usage to backend:", logErr);
      }
    }
  } catch (error) {
    console.error("Failed to send WhatsApp template:", error);
  }
};

