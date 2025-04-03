import { Injectable } from "@angular/core"
import { BehaviorSubject, debounceTime, distinctUntilChanged, map } from "rxjs"

export interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info" | "warning"
  duration: number
  timestamp: number
}

@Injectable({
  providedIn: "root",
})
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([])
  toasts$ = this.toasts.asObservable()
  private lastToastMessage: string | null = null
  private lastToastTime: number = 0
  private readonly TOAST_COOLDOWN = 3000 // 3 segundos entre mensagens similares
  private readonly MAX_TOASTS = 3 // Máximo de toasts simultâneos

  constructor() {}

  show(message: string, type: "success" | "error" | "info" | "warning" = "info", duration = 4000): void {
    const now = Date.now()
    
    // Verificar se é uma mensagem similar à última mostrada
    if (this.lastToastMessage === message) {
      // Se for uma mensagem de erro ou warning, sempre mostrar
      if (type === "error" || type === "warning") {
        this.addToast(message, type, duration, now)
      } else {
        // Para outros tipos, verificar o cooldown
        if (now - this.lastToastTime < this.TOAST_COOLDOWN) {
          return // Ignorar mensagens similares dentro do cooldown
        }
      }
    } else {
      // Nova mensagem, resetar o cooldown
      this.lastToastMessage = message
      this.lastToastTime = now
    }

    this.addToast(message, type, duration, now)
  }

  private addToast(message: string, type: "success" | "error" | "info" | "warning", duration: number, timestamp: number): void {
    const id = "toast_" + timestamp
    const toast: Toast = { id, message, type, duration, timestamp }

    // Manter apenas os últimos MAX_TOASTS toasts
    const currentToasts = this.toasts.value
    if (currentToasts.length >= this.MAX_TOASTS) {
      // Remover o toast mais antigo
      currentToasts.shift()
    }

    this.toasts.next([...currentToasts, toast])

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id)
    }, duration)
  }

  remove(id: string): void {
    this.toasts.next(this.toasts.value.filter((toast) => toast.id !== id))
  }

  // Método para limpar todos os toasts
  clearAll(): void {
    this.toasts.next([])
    this.lastToastMessage = null
    this.lastToastTime = 0
  }
}

