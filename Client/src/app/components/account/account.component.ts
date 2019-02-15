import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import axios from "axios"

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  public checkPhone = true
  public checkEmail=true
  // public userinfo = new Userinfo;
  public uid: number;

  public userInfo: any = {
    username: "",
    password: "",
    nickname: "",
    phone: "",
    email: "",
    uid: ""
  }

  constructor(
    public router: Router,
    public storage: StorageService,
    public routeInfo: ActivatedRoute,
  ) { }

  ngOnInit() {
    let that = this
    // console.log(this.routeInfo.snapshot.queryParams.uid)
    var url = "/api/query"
    axios.get(url).then(res => {
      // console.log("account get：", res.data)
      if (res.data.status) {
        this.userInfo = res.data.objects[0]
        if (res.data.objects[0].identity == "管理员")
          that.router.navigateByUrl("/admin")
      } else {
        that.router.navigateByUrl("/login") //未登录则转跳
      }

    }).catch(err => {
      console.log(err)
      that.router.navigateByUrl("/login") //未登录则转跳
      alert("服务器连接错误")
    })
  }

  postChange() {

    if (this.userInfo.email == "" || this.userInfo.password == "" || this.userInfo.phone == "") {
      alert("信息不完整！")
      return
    }
    // console.log(this.userInfo.password.length < 4 , !this.checkEmail , !this.checkPhone)
    if (!this.checkEmail || this.userInfo.password.length < 4 || !this.checkPhone) {
      alert("请注意警告提示！")
      return
    }

    var api = "/api/update"
    let data = {
      uid: String(this.userInfo.uid),
      password: this.userInfo.password,
      nickname: this.userInfo.nickname,
      phone: this.userInfo.phone,
      email: this.userInfo.email,
      username: this.userInfo.username
    }
    axios({
      method: 'post',
      url: api,
      data: data,
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      // console.log(res.data)
      if (res.data.status) {
        alert("更新成功")
      } else {
        alert("Token过期，请重新登录！")
      }
    }).catch((err) => {
      alert("服务器连接错误")
      return
    })
  }

  logout() {
    if (confirm("确定退出？")) {
      let that = this
      axios.get("/api/logout").then(res => {
        // console.log(res)
        that.router.navigateByUrl("/login") //未登录则转跳
      })
    }
  }

  inputChange(e) {
    //检测电话号码
    if (e == "phone") {
      if (this.userInfo.phone != "null" && this.userInfo.phone != "undefined") {
        this.checkPhone = (/^1(3|4|5|6|7|8|9)\d{9}$/.test(this.userInfo.phone))
      } else {
        this.checkPhone = true
      }
    }
    //检测邮箱
    if (e == "email") {
      if (this.userInfo.phone != "null" && this.userInfo.phone != "undefined") {
        let reg =/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        this.checkEmail = reg.test(this.userInfo.email)
      } else {
        this.checkEmail = true
      }
    }
  }

}
