import { message } from "antd";
import sendWhatsAppMessage from "./basicWhatsappMessageFunction";
import Button from "../ui/Button";

function CustomMessageWindow({
  targetedPatient,
  whatsAppModalVisible,
  setWhatsAppModalVisible,
}) {
  let messageText = "";

  const handleInputChange = (e) => {
    messageText = e.target.value;
  };

  return (
    <div className="w-screen h-screen bg-black/50 fixed top-0 left-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white  rounded-xl p-6 w-[90%] max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 ">
        <div>
          <h2 className="text-lg font-bold mb-4 text-slate-900 ">
            Send Message to {targetedPatient?.patientName}
          </h2>
          <textarea
            rows={5}
            className="w-full border border-slate-300  rounded-lg p-3 bg-slate-50  text-slate-900  placeholder-slate-400 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none resize-none"
            placeholder="Type your message here..."
            onChange={handleInputChange}
          ></textarea>
          <div className="flex justify-end mt-6 gap-3">
            <Button
              variant="ghost"
              onClick={() => setWhatsAppModalVisible(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!messageText.trim()) {
                  message.warning("Please enter a message");
                  return;
                }
                sendWhatsAppMessage(targetedPatient?.patientPhone, messageText);
                setWhatsAppModalVisible(false);
              }}
            >
              Send WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomMessageWindow;
