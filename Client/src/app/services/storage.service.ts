import { Injectable } from '@angular/core';
import { Userinfo } from "../utils/userinfo"
import { Router } from '@angular/router';
import axios from "axios"

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public userList:any


  constructor(
    public router: Router,
  ) {
  }

  //将数据写入缓存   
  setData(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  //取出缓存的数据  
  getData(key: string) {
    return JSON.parse(localStorage.getItem(key))
  }

  // 刷新Token保持在线
  keepOnline() {
    let that = this
    axios.get("/api/login").then(res => {
      if (!res.data.status) {
        alert("登录过期，请重新登录！")
        that.router.navigateByUrl("/login") //路由转跳
      }
    })
  }

}
