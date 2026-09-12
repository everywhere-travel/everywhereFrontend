import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AsistenteService } from '../../../core/service/asistente/asistente.service';
import { AuthServiceService } from '../../../core/service/auth/auth.service';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.css']
})
export class ChatbotWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  private asistenteService = inject(AsistenteService);
  protected authService = inject(AuthServiceService);
  private subscription = new Subscription();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  isLoading = false;
  inputMessage = '';

  messages: Message[] = [];
  suggestions: string[] = [
    '¿Qué cotizaciones tengo pendientes?',
    '¿Cuáles vencen pronto?',
    '¿Qué cotizaciones faltan liquidar?',
    'Ayúdame a redactar un seguimiento'
  ];

  private shouldScroll = false;

  ngOnInit(): void {
    const userName = this.authService.getUser()?.name || 'Asesor';
    this.messages.push({
      sender: 'bot',
      text: `¡Hola **${userName}**! 👋 Soy **EveryBot**, tu asistente inteligente en EveryWhere Travel.\n\nPuedo ayudarte a consultar tus **cotizaciones pendientes**, **vencimientos próximos** o **tareas administrativas** en tiempo real.`,
      time: this.getCurrentTime()
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
    }
  }

  sendMessage(textToSend?: string): void {
    const text = (textToSend || this.inputMessage).trim();
    if (!text || this.isLoading) {
      return;
    }

    // Agregar mensaje del usuario
    this.messages.push({
      sender: 'user',
      text,
      time: this.getCurrentTime()
    });

    this.inputMessage = '';
    this.isLoading = true;
    this.shouldScroll = true;

    this.subscription.add(
      this.asistenteService.sendMessage(text).subscribe({
        next: (res) => {
          this.messages.push({
            sender: 'bot',
            text: res.reply || 'No obtuve respuesta en este momento.',
            time: this.getCurrentTime()
          });
          if (res.suggestions && res.suggestions.length > 0) {
            this.suggestions = res.suggestions;
          }
          this.isLoading = false;
          this.shouldScroll = true;
        },
        error: (err) => {
          console.error('Error en asistente:', err);
          this.messages.push({
            sender: 'bot',
            text: '⚠️ Ocurrió un inconveniente al consultar con el asistente. Por favor, intenta de nuevo.',
            time: this.getCurrentTime()
          });
          this.isLoading = false;
          this.shouldScroll = true;
        }
      })
    );
  }

  selectSuggestion(suggestion: string): void {
    this.sendMessage(suggestion);
  }

  formatMarkdown(text: string): string {
    if (!text) return '';
    
    // Escapar etiquetas HTML básicas para seguridad
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Negritas **texto**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Cursivas *texto*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Saltos de línea
    formatted = formatted.replace(/\n/g, '<br/>');

    // Viñetas simples •
    formatted = formatted.replace(/• (.*?)(<br\/>|$)/g, '<span class="inline-block ml-2">• $1</span><br/>');

    return formatted;
  }

  private getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Ignorar
    }
  }
}
