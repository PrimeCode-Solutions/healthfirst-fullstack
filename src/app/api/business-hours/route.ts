import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const SECRET = process.env.APP_SECRET || "secret";

function verifyToken(token: string) {
  const [payload, signature] = token.split(".");
  const hmac = createHmac("sha256", SECRET);
  hmac.update(payload);
  const expected = hmac.digest("hex");

  if (signature !== expected) {
    return null;
  }
  return JSON.parse(payload);
}

function changeSettings(bodyRequest: object) {
  /* -> HERE CHANGUE SETTINGS<- */
}

export async function GET() {
  try {
    const config = {
      /* -> CONFIGURATIONS OBJECT <- */
    };
    return NextResponse.json(config, { status: 200 });
  } catch (err) {
    console.log(`GET error -> ${err}`);
    return NextResponse.json({ error: "Erro interno" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token not provided" },
        { status: 401 },
      );
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Only for Admins" }, { status: 403 });
    }

    const bodyRequest = await request.json();
    changeSettings(bodyRequest);

    return NextResponse.json(
      { message: "Horários atualizados com sucesso" },
      { status: 200 },
    );
  } catch (err) {
    console.error(`PUT error -> ${err}`);
    return NextResponse.json({ error: "Erro interno" }, { status: 400 });
  }
}
