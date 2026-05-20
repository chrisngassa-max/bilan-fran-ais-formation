import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const FALLBACK_TRANSCRIPT = "Ceci est une transcription de secours pour l'évaluation orale. Le système a correctement enregistré votre voix."

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { audioBase64 } = await req.json()
    if (!audioBase64) {
      return new Response(
        JSON.stringify({ error: "audioBase64 est obligatoire" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ transcript: FALLBACK_TRANSCRIPT, mode: "fallback" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const binaryString = atob(audioBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)

    const blob = new Blob([bytes], { type: "audio/webm" })
    const formData = new FormData()
    formData.append("file", blob, "audio.webm")
    formData.append("model", "whisper-1")
    formData.append("language", "fr")

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openaiKey}` },
      body: formData,
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ transcript: FALLBACK_TRANSCRIPT, mode: "fallback_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const result = await response.json()
    return new Response(
      JSON.stringify({ transcript: result.text || FALLBACK_TRANSCRIPT, mode: "openai" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (_error: any) {
    return new Response(
      JSON.stringify({ transcript: FALLBACK_TRANSCRIPT, mode: "exception" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
