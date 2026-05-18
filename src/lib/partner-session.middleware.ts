import { createMiddleware } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { verifySession } from "./partner-session"

export const requirePartnerSession = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest()
    const cookieHeader = request?.headers?.get("cookie") || ""
    
    // Parse cookies safely
    const cookies: Record<string, string> = {}
    if (cookieHeader) {
      cookieHeader.split(";").forEach((c) => {
        const parts = c.trim().split("=")
        const name = parts[0]
        const value = parts.slice(1).join("=")
        if (name) {
          cookies[name] = value
        }
      })
    }
    const token = cookies["bff_partner_session"]

    if (!token) {
      throw new Error("Session partenaire requise")
    }

    const payload = await verifySession(token)
    if (!payload) {
      throw new Error("Session partenaire invalide ou expirée")
    }

    return next({
      context: {
        partenaire_id: payload.partenaire_id,
        partner_email: payload.email,
      },
    })
  }
)
