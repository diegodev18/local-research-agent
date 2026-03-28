import { useEffect, useRef, useState } from "react"
import { SendIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { ChatMessageMarkdown } from "@/components/chat/ChatMessageMarkdown"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type ChatRole = "user" | "assistant"

type ChatMessage = {
  role: ChatRole
  content: string
}

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ""

export function ResearchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus()
    }
  }, [loading])

  useEffect(() => {
    if (messages.length > 0 && viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, loading])

  async function sendMessage() {
    const text = draft.trim()
    if (!text || loading) return

    const historyPayload = messages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      content: m.content,
    }))

    setDraft("")
    setError(null)
    setMessages((m) => [...m, { role: "user", content: text }])
    setLoading(true)

    try {
      const res = await fetch(`${apiBase}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      })

      const data: unknown = await res.json().catch(() => ({}))
      const errMsg =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : null

      if (!res.ok) {
        setError(errMsg ?? `Error ${res.status}`)
        return
      }

      const reply =
        typeof data === "object" &&
        data !== null &&
        "reply" in data &&
        typeof (data as { reply: unknown }).reply === "string"
          ? (data as { reply: string }).reply
          : ""

      setMessages((m) => [...m, { role: "assistant", content: reply }])
    } catch {
      setError("No se pudo conectar con el servidor. ¿Está la API en marcha?")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendMessage()
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center bg-background p-4">
      <Card className="flex h-[calc(100dvh-2rem)] w-full max-w-3xl min-h-0 flex-col">
        <CardHeader className="shrink-0 border-b">
          <CardTitle>Local Research Agent</CardTitle>
          <CardDescription>
            Pregunta sobre el workspace que usa la API (carpeta local o repositorio clonado).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-0 pt-4">
          {error ? (
            <div className="px-4">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : null}
          <ScrollArea viewportRef={viewportRef} className="min-h-0 flex-1 px-4">
            <div className="flex flex-col gap-3 pb-4">
              {messages.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Escribe un mensaje para empezar.
                </p>
              ) : null}
              {messages.map((msg, i) => (
                <div
                  key={`${i}-${msg.role}`}
                  className={cn(
                    "max-w-[85%] rounded-none border border-border px-3 py-2 text-xs",
                    msg.role === "user"
                      ? "ml-auto bg-muted/50"
                      : "mr-auto bg-card"
                  )}
                >
                  <span className="mb-1 block text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {msg.role === "user" ? "Tú" : "Asistente"}
                  </span>
                  <ChatMessageMarkdown>{msg.content}</ChatMessageMarkdown>
                </div>
              ))}
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Spinner />
                  Pensando…
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="shrink-0 flex-col items-stretch gap-3 border-t">
          <form onSubmit={handleSubmit} className="w-full">
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="chat-message">Mensaje</FieldLabel>
                <Textarea
                  id="chat-message"
                  ref={inputRef}
                  name="message"
                  value={draft}
                  onChange={(ev) => setDraft(ev.target.value)}
                  placeholder="P. ej.: ¿Qué hace el agente en apps/api?"
                  rows={3}
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                  className="resize-none"
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" && !ev.shiftKey) {
                      ev.preventDefault()
                      void sendMessage()
                    }
                  }}
                />
                <FieldDescription>
                  Enter envía; Shift+Enter nueva línea.
                </FieldDescription>
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading || !draft.trim()}>
                  Enviar
                  <SendIcon data-icon="inline-end" />
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardFooter>
      </Card>
      <footer className="shrink-0 py-2 text-center text-[10px] text-muted-foreground">
        Construido por{" "}
        <a
          href="https://www.youtube.com/@diegodev_18"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Diego Sanchez
        </a>
        , desarrollador en{" "}
        <a
          href="https://talktokai.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          kAI
        </a>
      </footer>
    </div>
  )
}
