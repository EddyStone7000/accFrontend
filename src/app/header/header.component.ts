// header.component.ts
import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { ExcelDataService, ExcelRow } from '../excel-data.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Output() saveLogs = new EventEmitter<void>();
  @Output() excelDataLoaded = new EventEmitter<ExcelRow[]>(); // Neues Event
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private excelDataService: ExcelDataService) {}

  uploadExcel() {
    if (!this.fileInput || !this.fileInput.nativeElement) {
      console.error('File input element not found!');
      return;
    }
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array((e.target as FileReader).result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const excelRows = jsonData.slice(1).map(row => ({
          leadSpeed: Number(row[0]) || 0,  // Spalte 1: LeadSpeed
          egoSpeed: Number(row[1]) || 0,   // Spalte 2: EgoSpeed
          distance: Number(row[2]) || 10   // Spalte 3: Distance (Standardwert 10)
        }));

        this.excelDataService.setExcelData(excelRows);
        this.excelDataLoaded.emit(excelRows); // Daten an AccControlComponent senden
        console.log('Excel-Daten geladen:', excelRows);
      };
      reader.readAsArrayBuffer(file);
    }
  }
}