import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ExcelRow {
  leadSpeed: number;
  egoSpeed: number;
  distance: number; // Neue Spalte
}

@Injectable({
  providedIn: 'root'
})
export class ExcelDataService {
  private excelData = new BehaviorSubject<ExcelRow[]>([]);
  public currentIndex = new BehaviorSubject<number>(-1);

  excelData$ = this.excelData.asObservable();
  currentIndex$ = this.currentIndex.asObservable();

  setExcelData(data: ExcelRow[]) {
    this.excelData.next(data);
    this.currentIndex.next(-1);
  }

  nextRow() {
    const current = this.currentIndex.value;
    const data = this.excelData.value;
    if (data.length === 0) {
      return;
    }
    const nextIndex = current + 1 >= data.length ? 0 : current + 1; // Zyklisch
    this.currentIndex.next(nextIndex);
  }

  getCurrentRow(): ExcelRow | null {
    const index = this.currentIndex.value;
    const data = this.excelData.value;
    return index >= 0 && index < data.length ? data[index] : null;
  }

  hasExcelData(): boolean {
    return this.excelData.value.length > 0;
  }

  getExcelDataLength(): number {
    return this.excelData.value.length;
  }
}