// app.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { AccControlComponent } from './acc-control/acc-control.component';
import { ExcelRow } from './excel-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild(AccControlComponent) accControl!: AccControlComponent;

  ngOnInit() {}

  onExcelDataLoaded(excelRows: ExcelRow[]) {
    this.accControl.setExcelData(excelRows);
  }
}