import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import axios from "axios"
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  public checkUsername = false
  public checkPassword = ""
  public checkPhone = false
  public phone: any
  public user: any = {
    username: "",
    password: "",
    phone: ""
  }

  constructor(
    public router: Router,
    public storage: StorageService
  ) { }

  ngOnInit() {
  }

  postRegister() {

    let that = this
    // this.user.phone = String(this.phone)
    if (this.user.username == "" || this.user.password == "" || this.user.phone == "") {
      alert("信息不完整！")
      return
    }
    if (!this.checkPhone || this.checkUsername || this.user.password.length < 4 || this.user.password != this.checkPassword) {
      alert("请注意警告提示！")
      return
    }
    // var api ="http://104.194.235.170:8000/register"
    var api = "/api/register"
    let headers = {
      "Content-Type": "application/json"
    }
    //提交请求
    axios({
      method: 'post',
      url: api,
      data: this.user,
      headers: headers

    }).then((res) => {
      // console.log(res.data)
      if (res.data.status) {
        alert("注册成功,请登录！")
        that.router.navigateByUrl("/login") //路由转跳
      } else {
        alert("注册出错，用户名重复！")
        return
      }
    }).catch((err) => {
      alert("服务器连接失败！")
      return
    })
  }

  inputChange(e) {
    if(e.data=="="||e.data=="%"||e.data=="&"){
      alert("不能含有 = % & 等字符")
      this.user.username=""
      return
    }
    // 检测中文用户名
    var reg = /[\u4e00-\u9fa5]/
    let a = reg.test(e.data)
    let b = reg.test(this.user.username)
    if (a || b) {
      this.checkUsername = true
    } else {
      this.checkUsername = false
    }

    //检测电话号码
    this.user.phone = String(this.phone)
    if (this.user.phone != "null" && this.user.phone != "undefined") {
      this.checkPhone = /^1(3|4|5|6|7|8|9)\d{9}$/.test(this.user.phone)
    } else {
      this.checkPhone = true
    }
  }

}
