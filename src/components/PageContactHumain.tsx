import { Clock, Send, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "./bff/Button"

export function PageContactHumain() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setDone(true)
    }, 1500)
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <Send className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black">Demande confirmée</h2>
        <p className="text-on-surface-variant text-lg">Merci, un conseiller vous contactera très prochainement.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-20 px-4">
      <div className="bg-white rounded-3xl border border-outline-variant shadow-xl p-8 md:p-12 text-center space-y-8">
        <Clock className="h-16 w-16 text-primary mx-auto" />
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-on-surface leading-tight">Votre test a bien été enregistré.</h2>
          <p className="text-lg text-on-surface-variant">
            Un conseiller vous contactera sous 24h pour valider votre positionnement et vous proposer la formation la plus adaptée.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 gap-4">
            <input 
              type="text" required placeholder="Votre prénom" 
              className="w-full h-14 px-6 rounded-xl bg-surface-container border-none font-bold"
            />
            <input 
              type="email" required placeholder="Votre email" 
              className="w-full h-14 px-6 rounded-xl bg-surface-container border-none font-bold"
            />
            <input 
              type="tel" placeholder="Votre WhatsApp (optionnel)" 
              className="w-full h-14 px-6 rounded-xl bg-surface-container border-none font-bold"
            />
          </div>
          <Button 
            disabled={isSubmitting}
            className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-2xl shadow-lg"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Confirmer mes coordonnées"}
          </Button>
        </form>
      </div>
    </div>
  )
}
