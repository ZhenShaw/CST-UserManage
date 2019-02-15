package main

import (
	"./route"
	"fmt"
	"log"
	"net/http"
)

func main() {

	//设置路由
	mux := http.NewServeMux()
	mux.HandleFunc("/login", route.Login)
	mux.HandleFunc("/logout", route.Logout)
	mux.HandleFunc("/register", route.Register)
	mux.HandleFunc("/update", route.Update)
	mux.HandleFunc("/query", route.Query)
	mux.HandleFunc("/deleteUser", route.DeleteUser)
	mux.HandleFunc("/forget", route.Forget)
	mux.HandleFunc("/logicDel", route.LogicDel)

	//监听8000端口
	fmt.Println("Web服务器启动...端口:8000")
	err := http.ListenAndServe(":8000", mux)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}


