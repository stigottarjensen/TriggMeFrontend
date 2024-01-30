import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';


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
    discount_level: 0.0,
    average_purchase_count: 0,
    innkjopspris_prosent: 0.0,
    average_purchase: 0.0,
    triggme_fee_prosent: 0.0,
    humaniter_fee_prosent: 0.0,
    total_purchase: 0.0,
    trigg_purchase: 0.0,
    tilgodelapp: 0.0,
    triggme_avgift: 0.0,
    humaniter_andel: 0.0,
  };

  buckets: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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
      // .get('http://localhost:8778/triggme/buysome', {
      //     withCredentials: true
      //   })
      .post('http://localhost:8778/triggme/demo/setup', this.triggmebody, {
        headers: httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result:any) => {
       
          this.buckets=result;
        
      });
  }
}
