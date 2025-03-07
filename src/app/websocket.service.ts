import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { SimulationData } from './acc.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private dataSubject = new Subject<SimulationData>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    } 
  }

  private connect(): void {
    const url = 'ws://localhost:8080/simulation';
    console.log(`Versuche, WebSocket zu verbinden mit ${url}`);

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket-Verbindung erfolgreich geöffnet');
        this.reconnectAttempts = 0; // Reset bei Erfolg
        this.sendMessage('Ping'); // Testnachricht
      };

      this.socket.onmessage = (event) => {
        console.log('Rohe WebSocket-Daten:', event.data); // Logge die unverarbeiteten Daten
        try {
            const data: SimulationData = JSON.parse(event.data);
            console.log('Empfangene WebSocket-Daten:', data);
            this.dataSubject.next(data);
        } catch (e) {
            console.error('Fehler beim Parsen der WebSocket-Daten:', e, 'Daten:', event.data);
        }
    };

      this.socket.onerror = (error) => {
        console.error('WebSocket-Fehler:', error);
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket-Verbindung geschlossen:', event.code, event.reason);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Wiederverbindungsversuch ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
          setTimeout(() => this.connect(), 1000); // Wiederverbinden nach 1 Sekunde
          this.reconnectAttempts++;
        } else {
          console.error('Maximale Wiederverbindungsversuche erreicht');
        }
      };
    } catch (e) {
      console.error('Fehler beim Erstellen des WebSocket:', e);
    }
  }

  getSimulationData(): Observable<SimulationData> {
    return this.dataSubject.asObservable();
  }

  sendMessage(message: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      console.log('Nachricht gesendet:', message);
    }
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      console.log('WebSocket manuell geschlossen');
    }
  }
}