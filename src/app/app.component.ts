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
    trigg_purchase: [0],
    tilgodelapp: [0],
    triggme_avgift: [0],
    humaniter_andel: [0]
  };

  last_purchase = {
    lastPurchase: 0.0,
  };

  maxAmount: number = 0;

  bucketInput: any[] = [];
  buyBucket: any = {};
  simulate_count =100;
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

  simulatePurchase(): void {
    this.triggmebody.total_purchase =0.0;
    this.triggmebody.tilgodelapp =[];
    this.triggmebody.triggme_avgift =[];
    this.triggmebody.trigg_purchase =[];
    this.triggmebody.humaniter_andel =[];
    this.teller=0;
    for (let i = 0; i < this.simulate_count; i++) {
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
    this.triggmebody.total_purchase += this.last_purchase.lastPurchase;
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
            bucket.buyCount++;
            a.forEach((item: any) => {
              bucket[item + 'Hot'] = Math.abs(bucket[item] - result[item]) > 0.01;
              bucket[item] = result[item];
            });
            if (bucket.latestDiscountValue>0.0) {
                this.triggmebody.trigg_purchase.push(this.last_purchase.lastPurchase);
                this.triggmebody.tilgodelapp.push(bucket.latestDiscountValue);
                this.triggmebody.triggme_avgift.push(bucket.triggMeFeeValue);
                this.triggmebody.humaniter_andel.push(bucket.humanitarianValue);;
            }
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
