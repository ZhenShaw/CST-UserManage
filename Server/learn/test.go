package main

import (
	"fmt"
	"../src/psql"
)

func main() {

	//a := make([]interface{}, 0)
	//a = append(a, "Go", 1)
	//fmt.Println(a[0])
	//psql.Count()
//psql.LogicDel(105)

	b:=[]string{"106","94","95"}


	c:=psql.LogicDel(b)
	fmt.Println(c)

}
