import { SignJWT, jwtVerify } from "jose"

const getSecret = () => {
  const secret = process.env.BFF_PARTNER_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("BFF_PARTNER_SESSION_SECRET doit faire au moins 32 caractères")
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: { partenaire_id: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret())
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] })
    return payload as { partenaire_id: string; email: string }
  } catch {
    return null
  }
}
