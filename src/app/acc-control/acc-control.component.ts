import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccService, SimulationData, AdjustmentResult } from '../acc.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
  private simulationSubscription?: Subscription;

  constructor(private accService: AccService) { }

  ngOnInit(): void { }

  toggleAcc(): void {
    if (!this.isRunning) {
      this.status = 'Simulation läuft';
      this.isRunning = true;
      this.isAdjusting = false;
      this.adjustmentMessage = '';
      this.startSimulation();
      this.resetCarPositions();
    } else {
      this.accService.stopAndReset().subscribe(
        (data: SimulationData) => {
          this.simulationData = data;
          this.status = 'Simulation ist aus';
          this.isRunning = false;
          this.isAdjusting = false;
          this.adjustmentMessage = '';
          this.stopSimulation();
          this.resetCarPositions();
        },
        error => {
          this.status = 'Fehler beim Stoppen';
          console.error(error);
        }
      );
    }
  }

  adjustSpeed(): void {
    this.accService.adjustSpeed().subscribe(
      (result: AdjustmentResult) => {
        this.simulationData = {
          egoSpeed: result.egoSpeed,
          leadSpeed: result.leadSpeed,
          distance: result.distance,
          weatherCondition: this.simulationData.weatherCondition,
          temperature: this.simulationData.temperature,
          windSpeed: this.simulationData.windSpeed,
          city: this.simulationData.city,
          weatherIcon: this.simulationData.weatherIcon
        };
        this.adjustmentMessage = result.action;
        this.isAdjusting = true;
        this.updateCarPositions();
      },
      error => {
        this.status = 'Fehler beim Anpassen';
        this.adjustmentMessage = 'Fehler';
        console.error(error);
      }
    );
  }

  triggerStrongBraking(): void {
    this.accService.triggerStrongBraking().subscribe(
      (data: SimulationData) => {
        this.simulationData = data;
        this.adjustmentMessage = 'Starkes Abbremsen ausgelöst';
        this.startBrakingAnimation();
      },
      error => {
        this.status = 'Fehler beim Bremsen';
        this.adjustmentMessage = 'Fehler';
        console.error(error);
      }
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
      error => {
        this.status = 'Fehler beim Wetter Toggle';
        this.adjustmentMessage = 'Fehler';
        console.error(error);
      }
    );
  }

  toggleRain(): void {
    this.isWeatherOn = true;
    this.isAdjusting = true;
    this.simulationData.weatherCondition = "Rain";
    this.simulationData.weatherIcon = "10d";
    console.log("Rain aktiviert - Weather: " + this.simulationData.weatherCondition); // Debugging
    this.accService.toggleWeather(true).subscribe(
      (data: SimulationData) => {
        this.simulationData = data;
        console.log("Nach Backend - Weather: " + this.simulationData.weatherCondition); // Debugging
        this.updateCarPositions();
      },
      error => {
        this.status = 'Fehler beim Regen';
        this.adjustmentMessage = 'Fehler';
        console.error(error);
      }
    );
  }

  startSimulation(): void {
    this.simulationSubscription = interval(100)
      .pipe(switchMap(() => this.accService.runSimulation(0.1)))
      .subscribe(
        data => {
          this.simulationData = data;
          if (this.adjustmentMessage && data.distance >= 6.0 && data.distance <= 8.0 && this.isAdjusting && 
              !(this.isWeatherOn && this.simulationData.weatherCondition === "Rain")) {
            this.adjustmentMessage = 'Abstand stabil gehalten';
          }
          if (this.isAdjusting) {
            this.updateCarPositions();
          }
        },
        error => {
          this.status = 'Fehler in der Simulation';
          console.error(error);
        }
      );
  }

  stopSimulation(): void {
    this.simulationSubscription?.unsubscribe();
  }

  isDistanceOptimal(): boolean {
    return this.simulationData.distance >= 5.0 && this.simulationData.distance <= 8.0; // Grün ohne Regen
  }

  isDistanceCritical(): boolean {
    return this.simulationData && this.simulationData.distance < 4.5 && this.simulationData.distance !== 0; // Rot
  }

  isDistanceRainOptimal(): boolean { // Blau bei Regen, neuer Bereich 15–18 Meter
    return this.isWeatherOn && this.simulationData.weatherCondition === "Rain" && 
           this.simulationData.distance >= 15.0 && this.simulationData.distance <= 18.0;
  }

  ngOnDestroy(): void {
    this.stopSimulation();
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
