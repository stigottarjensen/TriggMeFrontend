import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'TriggMeFrontend';
  showImage = false;
  qrCode = '';
  triggmebody = {
    discount_level: 2.0,
    average_purchase_count: 0,
    innkjopspris_prosent: 2.0,
    average_purchase: 240.0,
    triggme_fee_prosent: 10.0,
    humaniter_fee_prosent: 10.0,
    total_purchase: 0.0,
    trigg_purchase: 0.0,
    tilgodelapp: 0.0,
    triggme_avgift: 0.0,
    humaniter_andel: 0.0,
  };

  last_purchase = {
    lastPurchase: 0.0,
  };

  bucketInput: any = {};
  bucketKeys: [] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getBuckets();
  }

  buySomething(): void {
    
  }

  getBuckets(): void {
    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const httpOptions = {
      headers: httpHeaders,
      responseType: 'json',
      observe: 'body',
      withCredentials: true,
    };
    this.http
      .post('http://localhost:8778/triggme/demo/setup', this.triggmebody, {
        headers: httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.bucketInput = result['buckets'];
        console.log(this.bucketInput);
      });
  }
}
