import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "healthfirst_webhook_secret";


  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado com sucesso!");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === "whatsapp_business_account") {
      
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          if (value.statuses) {
            for (const status of value.statuses) {
              console.log(`\n📢 STATUS ATUALIZADO: ${status.status.toUpperCase()}`);
              console.log(`🆔 ID da Mensagem: ${status.id}`);
              
              if (status.errors) {
                console.error("❌ ERRO DETALHADO DA META:", JSON.stringify(status.errors, null, 2));
              }
            }
          }

          if (value.messages) {
            for (const message of value.messages) {
               console.log(`\n📩 MENSAGEM RECEBIDA DE ${message.from}:`);
               console.log(JSON.stringify(message, null, 2));
            }
          }
        }
      }

      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    }

    return new NextResponse("Not a WhatsApp event", { status: 404 });

  } catch (error) {
    console.error("Erro no Webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}