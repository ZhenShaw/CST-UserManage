import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { CookieService } from 'ngx-cookie-service';
//组件
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AccountComponent } from './components/account/account.component';
import { AdminComponent } from './components/admin/admin.component';
import { ForgetComponent } from './components/forget/forget.component';
import { HomeComponent } from './components/home/home.component';
import { UserDetailComponent } from './components/admin/user-detail/user-detail.component';

// 服务
import { StorageService } from './services/storage.service';


@NgModule({
  // 应用内所有组件都要在这声明
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    AccountComponent,
    AdminComponent,
    ForgetComponent,
    HomeComponent,
    UserDetailComponent
  ],
  // 在这注入外部引入的模块
  imports: [
    BrowserModule,
    AppRoutingModule,   //路由模块
    FormsModule,        //双向数据绑定
    HttpClientModule,   //http请求
  ],
  // 配置服务
  providers: [StorageService,CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
