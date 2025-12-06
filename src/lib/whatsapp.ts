interface WhatsAppTemplateParams {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: any[];
  }
  
  // Função genérica de envio
  export async function sendWhatsAppMessage({
    to,
    templateName,
    languageCode = "pt_BR", // Mudamos o padrão para pt_BR
    components,
  }: WhatsAppTemplateParams) {
    const apiVersion = process.env.META_API_VERSION || "v21.0";
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_API_TOKEN;
  
    if (!phoneId || !token) {
      throw new Error("Credenciais do WhatsApp não configuradas no .env");
    }
  
    // Tratamento básico do número: remove não-dígitos
    let cleanPhone = to.replace(/\D/g, "");
  
    // Garante o código do país (55 para Brasil) se não tiver
    if (!cleanPhone.startsWith("55") && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }
  
    const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
  
    const payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: components || [],
      },
    };
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("Erro Meta API:", JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || "Erro ao enviar mensagem");
      }
  
      return data;
    } catch (error) {
      console.error("Erro no serviço WhatsApp:", error);
      throw error;
    }
  }
  
  // Função específica para o lembrete
  export async function sendAppointmentReminder(
    phone: string,
    patientName: string,
    appointmentTime: string
  ) {
    return sendWhatsAppMessage({
      to: phone,
      templateName: "lembrete_consulta",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: patientName },     // Variável {{1}}
            { type: "text", text: appointmentTime }, // Variável {{2}}
          ],
        },
      ],
    });
  }