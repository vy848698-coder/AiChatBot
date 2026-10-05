// Clans Machina's contact numbers, used by every Call / WhatsApp button.
//
// WHATSAPP_NUMBER: the WhatsApp chat the customer's details are sent to when
// they tap "WhatsApp". Digits only, with the country code (91…), no "+".
// To test, put your own number here; then put back the client's number.
export const WHATSAPP_NUMBER = "919124165341";

export const PHONE = { tel: "+919124165341", show: "+91 91241 65341" };
export const TOLL_FREE = { tel: "18008913731", show: "1800 891 3731" };

// Opens WhatsApp (app on phones, WhatsApp Web on desktop) with the message
// typed in; the customer only taps Send.
export const whatsAppLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
