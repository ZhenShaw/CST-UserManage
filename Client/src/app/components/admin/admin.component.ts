import { Component, OnInit, ViewChild } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { fromEvent } from 'rxjs';
import { Router } from '@angular/router';
import axios from "axios"

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})

export class AdminComponent implements OnInit {

  // 声明子组件
  @ViewChild('child')
  child: UserDetailComponent


  public userList: any    //用户列表
  public findStr: string  //输入框字符串
  public orderType = true //时间排序
  public offset = 0
  public totalPages = 1
  public page = 1
  public count = 0
  public switchPage: number = null
  public tips = "无数据！"



  public queryArgs = {
    queryType: "3",
    user: "",
    uid: "",
    limit: "20",
    offset: "0",
    matchStr: ""
  }

  constructor(
    public router: Router,
    public storage: StorageService
  ) {
    this.storage.userList = this.userList
  }

  ngOnInit() {
    // 动态监听窗口大小
    fromEvent(window,'resize')
    .subscribe((event) => {
      if (document.body.clientWidth<1000){
        document.getElementById("body").style.width="1000px"
      }else{
        document.getElementById("body").style.width=String(document.body.clientWidth)+"px"
      }
    })
 
    this.update()
  }

  update() {
    this.query()
  }

  // 点击全选
  selectAll(e) {
    console.log("全选：", e.target.checked)
    var inputs = document.getElementsByTagName('input');//获取所有的input标签对象。
    for (var i = 0; i < inputs.length; i++) {
      var obj = inputs[i];
      if (obj.type == 'checkbox') {
        obj.checked = e.target.checked
      }
    }
  }
  // 批量删除选中
  delChecked() {
    let selectArr = []
    var inputs = document.getElementsByTagName('input');//获取所有的input标签对象。
    // console.log(inputs)
    for (var i = 0; i < inputs.length; i++) {
      var obj = inputs[i];
      if (obj.type == 'checkbox' && obj.id != "") {
        if (obj.checked == true) {
          selectArr.push(obj.id)
        }
      }
    }
    if (selectArr.length == 0) return
    this.logicDel(selectArr)
  }
  pageDown() {
    // console.log(this.queryArgs)
    if (this.page >= this.totalPages) return
    if (this.userList == null) return
    this.offset = this.offset + 20
    this.queryArgs.offset = String(this.offset)
    this.query()
    this.page = this.page + 1
  }
  pageUp() {
    // console.log(this.queryArgs)
    if (this.page <= 1) return
    if (this.offset < 20) return
    this.offset = this.offset - 20
    this.queryArgs.offset = String(this.offset)
    this.query()
    this.page = this.page - 1
  }
  jumpPage() {
    if (this.switchPage <= 0) return
    this.page = this.switchPage
    this.offset = this.switchPage * 20 - 20
    this.queryArgs.offset = String(this.offset)
    this.query()
  }
  // 退出登录
  logout() {
    if (confirm("确定退出？")) {
      let that = this
      axios.get("/api/logout").then(res => {
        that.router.navigateByUrl("/login")
      })
    }
  }

  // 切割时间字符串
  cutter(str: string) {
    let date = str.split("T")
    let time = date[1].split(".")
    return date[0] + " " + time[0]
  }

  keyUp(e) {
    if (e.code == "Space" || e.code == "Enter" || e.code == "NumpadEnter") {
      this.inputChange()
    }
  }
  // 输入框实时查询
  inputChange() {
    this.page = 1
    this.offset = 0
    this.queryArgs.offset = "0"
    this.queryArgs.queryType = "6"
    this.queryArgs.matchStr = "#" + this.findStr + "#"
    this.query()
  }
  // 点击按键精确查找
  accureteQuery() {
    if (this.findStr == "") return
    if (this.findStr != undefined) {
      this.queryArgs.queryType = "5"
      this.queryArgs.matchStr = this.findStr
      this.query()
    }
  }

  // 按注册时间查询
  oredrByTime() {
    this.findStr = ""
    if (this.orderType) {
      this.queryArgs.queryType = "4"
      this.queryArgs.offset = String(this.offset)
      this.query()
      this.orderType = !this.orderType
    } else {
      this.queryArgs.queryType = "3"
      this.queryArgs.offset = String(this.offset)
      this.query()
      this.orderType = !this.orderType
    }
  }
  // 删除用户，管理员
  logicDel(uid) {
    this.storage.keepOnline()

    if (confirm("确定删除？")) {
      console.log("确定删除")
    } else {
      return
    }

    let that = this
    axios({
      method: 'post',
      url: "/api/logicDel",
      data: {
        "uid": String(uid)
      },
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      if (res.data.status) {
        that.update()
        that.child.close()
        alert("逻辑删除成功 " + res.data.count + " 条")
      } else {
        alert("逻辑删除失败")
      }
    }).catch((err) => {
      alert("服务器连接错误！")
      return
    })
  }

  // 查询函数，仅限管理员使用
  // 传入查询条件
  query() {
    this.tips = "加载中..."
    let that = this
    var api = "/api/query"
    axios({
      method: 'post',
      url: api,
      data: this.queryArgs,
      headers: { "Content-Type": "application/json" }
    }).then((res) => {
      // console.log(res.data)
      if (res.data.status) {
        that.userList = res.data.objects
        that.totalPages = Math.ceil(res.data.count / Number(that.queryArgs.limit))
      } else {
        that.userList = null
        that.totalPages = 1
        that.tips = "无数据！"
      }
      // 统计
      that.count = res.data.count
    }).catch((err) => {
      that.tips = "无数据！"
      console.log(err)
      alert("服务器连接失败！")
      return
    })
    // 刷新Token保持在线
    axios.get("/api/login").then(res => {
      if (!res.data.status) {
        alert("登录过期，请重新登录！")
        that.router.navigateByUrl("/login") //路由转跳
      }
    })
  }

}
