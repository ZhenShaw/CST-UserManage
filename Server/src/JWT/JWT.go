package JWT

import (
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"github.com/pkg/errors"
	"time"
)

//func main() {
//
//	token, _ := GenerateToken("1213")
//	fmt.Println(token)
//
//	us, err := ParseToken("")
//	fmt.Println(us, err)
//}

//传入用户名，生成并返回Token
func GenerateToken(username string) (string, error) {
	SecretKey := []byte("1234") //设置密钥

	token := jwt.New(jwt.SigningMethodHS256) //指定签名方式，创建token对象
	claims := token.Claims.(jwt.MapClaims)   //Claims (Payload):声明 token 有关的重要信息

	claims["authorized"] = true
	claims["iss"] = username                                //指明Token用户
	claims["exp"] = time.Now().Add(time.Minute * 15).Unix() //过期时间10min

	tokenString, err := token.SignedString(SecretKey)

	if err != nil {
		fmt.Errorf("创建token失败", err.Error())
		return "", err
	}
	return tokenString, nil
}

//传入token字符串，解析Token，返回用户名
func ParseToken(tokenStr string) (username string, err error) {
	SecretKey := []byte("1234") //设置密钥

	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		//methodt, ok := token.Method.(*jwt.SigningMethodHMAC)	//查看加密方式
		return SecretKey, nil
	})
	if err != nil {
		return "", err
	}

	claims, _ := token.Claims.(jwt.MapClaims)
	if token.Valid {
		return claims["iss"].(string), nil
	} else {
		return claims["iss"].(string), errors.New("token无效")
	}
}
