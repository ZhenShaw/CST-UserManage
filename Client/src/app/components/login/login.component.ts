import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import axios from "axios"


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: any = {
    username: "",
    password: ""
  }

  constructor(
    public router: Router,
  ) { }

  ngOnInit() {
    console.log(document)
    let that = this
    axios.get("/api/login").then(res => {
      // console.log("login get:", res.data)
      if (res.data.status) {
        that.router.navigateByUrl("/account") //路由转跳
      }
    }).catch(err => {
      console.log(err)
    })
  }

  // Enter键登录
  keyDown(e) {
    if (e.key == "Enter") {
      this.login()
    }
  }

  login() {
    let that = this
    if (this.loginForm.username == "" || this.loginForm.password == "") {
      alert("信息不完整！")
      return
    }

    // var api = "http://104.194.235.170:8000/login"
    var url = "/api/login"
    axios({
      method: 'post',
      url: url,
      data: this.loginForm,
      headers: { "Content-Type": "application/json" }

    }).then((res) => {
      // console.log("login post:", res.data)
      if (res.data.status) {
        if (this.loginForm.username == "Admin") {
          that.router.navigateByUrl("/admin") //路由转跳}
        } else {
          that.router.navigateByUrl("/account") //路由转跳
        }

      } else {
        alert("账号或者密码错误")
      }
    }).catch((err) => {
      console.error(err);
      alert("服务器连接错误")
    })
  }

}


