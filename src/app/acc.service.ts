import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccService {
  private apiUrl = 'http://localhost:8080'; // Deine Backend-URL

  constructor(private http: HttpClient) { }

  runSimulation(simulationData: SimulationData): Observable<SimulationData> {
    return this.http.post<SimulationData>(`${this.apiUrl}/run`, simulationData);
  }

  adjustSpeed(): Observable<AdjustmentResult> {
    return this.http.get<AdjustmentResult>(`${this.apiUrl}/adjust`);
  }

  stopAndReset(): Observable<SimulationData> {
    return this.http.get<SimulationData>(`${this.apiUrl}/stop`);
  }

  triggerStrongBraking(): Observable<SimulationData> {
    return this.http.get<SimulationData>(`${this.apiUrl}/brake`);
  }

  toggleWeather(active: boolean): Observable<SimulationData> {
    return this.http.get<SimulationData>(`${this.apiUrl}/weatherToggle?active=${active}`);
  }

  toggleRain(rain: boolean): Observable<SimulationData> { // Neue Methode
    return this.http.get<SimulationData>(`${this.apiUrl}/rain?rain=${rain}`);
  }
}

export interface SimulationData {
  egoSpeed: number;
  leadSpeed: number;
  distance: number;
  weatherCondition: string;
  temperature: number;
  windSpeed: number;
  city: string;
  weatherIcon: string;
}

export interface AdjustmentResult {
  egoSpeed: number;
  leadSpeed: number;
  distance: number;
  action: string;
}