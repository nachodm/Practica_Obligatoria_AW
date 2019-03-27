"use strict"

class DAOUsers {

    constructor(pool) {
        this.pool = pool;
    }

    newUser(userData, callback){
        this.pool.getConnection((err, conn) =>{
            if(err) callback("Error de acceso a la BBDD", undefined);
            else{
                conn.query("INSERT INTO users (email, name, psw, gender, birthday, profile_picture) VALUES (?,?,?,?,?,?)",
                [userData.email, userData.name, userData.password, userData.gender, userData.birthday, userData.profile_picture],
                (err) =>{
                    if(err) callback(true);
                    else callback(false );
                })
            }
        })
    }

    isUserCorrect(email, password, callback) {
        this.pool.getConnection((err, conn) => {
            conn.release();
            if (err) callback("Error de acceso a la BBDD");
            else {
                conn.query("SELECT email, psw FROM users WHERE email = ? and psw = ?", [email, password], (err) => {
                    if (err) callback(err, true);
                    else callback(false, undefined);
                })
            }
        })
    }

    getInfoUser(email, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) callback("Error de acceso a la BBDD");
            else {
                conn.query("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
                    if (err) callback("Error de conexion con la BBDD", false);
                    else if (row.length > 0) {
                        conn.release();
                        var datos = {
                            email: email,
                            name: row[0].name,
                            gender: row[0].gender,
                            birthday: row[0].birthday,
                            profile_picture: row[0].profile_picture,
                            points: row[0].points
                        }
                        callback(false, datos);
                    }
                })
            }
        })
    }

    
}

module.exports = DAOUsers;