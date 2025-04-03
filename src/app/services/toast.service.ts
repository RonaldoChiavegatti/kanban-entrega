import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"

export interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info" | "warning"
  duration: number
  priority: number
  timestamp: number
}

@Injectable({
  providedIn: "root",
})
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([])
  toasts$ = this.toasts.asObservable()
  
  private readonly MAX_VISIBLE_TOASTS = 3
  private readonly MIN_DELAY_BETWEEN_TOASTS = 1000 // 1 segundo
  private lastToastTimestamp = 0
  private toastQueue: Toast[] = []
  private processingQueue = false

  constructor() {}

  show(message: string, type: "success" | "error" | "info" | "warning" = "info", duration = 4000): void {
    const id = "toast_" + Date.now()
    const timestamp = Date.now()
    
    // Definir prioridade baseada no tipo
    const priority = this.getPriorityForType(type)
    
    const toast: Toast = { 
      id, 
      message, 
      type, 
      duration,
      priority,
      timestamp
    }

    // Adicionar à fila
    this.toastQueue.push(toast)
    
    // Ordenar fila por prioridade (maior prioridade primeiro)
    this.toastQueue.sort((a, b) => b.priority - a.priority)
    
    // Processar a fila se ainda não estiver processando
    if (!this.processingQueue) {
      this.processToastQueue()
    }
  }

  private getPriorityForType(type: string): number {
    switch (type) {
      case 'error':
        return 3
      case 'warning':
        return 2
      case 'success':
        return 1
      default:
        return 0
    }
  }

  private processToastQueue(): void {
    if (this.toastQueue.length === 0) {
      this.processingQueue = false
      return
    }

    this.processingQueue = true
    const currentToasts = this.toasts.value
    const now = Date.now()

    // Verificar se há tempo suficiente desde o último toast
    if (now - this.lastToastTimestamp < this.MIN_DELAY_BETWEEN_TOASTS) {
      setTimeout(() => this.processToastQueue(), this.MIN_DELAY_BETWEEN_TOASTS)
      return
    }

    // Pegar o próximo toast da fila
    const nextToast = this.toastQueue.shift()
    if (!nextToast) {
      this.processingQueue = false
      return
    }

    // Verificar se já existe um toast similar
    const similarToast = currentToasts.find(t => 
      t.message === nextToast.message && 
      t.type === nextToast.type &&
      now - t.timestamp < 5000 // Considerar similar se apareceu nos últimos 5 segundos
    )

    if (similarToast) {
      // Se encontrar um toast similar, atualizar o timestamp e continuar processando
      similarToast.timestamp = now
      this.toasts.next([...currentToasts])
      setTimeout(() => this.processToastQueue(), this.MIN_DELAY_BETWEEN_TOASTS)
      return
    }

    // Adicionar o novo toast
    const updatedToasts = [...currentToasts, nextToast]
    
    // Manter apenas os toasts mais recentes e com maior prioridade
    if (updatedToasts.length > this.MAX_VISIBLE_TOASTS) {
      updatedToasts.sort((a, b) => {
        // Primeiro ordenar por prioridade
        if (b.priority !== a.priority) {
          return b.priority - a.priority
        }
        // Se tiverem a mesma prioridade, ordenar por timestamp
        return b.timestamp - a.timestamp
      })
      
      // Manter apenas os MAX_VISIBLE_TOASTS mais recentes
      updatedToasts.splice(this.MAX_VISIBLE_TOASTS)
    }

    this.toasts.next(updatedToasts)
    this.lastToastTimestamp = now

    // Remover o toast após a duração
    setTimeout(() => {
      this.remove(nextToast.id)
    }, nextToast.duration)

    // Processar o próximo toast da fila
    setTimeout(() => this.processToastQueue(), this.MIN_DELAY_BETWEEN_TOASTS)
  }

  remove(id: string): void {
    this.toasts.next(this.toasts.value.filter((toast) => toast.id !== id))
  }
}

