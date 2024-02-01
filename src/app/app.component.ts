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
    lastPurchase: 300.0,
  };

  maxAmount: number = 0;

  bucketInput: any[] = [];
  buyBucket: any = {};
  httpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });
  httpOptions = {
    headers: this.httpHeaders,
    responseType: 'json',
    observe: 'body',
    withCredentials: true,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getBuckets();
  }
  teller:number=0;

  simulatePurchase(count: number): void {
    this.teller=0;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const r = Math.random() * Math.random();
        const p = Math.floor(this.maxAmount * r);
        this.buySomething(p);
      }, 200 * i);
    }
  }

  buySomething(p?: number): void {
    let lp = this.last_purchase;
    if (p) {
      lp = {
        lastPurchase: p,
      };
    }
    this.last_purchase = lp;
    this.http
      .post('http://localhost:8778/triggme/demo/buy', lp, {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.teller++;
        this.buyBucket = result;
        this.bucketInput.forEach((bucket: any) => {
          const arr = Object.keys(bucket);
          arr.forEach((item: any) => {
            bucket[item + 'Hot'] = false;
          });
          if (result.bucketId === bucket.bucketId) {
            const a = Object.keys(result);
            let dummy = 0;
            bucket.buyCount++;
            a.forEach((item: any) => {
              bucket[item + 'Hot'] = Math.abs(bucket[item] - result[item]) > 0.01;
              bucket[item] = result[item];
            });
          }
        });
      });
  }

  getBuckets(): void {
    this.http
      .post('http://localhost:8778/triggme/demo/setup', this.triggmebody, {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.bucketInput = result['buckets'];
        this.bucketInput.forEach((bucket:any)=> bucket.buyCount=0)
        this.maxAmount =
          this.bucketInput[this.bucketInput.length - 1].purchaseLimitHigh;
      });
  }
}
