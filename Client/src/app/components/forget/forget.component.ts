import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import axios from "axios"
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { stringify } from '@angular/core/src/util';

@Component({
  selector: 'app-forget',
  templateUrl: './forget.component.html',
  styleUrls: ['./forget.component.css']
})
export class ForgetComponent implements OnInit {

  public username: string
  public phone: string
  public phoneNum:number
  public open = false

  constructor(
    public cookie: CookieService,
    public storage: StorageService,
    public router: Router,
  ) { }

  ngOnInit() {
  }

  click() {
    this.phone=String(this.phoneNum)
    
    if (this.username == "" || this.username == undefined) {
      return
    }
    if (!this.open) {
      this.open = true
      return
    }
    if (this.phone == "" || this.phone == undefined) {
      return
    }

    let that = this
    axios({
      method: 'post',
      url: "/api/forget",
      data: {
        "username": this.username,
        "phone": this.phone
      },
      headers: { "Content-Type": "application/json" }
    }).then(res => {
      // console.log(res.data)
      if (res.data.status) {
        that.router.navigateByUrl("/account") //路由转跳
      } else {
        alert("信息匹配出错！")
      }
    }).catch((err) => {
      alert("服务器连接失败！")
      return
    })
  }
}
