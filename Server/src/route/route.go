package route

import (
	"../JWT"
	"../psql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
)

type Res struct {
	Objects []psql.User `json:"objects"`
	ErrMsg  string      `json:"errMsg"`
	Status  bool        `json:"status"`
	Count   int64       `json:"count"`
}

//全局使用
var Response = Res{}
var user = psql.User{}

//新用户注册

func Register(w http.ResponseWriter, r *http.Request) {

	//w.Header().Set("Content-Type", "application/json")
	//w.Header().Set("Access-Control-Allow-Origin", "*")
	//w.Header().Set("Access-Control-Allow-Headers", "Content-Type,access-control-allow-origin, access-control-allow-headers")

	if r.Method == "POST" {
		data, _ := ioutil.ReadAll(r.Body)
		FormData := make(map[string]string)
		json.Unmarshal([]byte(data), &FormData)
		user.Username = FormData["username"]
		user.Password = FormData["password"]
		user.Phone = FormData["phone"]

		//查询是否有重复用户名
		_, err := psql.Query("1", user.Username)
		if err == nil {
			Response.ErrMsg = "Duplicate username."
			Response.Objects = nil
			Response.Status = false
			res, _ := json.Marshal(Response)
			w.Write(res)
			return
		}
		fmt.Println("注册：", user.Username)
		Response.Status = psql.Add(user.Username, user.Password, user.Phone)
		if Response.Status {
			Response.ErrMsg = "request:ok"
		} else {
			Response.ErrMsg = "Add to db failed."
		}
		Response.Objects = nil
		res, _ := json.Marshal(Response)
		w.Write(res)
	}
}

//登录
//POST从数据库读取密码校验
//GET验证Token是否有效

func Login(w http.ResponseWriter, r *http.Request) {

	if r.Method == "POST" {
		data, _ := ioutil.ReadAll(r.Body)
		FormData := make(map[string]string)
		json.Unmarshal([]byte(data), &FormData)
		user.Username = FormData["username"]
		user.Password = FormData["password"]

		//按照用户名查询
		queryRes, err := psql.Query("1", user.Username)

		if err != nil {
			Response.ErrMsg = "No this user."
			Response.Status = false
			Response.Objects = nil
			res, _ := json.Marshal(Response)
			w.Write(res)
			return
		}
		//校验密码
		if queryRes[0].Password == user.Password {
			//生成token并设置cookie
			token, _ := JWT.GenerateToken(user.Username)
			cookie := http.Cookie{
				Name:     "token",
				Value:    token,
				HttpOnly: true,
			}
			w.Header().Set("Set-Cookie", cookie.String())
			//只返回token
			Response.Objects = nil
			Response.ErrMsg = "request:ok"
			Response.Status = true

			res, _ := json.Marshal(Response)
			w.Write(res)

		} else {
			Response.ErrMsg = "Wrong password."
			Response.Status = false
			Response.Objects = nil
			res, _ := json.Marshal(Response)
			w.Write(res)
		}
	}

	if r.Method == "GET" {
		var token string
		for _, cookie := range r.Cookies() {
			token = cookie.Value
		}
		username, err := JWT.ParseToken(token)
		if err != nil || username == "" {
			Response.ErrMsg = "Token invalid."
			Response.Status = false
			Response.Objects = nil
			res, _ := json.Marshal(Response)
			w.Write(res)
			return
		}
		//Token有效则生成新Token
		newToken, _ := JWT.GenerateToken(username)
		cookie := http.Cookie{
			Name:     "token",
			Value:    newToken,
			HttpOnly: true,
		}
		w.Header().Set("Set-Cookie", cookie.String())

		Response.Objects = nil
		Response.ErrMsg = "request:ok"
		Response.Status = true

		res, _ := json.Marshal(Response)
		w.Write(res)
	}
}

