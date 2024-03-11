import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
  ValueFormatterParams,
} from 'ag-grid-community';
import { DomSanitizer } from '@angular/platform-browser';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-quartz.css';
import * as forge from 'node-forge';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import { formatNumber } from '@angular/common';
// ng build --base-href=/triggdemo/
//sudo /Users/stigottarjensen/apache-tomcat-10.1.16/bin/startup.sh
//sudo /Users/stigottarjensen/apache-tomcat-10.1.16/bin/shutdown.sh

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'TriggMeFrontend';
  webApp = '/TriggMeServer';
  username: string = '';
  password: string = '';
  token: any = null;
  session_timeout_ms = 1 * 60 * 1000;
  showImage = false;
  showBuckets = true;
  qrCode = '';
  progress = 0;
  show_qr = null;
  @ViewChild('logGrid') grid!: AgGridAngular;

  userAccess: number = 100;

  init_triggmebody = {
    token: '',
    average_purchase_count: 50,
    min_purchase: 0.0,
    max_purchase: 999999999.0,
    total_purchase: 0.0,
    trigg_purchase: [0],
    trigg_total_purchase: [0],
    tilgodelapp: [0],
    triggme_avgift: [0],
    humaniter_andel: [0],
    last_cost: [0],
    trigg_purchase_percent: [0],
    total_acc_trigg_fee: 0.0,
    total_acc_humanitarian: 0.0,
    qrcode: [{}],
    bucket: [''],
  };

  init_edit_params = {
    currency: 'NOK',
    innkjopspris_prosent: 50.0,
    discount_level: 2.0,
    average_purchase: 500.0,
    triggme_fee_prosent: 10.0,
    humaniter_fee_prosent: 10.0,
  };

  edit_params =  JSON.parse(JSON.stringify(this.init_edit_params));
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

  onGridReady = (event: any) => {
    this.grid.api.setGridOption('rowData', []);
    this.rowData = [];
  };

  sessionTimeout(): void {
    if (this.timeOutHandle) clearTimeout(this.timeOutHandle);
    this.timeOutHandle = setTimeout(
      () => (this.token = null),
      this.session_timeout_ms
    );
  }

  ngAfterViewInit(): void {
    this.triggmebody.currency = this.currencySymbols[0];
    this.simulate_count = 500;
    this.setUp();
    this.rowData = [];
  }

  host = 'http://localhost:8778';

  ngOnInit(): void {
    const url = window.location.href;
    if (!url.includes('4200')) this.host = '';
  }

  currencyChange(): void {
    if ('$ £ €'.includes(this.triggmebody.currency))
      this.triggmebody.average_purchase = 50;
    else this.triggmebody.average_purchase = 500;
    this.setUp();
  }

  login(): void {
    this.simulate_count = 500;
    if (this.username.length > 1 && this.password.length > 1) {
      this.http
        .post(
          this.host + this.webApp + '/demo' + this.getRandomUrl(),
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
          this.session_timeout_ms =
            parseInt(result.session_timeout) * 60 * 1000;
          this.last_purchase.token = this.token;
          this.triggmebody = JSON.parse(JSON.stringify(this.init_triggmebody));
          this.edit_params = JSON.parse(JSON.stringify(this.init_edit_params));
          this.triggmebody.token = this.token;
          this.sessionTimeout();
          this.setUp();
        });
    }
  }

  teller: number = 0;
  purchaseTimeoutHandle: any[] = [];

  initTriggmebody(): void {
    this.triggmebody.total_purchase = 0.0;
    this.triggmebody.total_acc_trigg_fee = 0.0;
    this.triggmebody.total_acc_humanitarian = 0.0;
    this.triggmebody.tilgodelapp = [];
    this.triggmebody.triggme_avgift = [];
    this.triggmebody.trigg_purchase = [];
    this.triggmebody.trigg_total_purchase = [];
    this.triggmebody.humaniter_andel = [];
    this.triggmebody.last_cost = [];
    this.triggmebody.qrcode = [];
    this.triggmebody.trigg_purchase_percent = [];
    this.triggmebody.bucket = [];
    this.teller = 0;
    this.count_percent = 0;
  }

  chosenBucketId:any;

  chooseBucketId(newId:string) {
    this.chosenBucketId = newId;
    this.rowData = this.rowDataList.find((e)=> e.bucketId===this.chosenBucketId)?.rowData;
    this.grid.api.setGridOption('rowData', this.rowData);
  }

  simulatePurchase(): void {
    this.initTriggmebody();
    this.rowData = [];
    this.grid.api.setGridOption('rowData', []);
    let buck = [];
    let low = 0.0;
    let high = this.maxAmount;
    this.chosenBucketId = this.bucketInput[0].bucketId;
    if (this.edit_params.average_purchase >= this.minimumBucketAmount) {
      buck = this.bucketInput.filter(
        (bucket: any) =>
          this.edit_params.average_purchase >= bucket.purchaseLimitLow &&
          this.edit_params.average_purchase <= bucket.purchaseLimitHigh
      );
      low = buck[0].purchaseLimitLow;
      high = buck[0].purchaseLimitHigh;
      this.chosenBucketId = buck[0].bucketId;
    }
    this.setUp();

    for (let i = 0; i < this.simulate_count; i++) {
      this.purchaseTimeoutHandle.push(
        setTimeout(() => {
          const ra = Math.random();
          const p = Math.floor(100 * ((high - low) * ra + low)) / 100;
          this.buySomething(p);
        }, 7 * i)
      );
    }
  }

  count_percent = 0;

  leadZero(t: number): string {
    if (t > 9) return '' + t;
    else return '0' + t;
  }
  formatTimestamp = (params: ValueFormatterParams) => {
    let ts = new Date(params.value);
    const d = this.leadZero(ts.getDate());
    const m = this.leadZero(ts.getMonth() + 1);
    const y = this.leadZero(ts.getFullYear());
    const h = this.leadZero(ts.getHours());
    const min = this.leadZero(ts.getMinutes());
    const s = this.leadZero(ts.getSeconds());
    return d + '.' + m + '.' + y + ' ' + h + ':' + min + ':' + s;
  };

  moneyFormatter = (params: ValueFormatterParams) => {
    return this.edit_params.currency + ' ' + formatNumber(params.value,'en-US','1.2-2');
  };

  
  colDefs: ColDef[] = [
    { field: 'timeStamp', valueFormatter: this.formatTimestamp },
    { field: 'amount', valueFormatter: this.moneyFormatter },
    { field: 'sumAmount', valueFormatter: this.moneyFormatter },
    { field: 'discountPercent' },
    { field: 'discountAmount', valueFormatter: this.moneyFormatter },
    { field: 'sumDiscount', valueFormatter: this.moneyFormatter },
    { field: 'limit', valueFormatter: this.moneyFormatter },
    { field: 'trigged' },
    { field: 'triggSaldo', valueFormatter: this.moneyFormatter },
    { field: 'sumTilgode', valueFormatter: this.moneyFormatter },
    { field: 'sumTriggFee', valueFormatter: this.moneyFormatter },
    { field: 'sumOrg', valueFormatter: this.moneyFormatter },
  ];

  autoSizeStrategy:
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToFitProvidedWidthStrategy
    | SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
  };

  rowData: any[]|undefined = [];
  rowDataList:{bucketId:string, rowData:any[]}[] =[];

  buySomething(p: number): void {
    const randurl = this.getRandomUrl();
    let lp = {
      lastPurchase: p,
      token: this.token,
      ...this.edit_params,
      randurl: randurl,
    };

    this.last_purchase = lp;
    this.http
      .post(this.host + this.webApp + '/demo/buy' + randurl, lp, {
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

       const rElem = this.rowDataList.find((rd) => rd.bucketId===result.bucketId);
        if (!rElem) {
          this.rowDataList.push({bucketId:result.bucketId,rowData:[result.purchaseLog]});
        } else {
          const i = this.rowDataList.indexOf(rElem);
          this.rowDataList[i].rowData.unshift(result.purchaseLog);
        }
        
        this.rowData = this.rowDataList.find((e)=> e.bucketId===this.chosenBucketId)?.rowData;
        
        this.grid.api.setGridOption('rowData', this.rowData);

        if (result.lastAllowanceSlip) {
          const qr = this.sanitizer.bypassSecurityTrustResourceUrl(
            result.lastAllowanceSlip.QRCode
          );
          this.triggmebody.qrcode.push(qr);
        }
        this.triggmebody.total_purchase = result.totalPurchaseAmount;
        this.count_percent = Math.round(
          (100 * this.teller) / this.simulate_count
        );
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
            this.triggmebody.average_purchase_count =
              bucket.averagePurchaseCount;

            if (result.lastAllowanceSlip) {
              // ny tilgodelapp
              this.triggmebody.trigg_purchase.push(
                result.lastAllowanceSlip.amount
              );
              this.triggmebody.trigg_total_purchase.push(
                result.triggTotalPurchase
              );
              this.triggmebody.tilgodelapp.push(
                result.lastAllowanceSlip.allowanceAmount
              );
              const qrcontent = {
                qrcode_content: result.lastAllowanceSlip.QRLabel,
                token: this.token,
              };

              this.triggmebody.triggme_avgift.push(
                result.lastAllowanceSlip.triggMeFeeValue
              );
              this.triggmebody.humaniter_andel.push(
                result.lastAllowanceSlip.orgFeeValue
              );
              this.triggmebody.last_cost.push(
                result.lastAllowanceSlip.realCost
              );
              this.triggmebody.trigg_purchase_percent.push(
                result.lastAllowanceSlip.realCostPercent
              );
            }
          }
        });
        this.teller++;
      });
  }

  setUp(): void {
    for (var i = 0; i < this.purchaseTimeoutHandle.length; i++)
      clearTimeout(this.purchaseTimeoutHandle[i]);
    this.purchaseTimeoutHandle = [];
    this.initTriggmebody();
    this.rowData = [];
    const post_body = {...this.triggmebody, ...this.edit_params};
    //console.log(this.triggmebody, post_body);
    
    this.http
      .post(
        this.host + this.webApp + '/demo/setup' + this.getRandomUrl(),
        post_body,
        {
          headers: this.httpHeaders,
          responseType: 'json',
          observe: 'body',
          withCredentials: false,
        }
      )
      .subscribe((result: any) => {
        this.sessionTimeout();
        if (result.error) {
          this.token = null;
          return;
        }
        console.log(result);
        
        this.bucketInput = result['buckets'];
        this.triggmebody.average_purchase_count = result.averagePurchaseCount;

        this.bucketInput.forEach((bucket: any) => {
          bucket.buyCount = 0;
          bucket.progress = 0;
        });
        this.minimumBucketAmount = this.bucketInput[0].purchaseLimitLow;
        this.maxAmount =
          this.bucketInput[this.bucketInput.length - 1].purchaseLimitHigh;
      });
  }

  getRandomUrl(): string {
    let s = '/';
    for (let i = 0; i < 17; i++) {
      const t = Math.floor(Math.random() * 26) + 97;
      s += String.fromCharCode(t);
    }
    return s;
  }
}
