import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'TriggMeFrontend';
  rabatt_prosent:number =0.0;
  average_purchase_count:number=0;
  innkjopspris_prosent:number=0.0;
  typisk_kjopesum:number=0.0;
  triggme_avgift_prosent:number=0.0;
  humaniter_andel_prosent:number=0.0;
  total_purchase:number=0.0;
  trigg_purchase:number=0.0;
  tilgodelapp:number=0.0;
  triggme_avgift:number=0.0;
  humaniter_andel:number=0.0;


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
    .get('http://localhost:8778/AbisDB2JSON/abis/hive', {
      withCredentials: true,
    })
    .subscribe((result: any) => {});
  }



}