//注销登录，返回空用户Token
func Logout(w http.ResponseWriter, r *http.Request) {
	token, _ := JWT.GenerateToken("")
	cookie := http.Cookie{
		Name:  "token",
		Value: token,
	}
	w.Header().Set("Set-Cookie", cookie.String())
	w.Write([]byte("注销登录"))
}

//查询获取用户信息
//GET根据Token查询对应用户信息
//POST根据需要进行不同查询，管理员使用

func Query(w http.ResponseWriter, r *http.Request) {

	var token string
	for _, cookie := range r.Cookies() {
		token = cookie.Value
	}
	//从token获取用户名
	username, err := JWT.ParseToken(token)
	if err != nil || username == "" {
		Response.ErrMsg = "Token invalid."
		Response.Status = false
		Response.Objects = nil
		res, _ := json.Marshal(Response)
		w.Write(res)
		return
	}
	//生成新Token
	newToken, _ := JWT.GenerateToken(username)
	cookie := http.Cookie{
		Name:     "token",
		Value:    newToken,
		HttpOnly: true,
	}
	w.Header().Set("Set-Cookie", cookie.String())

	if r.Method == "GET" {

		queryRes, err := psql.Query("1", username)
		if err != nil {
			Response.ErrMsg = "No this user."
			Response.Status = false
			Response.Objects = nil
			res, _ := json.Marshal(Response)
			w.Write(res)
			return
		}
		Response.Objects = queryRes
		Response.ErrMsg = "request:ok"
		Response.Status = true

		res, _ := json.Marshal(Response)
		w.Write(res)
	}

	if r.Method == "POST" {
		var queryType, user, uid, limit, offset, matchStr string

		data, _ := ioutil.ReadAll(r.Body)
		FormData := make(map[string]string)
		json.Unmarshal([]byte(data), &FormData)
		queryType = FormData["queryType"]
		user = FormData["user"]
		uid = FormData["uid"]
		limit = FormData["limit"]
		offset = FormData["offset"]
		matchStr = FormData["matchStr"]

		matchStr = strings.Replace(matchStr, "#", "%", -1)

		//处理非法字符 = % &
		if queryType == "" {
			Response.ErrMsg = "Wrong string or empty type."
			Response.Status = false
			Response.Objects = nil
			Response.Count = 0
			res, _ := json.Marshal(Response)
			w.Write(res)
			return
		}

		queryRes, _ := psql.Query("1", username)
		if queryRes[0].Identity == "管理员" {
			count := psql.Count(queryType, user, uid, matchStr)
			resList, err := psql.Query(queryType, user, uid, limit, offset, matchStr)
			if err != nil {
				Response.ErrMsg = "No user."
				Response.Status = false
				Response.Objects = nil
				Response.Count = count
			} else {
				Response.ErrMsg = "request:ok"
				Response.Status = true
				Response.Objects = resList
				Response.Count = count
			}
		} else {
			Response.ErrMsg = "Not Administrator."
			Response.Status = false
			Response.Objects = nil
		}
		res, _ := json.Marshal(Response)
		w.Write(res)
	}
}

//更新用户信息
//需验证Token

func Update(w http.ResponseWriter, r *http.Request) {
	var token string
	for _, cookie := range r.Cookies() {
		token = cookie.Value
	}
	username, err := JWT.ParseToken(token)
	if err != nil || username == "" {
		Response.ErrMsg = "Token invalid."
		Response.Status = false
		Response.Objects = nil
		res, _ := json.Marshal(Response)
		w.Write(res)
		return
	}
	if r.Method == "POST" {
		data, _ := ioutil.ReadAll(r.Body)
		FormData := make(map[string]string)
		json.Unmarshal([]byte(data), &FormData)
		user.Username = FormData["username"]
		user.Password = FormData["password"]
		user.Phone = FormData["phone"]
		user.Nickname = FormData["nickname"]
		user.Email = FormData["email"]
		user.Uid, _ = strconv.Atoi(FormData["uid"])

		Response.Status = psql.Update(user.Password, user.Nickname, user.Phone, user.Email, user.Uid)
		if !Response.Status {
			Response.ErrMsg = "Update failed."
			Response.Status = false
		} else {
			Response.ErrMsg = "request:ok"
			Response.Status = true
		}
		Response.Objects = nil
		res, _ := json.Marshal(Response)
		w.Write(res)
	}
}

