import { AfterViewInit, Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { DomSanitizer } from '@angular/platform-browser';
// ng build --base-href=/triggdmo/
//sudo /Users/stigottarjensen/apache-tomcat-10.1.16/bin/startup.sh
//sudo /Users/stigottarjensen/apache-tomcat-10.1.16/bin/shutdown.sh

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'TriggMeFrontend';
  username: string = '';
  password: string = '';
  token: any = null;
  session_timeout_ms = 1 * 60 * 1000;
  showImage = false;
  showBuckets = true;
  qrCode = '';
  progress = 0;

  userAccess:number = 100;

  init_triggmebody = {
    currency: 'NOK',
    token: '',
    discount_level: 2.0,
    average_purchase_count: 50,
    innkjopspris_prosent: 53.0,
    average_purchase: 49.0,
    triggme_fee_prosent: 10.0,
    humaniter_fee_prosent: 10.0,
    total_purchase: 0.0,
    trigg_purchase: [0],
    trigg_total_purchase: [0],
    tilgodelapp: [0],
    triggme_avgift: [0],
    humaniter_andel: [0],
    last_cost: [0],
    total_acc_trigg_fee: 0.0,
    total_acc_humanitarian: 0.0,
    qrcode: [{}],
  };

  triggmebody = JSON.parse(JSON.stringify(this.init_triggmebody));

  last_purchase = {
    lastPurchase: 0.0,
    token: '',
    discountLevel: 2.0,
    innkjopsProsent: 50.0,
  };

  currencyNames: any[] = [
    'Norske kroner',
    'Svenske kroner',
    'Danske kroner',
    'EURO',
    'Britiske pund',
    'Amerikanske dollar',
  ];
  currencySymbols: any[] = ['NOK', 'SEK', 'DK', '€', '£', '$'];

  maxAmount: number = 0;
  minimumBucketAmount: number = 0.0;
  bucketInput: any[] = [];
  //buyBucket: any = {};
  simulate_count = 100;
  httpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });
  httpOptions = {
    headers: this.httpHeaders,
    responseType: 'json',
    observe: 'body',
    withCredentials: true,
  };

  error = '';
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  timeOutHandle: any;

  sessionTimeout(): void {
    if (this.timeOutHandle) clearTimeout(this.timeOutHandle);
    this.timeOutHandle = setTimeout(
      () => (this.token = null),
      this.session_timeout_ms
    );
  }

  ngAfterViewInit(): void {
    this.triggmebody = JSON.parse(JSON.stringify(this.init_triggmebody));
    this.triggmebody.currency = this.currencySymbols[0];
    this.simulate_count = 100;
    this.getBuckets();
  }

  host = 'http://localhost:8778';

  ngOnInit(): void {
    const url = window.location.href;
    if (!url.includes('4200')) this.host = '';
  }

  currencyChange(): void {
    if ('$ £ €'.includes(this.triggmebody.currency))
      this.triggmebody.average_purchase = 4.5;
    else this.triggmebody.average_purchase = 45;
    this.getBuckets();
  }

  login(): void {
    this.simulate_count = 100;
    if (this.username.length > 1 && this.password.length > 1) {
      this.http
        .post(
          this.host + '/triggme/demo',
          { user: this.username, pass: this.password },
          {
            headers: this.httpHeaders,
            responseType: 'json',
            observe: 'body',
            withCredentials: false,
          }
        )
        .subscribe((result: any) => {
          if (result.error) this.error = result.error;
          this.token = result.token;
          this.userAccess = parseInt(result.access);
          this.session_timeout_ms = parseInt(result.session_timeout)*60*1000;
          this.last_purchase.token = this.token;
          this.triggmebody = JSON.parse(JSON.stringify(this.init_triggmebody));
          this.triggmebody.token = this.token;
          this.sessionTimeout();
          this.getBuckets();
        });
    }
  }

  teller: number = 0;

  simulatePurchase(): void {
    this.triggmebody.total_purchase = 0.0;
    this.triggmebody.tilgodelapp = [];
    this.triggmebody.triggme_avgift = [];
    this.triggmebody.trigg_purchase = [];
    this.triggmebody.trigg_total_purchase = [];
    this.triggmebody.humaniter_andel = [];
    this.triggmebody.last_cost = [];
    this.triggmebody.qrcode = [];
    this.teller = 0;
    let buck = [];
    let low = 0.0;
    let high = this.maxAmount;
    if (this.triggmebody.average_purchase >= this.minimumBucketAmount) {
      buck = this.bucketInput.filter(
        (bucket: any) =>
          this.triggmebody.average_purchase >= bucket.purchaseLimitLow &&
          this.triggmebody.average_purchase <= bucket.purchaseLimitHigh
      );
      low = buck[0].purchaseLimitLow;
      high = buck[0].purchaseLimitHigh;
    }

    for (let i = 0; i < this.simulate_count; i++) {
      setTimeout(() => {
        const r = Math.random() * Math.random() * Math.random();
        const p = Math.floor((high - low) * r + low);
        this.buySomething(p);
      }, 50 * i);
    }
  }

  count_percent = 0;

  buySomething(p?: number): void {
    if (!p || p < this.minimumBucketAmount) return;
    let lp = this.last_purchase;
    if (p) {
      lp = {
        lastPurchase: p,
        token: this.token,
        discountLevel: this.triggmebody.discount_level,
        innkjopsProsent: this.triggmebody.innkjopspris_prosent,
      };
    }
    this.last_purchase = lp;
    this.triggmebody.total_purchase += this.last_purchase.lastPurchase;
    this.http
      .post(this.host + '/triggme/demo/buy', lp, {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.sessionTimeout();
        if (result.error) {
          this.token = null;
          return;
        }
        this.teller++;
        this.count_percent = Math.round(
          (100 * this.teller) / this.simulate_count
        );
        // this.buyBucket = result;
        this.bucketInput.forEach((bucket: any) => {
          const arr = Object.keys(bucket);
          arr.forEach((item: string) => {
            if (item.includes('Hot')) {
              delete bucket[item];
            } else {
              bucket[item + 'Hot'] = false;
            }
          });
          if (result.bucketId === bucket.bucketId) {
            const a = Object.keys(result);
            bucket.buyCount++;
            a.forEach((item: string) => {
              if (item.includes('Hot')) {
                delete bucket[item];
              } else {
                bucket[item + 'Hot'] =
                  Math.abs(bucket[item] - result[item]) > 0.01;
                bucket[item] = result[item];
              }
            });
            bucket.progress =
              '' +
              Math.round((bucket.triggSaldo * 100) / bucket.purchaseLimitHigh);
            this.triggmebody.total_acc_trigg_fee = bucket.totalAccTriggFee;
            this.triggmebody.total_acc_humanitarian =
              bucket.totalAccHumanitarian;

            if (bucket.latestDiscountValue > 0.0) {
              this.triggmebody.trigg_purchase.push(
                this.last_purchase.lastPurchase
              );
              this.triggmebody.trigg_total_purchase.push(
                bucket.triggTotalPurchase
              );
              this.triggmebody.tilgodelapp.push(bucket.latestDiscountValue);
              const qrcontent = {
                qrcode_content: 'Tilgodelapp kr ' + bucket.latestDiscountValue,
                token: this.token,
              };
              this.http
                .post(this.host + '/triggme/demo/qrcode', qrcontent, {
                  headers: this.httpHeaders,
                  responseType: 'text',
                  observe: 'body',
                  withCredentials: false,
                })
                .subscribe((result: any) => {
                  this.sessionTimeout();
                  const qr =
                    this.sanitizer.bypassSecurityTrustResourceUrl(result);
                  this.triggmebody.qrcode.push(qr);
                });
              this.triggmebody.triggme_avgift.push(bucket.triggMeFeeValue);
              this.triggmebody.humaniter_andel.push(bucket.humanitarianValue);
              this.triggmebody.last_cost.push(bucket.lastDiscountCost);
            }
          }
        });
      });
  }

  getBuckets(): void {
    this.http
      .post(this.host + '/triggme/demo/setup', this.triggmebody, {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.sessionTimeout();
        if (result.error) {
          this.token = null;
          return;
        }
        this.bucketInput = result['buckets'];
        this.triggmebody.average_purchase_count =
          this.bucketInput[0].averagePurchaseCount;
        this.bucketInput.forEach((bucket: any) => {
          bucket.buyCount = 0;
          bucket.progress = 0;
        });
        this.minimumBucketAmount = this.bucketInput[0].purchaseLimitLow;
        this.maxAmount =
          this.bucketInput[this.bucketInput.length - 1].purchaseLimitHigh;
      });
  }
}
