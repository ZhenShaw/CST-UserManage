import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../../services/storage.service';
import axios from "axios"

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {

  // 暴露 EventEmitter 属性
  // 子组件利用该属性 emits(向上弹射)事件
  @Output() updateTrigger = new EventEmitter();
  @Output() logicDelTrigger = new EventEmitter<string>();

  public checkUsername = false
  public checkPhone = true
  public checkEmail = true
  public change = false

  public userInfo: any = {
    username: "",
    password: "",
    nickname: "",
    phone: "",
    email: "",
    uid: "",
    identity: ""
  }

  constructor(
    public router: Router,
    public storage: StorageService
  ) { }

  ngOnInit() {

  }

  open(username) {
    document.getElementById('light').style.display = 'block'
    document.getElementById('fade').style.display = 'block'
    this.query(username)
  }
  openAdd() {
    this.userInfo = {
      username: "",
      password: "",
      phone: "",
    }
    document.getElementById('add').style.display = 'block'
    document.getElementById('fade').style.display = 'block'
  }
  close() {
    document.getElementById('light').style.display = 'none'
    document.getElementById('fade').style.display = 'none'

    document.getElementById('add').style.display = 'none'
    this.userInfo = {
      username: "",
      password: "",
      phone: "",
    }
  }

  addUser() {
    let that = this
    if (this.userInfo.password == "" || this.userInfo.phone == "" || this.userInfo.username == "") {
      alert("信息不完整！")
      return
    }
    if (this.userInfo.password.length < 4 || !this.checkPhone || this.checkUsername) {
      alert("请注意警告提示！")
      return
    }

    axios({
      method: 'post',
      url: "/api/register",
      data: {
        username: this.userInfo.username,
        password: this.userInfo.password,
        phone: this.userInfo.phone
      },
      headers: {
        "Content-Type": "application/json"
      }

    }).then((res) => {
      // console.log(res.data)
      if (res.data.status) {
        that.updateTrigger.emit();
        alert("用户添加成功！")
      } else {
        alert("注册出错，用户名重复！")
        return
      }
    }).catch((err) => {
      alert("服务器连接失败！")
      return
    })
  }

  // 逻辑删除用户，管理员
  logicDel() {
    this.logicDelTrigger.emit(this.userInfo.uid)
  }
  // 物理删除用户，管理员
  deleteUser() {
    this.storage.keepOnline()
    if (confirm("确定删除？")) {
      console.log("确定删除")
    } else {
      return
    }
    let that = this
    axios({
      method: 'post',
      url: "/api/deleteUser",
      data: {
        "uid": String(this.userInfo.uid)
      },
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      if (res.data.status) {
        that.updateTrigger.emit();
        that.close()
        alert("删除成功")
      } else {
        alert("删除失败")
      }
    }).catch((err) => {
      alert("服务器连接错误！")
      return
    })
  }

  query(username) {
    let that = this
    var api = "/api/query"
    axios({
      method: 'post',
      url: api,
      data: {
        queryType: "1",
        user: username
      },
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      // console.log("query", res.data)
      if (res.data.status) {
        that.userInfo = res.data.objects[0]
      } else {
        that.userInfo = null
      }
    }).catch((err) => {
      console.log(err)
      alert("服务器连接失败！")
      return
    })
    // 刷新Token保持在线
    this.storage.keepOnline()
  }

  postChange() {
    if (this.userInfo.password == "" || this.userInfo.phone == "") {
      alert("密码和手机号码不能为空！")
      return
    }
    // console.log(this.userInfo.password.length < 4, !this.checkEmail, !this.checkPhone)
    if (!this.checkEmail || this.userInfo.password.length < 4 || !this.checkPhone) {
      alert("请注意警告提示！")
      return
    }

    let that = this
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
        that.updateTrigger.emit();
        alert("更新成功")
      } else {
        alert("更新失败！")
      }
    }).catch((err) => {
      alert("服务器连接错误")
      return
    })
  }

  keyUp(e) {
    if (e.code == "Space" || e.code == "Enter" || e.code == "NumpadEnter") {
      this.inputChange("email")
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
        let reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        this.checkEmail = reg.test(this.userInfo.email)
      } else {
        this.checkEmail = true
      }
    }
    // 检测中文用户名
    if(e.data=="="||e.data=="%"||e.data=="&"){
      alert("不能含有 = % & 等字符")
      this.userInfo.username=""
      return
    }
    if (e.data != undefined || e.data == null) {
      var reg = /[\u4e00-\u9fa5]/
      let a = reg.test(e.data)
      let b = reg.test(this.userInfo.username)
      if (a || b) {
        this.checkUsername = true
      } else {
        this.checkUsername = false
      }
    }
  }

  // 自动注册用户
  keyDown(e) {
    if (e.ctrlKey && e.code == "NumpadEnter") {
      this.autoAdd()
    }
  }

  autoAdd() {
    let user = ""
    let phone = ""
    let random = Math.random()
    let p = Math.round(random * 1000000)
    if (p < 100000) return
    phone = this.userInfo.phone + String(p)

    let u = Math.round(random * 10000)
    if (u < 1000) return
    user = this.userInfo.username + String(u)

    if (this.userInfo.phone.length != 5) return


    if (user != "") {
      axios({
        method: 'post',
        url: "/api/register",
        data: {
          username: user,
          password: "0000",
          phone: phone
        },
        headers: { "Content-Type": "application/json" }
      }).then((res) => {
        console.log("自动添加用户：", user, res.data)
      }).catch((err) => {
        alert("服务器连接失败！")
        return
      })
    }
  }

}
