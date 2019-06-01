"use strict"

class DAOUsers {

    constructor(pool) {
        this.pool = pool;
    }

    /**
     * 
     * @param {*} userData 
     * @param {*} callback 
     */
    newUser(userData, callback){
        this.pool.getConnection((err, conn) =>{
            if(err) callback("Error de acceso a la BBDD", null);
            else{
                conn.query("INSERT INTO users (email, name, psw, gender, birthday, profile_picture) VALUES (?,?,?,?,?,?)",
                [userData.email, userData.name, userData.password, userData.gender, userData.birthday, userData.profile_picture],
                (err) =>{
                    if(err) callback(err, null);
                    else callback(err, true);
                })
            }
        })
    }

    /**
     * Comprueba si el usuario existe en la base de datos, y de ser así, devuelve sus datos.
     * @param {string} email Email del usuario que inicia sesión
     * @param {string} password Contraseña de inicio de sesión
     * @param {function} callback Función que  devolverá el objeto error o el resultado.
     */
    isUserCorrect (email, password, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(`Error de conexión a la BBDD`, null, null);
            }
            connection.query("SELECT * FROM users WHERE email = ? AND psw = ?",
            [email, password],
            (err, rows) => {
                connection.release();
                if (err) {callback (err, null, null);}
                if (rows.length === 0) {
                    callback (null, false, null);
                }
                else {
                    callback (null, true, rows[0]);
                }
            })
        });
    }

    /**
     * 
     * @param {*} email 
     * @param {*} callback 
     */
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

    /**
     * 
     * @param {*} string 
     * @param {*} loggedUserEmail 
     * @param {*} callback 
     */
    search(string, loggedUserEmail, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {callback(`Error de conexión: ${err.message}`, undefined); return;}
            else {
                connection.query("SELECT email, name, profile_picture FROM users WHERE email != ? AND name LIKE ? AND email NOT IN " +
                "(SELECT user1 FROM friends WHERE user2 = ?) AND email NOT IN " +
                "(SELECT user2 FROM friends WHERE user1 = ?)", 
                [loggedUserEmail, "%" + string + "%", loggedUserEmail, loggedUserEmail],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err, undefined); return;}
                    else {
                        let friends = [];
                        rows.forEach(friend => {
                            friends.push({ name: friend.name, email: friend.email, picture: friend.profile_picture});
                        });
                        callback(null, friends);
                    }
                })
            }
        });
    }

    /**
     * 
     * @param {*} email 
     * @param {*} callback 
     */
    getFriendRequests(email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) { 
                callback(`Error de conexión: ${err.message}`, undefined); return;
            } 
            else {
                connection.query("SELECT user1, name, profile_picture FROM friends JOIN users ON email=user1 WHERE status = ? and user2 = ?", 
                [1, email],
                (err, rows) => {
                    connection.release();
                    if (err) { callback(err, undefined); return;} 
                    else {
                        let requests = [];
                        rows.forEach(row => {
                            requests.push({ name: row.name, email: row.user1, picture: row.profile_picture });
                        });
                        callback(null, requests);
                    }
                })
            }
        });
    }
    /**
     * 
     * @param {*} email 
     * @param {*} callback 
     */
    getUserFriends(email, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(`Error de conexión: ${err.message}`, undefined); return;
            }
            connection.query("SELECT user1, name, profile_picture FROM friends JOIN users ON user1 = email WHERE status = 2 AND user2 = ?",
            [email],
            (err, rows) => {
                if (err) {
                    callback(err, undefined);
                    return;
                }
                let friends = [];
                rows.forEach(friend => {
                    friends.push({ name: friend.name, email: friend.user1, picture: friend.profile_picture });
                });
                connection.query("SELECT user2, name, profile_picture FROM friends JOIN users ON user2=email WHERE status = 2 AND user1 = ?",
                [email],
                (err, rows) => {
                    connection.release();
                    if (err) {
                        callback(err, undefined);
                        return;
                    }
                    rows.forEach(friend => {
                        friends.push({ name: friend.name, email: friend.user2, picture: friend.profile_picture });
                    });
                    callback(null, friends);
                })
            })
        })
    }

    /**
     * 
     * @param {*} user1 
     * @param {*} user2 
     * @param {*} response 
     * @param {*} callback 
     */
    friendRequestResponse(user1, user2, response, callback) {        
        this.pool.getConnection((err, connection) => {
            if (err) { 
                callback(`Error de conexión: ${err.message}`, undefined);
            } 
            else {
                if (response) {
                    connection.query("UPDATE friends SET status = 2 WHERE user1 = ? AND user2 = ?",
                    [user1, user2],
                        (err, rows) => {
                            connection.release();
                            if (err) {
                                 callback(err, undefined); 
                                }
                             else {
                                callback(null, true);
                            }
                        }
                    )
                } else {
                    connection.query("DELETE FROM friends WHERE user1 = ? AND user2 = ?",
                    [user1, user2],
                        (err, rows) => {
                            connection.release();
                            if (err) { 
                                callback(err, undefined);
                            }
                            else {
                               callback(null, true);
                           }
                        }
                    )
                }
            }
        });
    }

    /**
     * 
     * @param {*} user1 
     * @param {*} user2 
     * @param {*} callback 
     */
    sendFriendRequest(user1, user2, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {callback(`Error de conexión: ${err.message}`, undefined); return; } 
            else {
                let pending = 1;
                    connection.query("INSERT INTO friends VALUES (?, ?, ?)",
                [user1, user2, pending],
                    (err, rows) => {
                        connection.release();
                        if (err) callback(err, undefined); 
                        else {
                            callback(null, true);
                        }
                    }
                )
            }
        });
    }
}

module.exports = DAOUsers;