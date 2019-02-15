package psql

import (
	"database/sql"
	_ "github.com/lib/pq"
	"github.com/pkg/errors"
	"time"
)

//全局变量，用于接收数据库返回信息
var db *sql.DB

//数据库连接配置
const (
	host     = "cst.ifeel.vip"
	port     = 5432
	user     = "postgres"
	password = "postgres"
	dbname   = "postgres"
)

//接收存储查询结果
type User struct {
	Uid          int       `json:"uid"`
	Username     string    `json:"username"`
	Password     string    `json:"password"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	Sex          string    `json:"sex"`
	Age          int64     `json:"age"`
	Is_del       bool      `json:"is_del"`
	Created_date time.Time `json:"created_date"`
	Nickname     string    `json:"nickname"`
	Identity     string    `json:"identity"`
}

//参数化查询，匹配sql语句
//parameter: user, uid, limit, offset, matchStr
func getSQL(queryType string, parameter ...interface{}) (query string, args []interface{}) {
	preStr := "SELECT * FROM users WHERE is_del!=true "
	switch queryType {
	//查询数据总数目
	case "0":
		query = "SELECT count(*) FROM users WHERE is_del!=true"
	//1.用户名查询
	case "1":
		query = preStr + "AND username = $1"
		args = append(args, parameter[0])
	//2.uid查询
	case "2":
		query = preStr + "AND uid = $1"
		args = append(args, parameter[1])
	//3.注册时间倒序查询
	case "3":
		query = preStr + "ORDER BY created_date DESC LIMIT $1 OFFSET $2"
		args = append(args, parameter[2], parameter[3])
	//4.注册时间顺序查询
	case "4":
		query = preStr + "ORDER BY created_date ASC LIMIT $1 OFFSET $2"
		args = append(args, parameter[2], parameter[3])
	//5.用户名或手机号码精确查询
	case "5":
		query = preStr + "AND (username = $1 OR phone = $1)"
		args = append(args, parameter[4])
	//6.用户名或手机号码精确查询
	case "6":
		query = preStr + "AND (username LIKE $1 OR phone LIKE $1 OR email LIKE $1) ORDER BY created_date DESC LIMIT $2 OFFSET $3"
		args = append(args, parameter[4], parameter[2], parameter[3])

	default:
		panic("Wrong queryType!")
	}
	return
}

//初始化赋值
func init() {
	var err error
	//打开数据库
	db, err = sql.Open("postgres", "user=postgres password=postgres dbname=postgres sslmode=disable")
	checkError(err)
}

//错误处理
func checkError(err error) {
	if err != nil {
		panic(err)
	}
}

//关闭数据库
func Close() {
	db.Close()
}

//增加数据
func Add(username, password, phone string) bool {

	//(*DB)Prepare创建一个准备好的状态用于之后的查询和命令。返回值可以同时执行多个查询和命令。
	//Stmt是准备好的状态。Stmt可以安全的被多个go程同时使用。
	stmt, err := db.Prepare("INSERT INTO users(username,password,phone) VALUES($1,$2,$3) RETURNING uid")
	checkError(err)

	//(*Stmt)Exec使用提供的参数执行准备好的命令状态，返回Result类型的该状态执行结果的总结。
	res, err := stmt.Exec(username, password, phone)
	checkError(err)

	affect, err := res.RowsAffected()
	checkError(err)

	if affect == 1 {
		return true
	}
	return false
}

//更新数据
func Update(args ...interface{}) bool {

	stmt, err := db.Prepare("UPDATE users SET password=$1, nickname=$2, phone=$3, email=$4 WHERE uid=$5")
	checkError(err)

	res, err := stmt.Exec(args...)
	checkError(err)

	//Result.RowsAffected返回被update、insert或delete命令影响的行数。
	affect, err := res.RowsAffected()
	checkError(err)

	if affect == 1 {
		return true
	}
	return false
}

//查询数据，返回数组
func Query(queryType string, parameter ...interface{}) ([]User, error) {
	query, args := getSQL(queryType, parameter...)

	//(*DB) Query执行一次查询，返回多行结果（即Rows），一般用于执行select命令。
	rows, err := db.Query(query, args...)
	checkError(err)

	var users []User
	var user User

	i := 0
	//Next准备用于Scan方法的下一行结果。
	for rows.Next() {
		var uid int
		var username string
		var password string
		var identity string
		var is_del bool
		var age sql.NullInt64
		var nickname, phone, sex, email sql.NullString
		var date time.Time

		err = rows.Scan(&uid, &username, &password, &nickname,
			&email, &identity, &phone, &sex, &age, &is_del, &date)
		checkError(err)

		user.Uid = uid
		user.Username = username
		user.Password = password
		user.Phone = phone.String
		user.Nickname = nickname.String
		user.Email = email.String
		user.Age = age.Int64
		user.Sex = sex.String
		user.Identity = identity
		user.Is_del = is_del
		user.Created_date = date

		users = append(users, user)
		i++
	}
	if i == 0 {
		return users, errors.New("Query empty")
	}
	return users, nil
}

//逻辑删除
func LogicDel(uids []string) int64 {
	stmt, err := db.Prepare("UPDATE users SET is_del = true WHERE is_del != true AND uid = $1")
	checkError(err)

	var affects int64
	for _, uid := range uids {
		res, err := stmt.Exec(uid)
		checkError(err)

		affect, err := res.RowsAffected()
		checkError(err)

		affects += affect
	}
	return affects
}

//物理删除删除数据，传入uid
func Delete(uids []string) int64 {

	stmt, err := db.Prepare("DELETE FROM users WHERE uid=$1")
	checkError(err)

	var affects int64
	for _, uid := range uids {
		res, err := stmt.Exec(uid)
		checkError(err)

		affect, err := res.RowsAffected()
		checkError(err)

		affects += affect
	}
	return affects
}

//查询行数
func Count(queryType, user, uid, matchStr string) (count int64) {
	var query string
	var args []interface{}

	preStr := "SELECT count(*) FROM users WHERE is_del!=true "

	switch queryType {
	case "0", "3", "4":
		query = preStr
	case "1":
		query = preStr + "AND username = $1"
		args = append(args, user)
	case "2":
		query = preStr + "AND uid = $1"
		args = append(args, uid)
	case "5":
		query = preStr + "AND (username = $1 OR phone = $1 OR email = $1)"
		args = append(args, matchStr)
	case "6":
		query = preStr + "AND (username LIKE $1 OR phone LIKE $1 OR email = $1)"
		args = append(args, matchStr)
	}
	rows, err := db.Query(query, args...)
	checkError(err)

	for rows.Next() {
		err = rows.Scan(&count)
	}
	return
}





//func Qj() {
//	//QueryRow执行一次查询，并期望返回最多一行结果（即Row）。
//	//Scan将当前行各列结果填充进dest指定的各个值中。
//	var lastInsertId int
//	err := db.QueryRow("INSERT INTO users(username,password,age) VALUES($1,$2,$3) returning uid;", "astaxie", "研发部门", 20).Scan(&lastInsertId)
//	checkError(err)
//	fmt.Println("最后插入id =", lastInsertId)
//}
