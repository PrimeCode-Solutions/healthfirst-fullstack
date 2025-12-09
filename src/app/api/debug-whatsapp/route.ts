import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const version = process.env.META_API_VERSION || "v21.0";


  const baseNumber = "82996518468";

  if (!token || !phoneId) {
    return NextResponse.json({ error: "Faltam credenciais no .env" }, { status: 500 });
  }

  const results = [];
  

  const target1 = `55${baseNumber}`;
  

  let target2 = "";
  if (baseNumber.length === 11) {
     target2 = `55${baseNumber.substring(0, 2)}${baseNumber.substring(3)}`; 
  } else {
     target2 = `55${baseNumber.substring(0, 2)}9${baseNumber.substring(2)}`; 
  }

  const targets = [target1, target2];

  console.log("🔍 Iniciando Diagnóstico WhatsApp...");

  for (const phone of targets) {
    console.log(`Tentando enviar para: ${phone}...`);
    
    try {
      const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: "hello_world", 
            language: { code: "en_US" } 
          },
        }),
      });

      const data = await response.json();
      results.push({ phone, status: response.status, data });
      
    } catch (error: any) {
      results.push({ phone, error: error.message });
    }
  }

  return NextResponse.json({ 
    info: "Teste disparado para múltiplas variações. Verifique seu WhatsApp.",
    results 
  });
}