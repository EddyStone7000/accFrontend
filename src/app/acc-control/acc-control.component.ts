import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccService, SimulationData, AdjustmentResult } from '../acc.service';
import { WebSocketService } from '../websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-acc-control',
  templateUrl: './acc-control.component.html',
  styleUrls: ['./acc-control.component.css']
})
export class AccControlComponent implements OnInit, OnDestroy {
  status: string = 'Simulation ist aus';
  isRunning: boolean = false;
  isWeatherOn: boolean = false;
  isAdjusting: boolean = false;
  isRainActive: boolean = false;
  simulationData: SimulationData = {
    egoSpeed: 0,
    leadSpeed: 0,
    distance: 0,
    weatherCondition: 'Clear',
    temperature: 0,
    windSpeed: 0,
    city: 'Berlin',
    weatherIcon: '01d'
  };
  adjustmentMessage: string = '';
  private webSocketSubscription?: Subscription;

  constructor(private accService: AccService, private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.webSocketSubscription = this.webSocketService.getSimulationData().subscribe(
      (data: SimulationData) => {
        this.simulationData = data;
        if (this.isAdjusting) {
          this.updateCarPositions();
        }
      },
      error => {
        this.status = 'Fehler in der WebSocket-Verbindung';
        console.error(error);
      }
    );
  }

  toggleAcc(): void {
    if (!this.isRunning) {
      this.status = 'Simulation läuft';
      this.isRunning = true;
      this.accService.runSimulation(0.1).subscribe(
        (data: SimulationData) => {
          this.simulationData = data; // Initiale Daten von HTTP
          this.resetCarPositions();
        },
        error => console.error('Fehler beim Starten der Simulation:', error)
      );
    } else {
      this.accService.stopAndReset().subscribe(
        (data: SimulationData) => {
          this.simulationData = data;
          this.status = 'Simulation ist aus';
          this.isRunning = false;
          this.isAdjusting = false;
          this.isRainActive = false;
          this.adjustmentMessage = '';
          this.resetCarPositions();
        },
        error => console.error('Fehler beim Stoppen der Simulation:', error)
      );
    }
  }

  adjustSpeed(): void {
    this.accService.adjustSpeed().subscribe(
      (result: AdjustmentResult) => {
        this.adjustmentMessage = result.action;
        this.isAdjusting = true;
        this.updateCarPositions();
      },
      error => console.error('Fehler beim Anpassen der Geschwindigkeit:', error)
    );
  }

  triggerStrongBraking(): void {
    this.accService.triggerStrongBraking().subscribe(
      (data: SimulationData) => {
        this.simulationData = data;
        this.adjustmentMessage = 'Starkes Abbremsen ausgelöst';
        this.startBrakingAnimation();
      },
      error => console.error('Fehler beim starken Bremsen:', error)
    );
  }

  toggleWeather(): void {
    this.isWeatherOn = !this.isWeatherOn;
    this.accService.toggleWeather(this.isWeatherOn).subscribe(
      (data: SimulationData) => {
        this.simulationData = data;
        this.adjustmentMessage = this.isWeatherOn ? 'Wetter aktiviert' : 'Wetter deaktiviert';
        if (this.isAdjusting) {
          this.updateCarPositions();
        }
      },
      error => console.error('Fehler beim Umschalten des Wetters:', error)
    );
  }

  toggleRain(): void {
    this.isRainActive = !this.isRainActive;
    this.accService.toggleRain(this.isRainActive).subscribe(
      (data: SimulationData) => {
        this.simulationData = data;
        this.adjustmentMessage = this.isRainActive ? 'Regen simuliert' : 'Regen aus';
        this.updateCarPositions();
      },
      error => console.error('Fehler beim Umschalten des Regens:', error)
    );
  }

  ngOnDestroy(): void {
    this.webSocketSubscription?.unsubscribe();
    this.webSocketService.close();
  }

  isDistanceOptimal(): boolean {
    return this.simulationData.distance >= 5.0 && this.simulationData.distance <= 8.0;
  }

  isDistanceCritical(): boolean {
    return this.simulationData.distance < 6.0 && this.simulationData.distance !== 0;
  }

  isDistanceRainOptimal(): boolean {
    return this.isRainActive && this.simulationData.distance >= 9.0 && this.simulationData.distance <= 11.0;
  }

  private startBrakingAnimation(): void {
    const egoCar = document.getElementById('ego-car');
    if (egoCar) {
      egoCar.style.transition = 'top 1s ease-in-out';
      const distanceInPixels = this.simulationData.distance * 10;
      egoCar.style.top = `${50 + distanceInPixels}px`;
    }
  }

  private updateCarPositions(): void {
    const leadCar = document.getElementById('lead-car');
    const egoCar = document.getElementById('ego-car');
    if (leadCar && egoCar) {
      const distanceInPixels = this.simulationData.distance * 10;
      leadCar.style.top = '50px';
      egoCar.style.transition = '';
      egoCar.style.top = `${50 + distanceInPixels}px`;
    }
  }

  private resetCarPositions(): void {
    const leadCar = document.getElementById('lead-car');
    const egoCar = document.getElementById('ego-car');
    if (leadCar && egoCar) {
      leadCar.style.top = '50px';
      egoCar.style.top = '300px';
      egoCar.style.transition = '';
    }
  }
}