func Forget(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		data, _ := ioutil.ReadAll(r.Body)
		FormData := make(map[string]string)
		json.Unmarshal([]byte(data), &FormData)
		user.Username = FormData["username"]
		user.Phone = FormData["phone"]

		//查询是否有重复用户名
		queryRes, err := psql.Query("1", user.Username)
		if err == nil && queryRes[0].Phone == user.Phone {
			token, _ := JWT.GenerateToken(user.Username)
			cookie := http.Cookie{
				Name:     "token",
				Value:    token,
				HttpOnly: true,
			}
			w.Header().Set("Set-Cookie", cookie.String())

			Response.ErrMsg = "request:ok"
			Response.Objects = queryRes
			Response.Status = true
		} else {
			Response.ErrMsg = "Not Match!"
			Response.Objects = nil
			Response.Status = false
		}
		res, _ := json.Marshal(Response)
		w.Write(res)
	}
}

//逻辑删除用户
//管理员权限

func LogicDel(w http.ResponseWriter, r *http.Request) {
	var token string
	for _, cookie := range r.Cookies() {
		token = cookie.Value
	}
	username, err := JWT.ParseToken(token)
	if err != nil || username == "" {
		Response.ErrMsg = "Token invalid."
		Response.Status = false
		Response.Objects = nil
		res, _ := json.Marshal(Response)
		w.Write(res)
		return
	}

	if r.Method == "POST" {

		data, _ := ioutil.ReadAll(r.Body)
		FormData := make(map[string]string)
		json.Unmarshal([]byte(data), &FormData)
		uids := strings.Split(FormData["uid"], ",")

		queryRes, _ := psql.Query("1", username)
		if queryRes[0].Identity == "管理员" {
			delCount := psql.LogicDel(uids)
			if delCount != 0 {
				Response.ErrMsg = "request:ok"
				Response.Status = true
				Response.Objects = nil
				Response.Count = delCount
			} else {
				Response.ErrMsg = "Delete failed."
				Response.Status = false
				Response.Objects = nil
			}
		} else {
			Response.ErrMsg = "Not Administrator."
			Response.Status = false
			Response.Objects = nil
		}
		res, _ := json.Marshal(Response)
		w.Write(res)
	}
}

//物理删除用户
//管理员权限

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	var token string
	for _, cookie := range r.Cookies() {
		token = cookie.Value
	}
	username, err := JWT.ParseToken(token)
	if err != nil || username == "" {
		Response.ErrMsg = "Token invalid."
		Response.Status = false
		Response.Objects = nil
		res, _ := json.Marshal(Response)
		w.Write(res)
		return
	}

	if r.Method == "POST" {

		data, _ := ioutil.ReadAll(r.Body)
		FormData := make(map[string]string)
		json.Unmarshal([]byte(data), &FormData)
		uids := strings.Split(FormData["uid"], ",")

		queryRes, _ := psql.Query("1", username)
		if queryRes[0].Identity == "管理员" {
			delCount := psql.Delete(uids)
			if delCount != 0 {
				Response.ErrMsg = "request:ok"
				Response.Status = true
				Response.Objects = nil
				Response.Count = delCount
			} else {
				Response.ErrMsg = "Delete failed."
				Response.Status = false
				Response.Objects = nil
			}
		} else {
			Response.ErrMsg = "Not Administrator."
			Response.Status = false
			Response.Objects = nil
		}
		res, _ := json.Marshal(Response)
		w.Write(res)
	}
}
