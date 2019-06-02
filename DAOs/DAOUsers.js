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
     * Modifica en la base de datos la información del usuario pasado por parámetro 
     * @param {object} user Usuario a actualizar en la base de datos.
     * @param {function} callback Función que devolverá el objeto error o el booleano indicando la correcta actualización del usuario.
     */
    modifyUser(user, callback){
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            connection.query("UPDATE users SET email = ?, psw = ?, name = ?, gender = ?, birthday = ?, profile_picture = ? WHERE email = ?",
            [user.email, user.password, user.name, user.gender, user.birthdate, user.profile_picture, user.email],
            (err) => {
                connection.release();
                if (err) {callback(err, undefined);}
                else {
                    callback(null, true);
                }
            })
        });
    }
    
    /**
     * Inserta en la base de datos la foto cuyos datos recibe por parámetros (id del usuario propietario y foto a insertar)
     * @param {String} user Id del usuario que va a insertar la foto
     * @param {String} desc Descripción de la imagen a insertar
     * @param {*} picture Imagen a insertar en la base de datos
     * @param {Function} callback Función que devolverá el resultado de la inserción: err en caso de error y null en caso contrario
     */
    uploadPicture(user, desc, picture, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err);
            }
            else {
                conn.query("INSERT INTO gallery VALUES (?, ?, ?)", [user, picture, desc],
                (err) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null);
                    }
                })
            }
        })
    }

    /**
     * Inserta en la base de datos la foto cuyos datos recibe por parámetros (id del usuario propietario y foto a insertar)
     * @param {String} user Id del usuario que va a insertar la foto
     * @param {function} callback Función que devolverá el objeto error o el resultado de la consulta.
     */
    getPictures(user, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err, null);
            }
            else {
                conn.query("SELECT picture, gallery.desc FROM gallery WHERE email = ?", [user],
                (err, pictures) => {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, pictures);
                    }
                })
            }
        })
    }

    updatePoints(user, points, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback(err);
            }
            else {
                conn.query("UPDATE users SET points = ? WHERE email = ?", [points, user], 
                (err) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null);
                    }
                })
            }
        })
    }


    /**
     * 
     * @param {*} email 
     * @param {*} callback 
     */
    getInfoUser(email, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) callback("Error de acceso a la BBDD", null);
            else {
                conn.query("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
                    if (err) callback("Error de conexión con la BBDD", null);
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
                        callback(null, datos);
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

    /**
     * Calcula la edad de un usuario en función de su fecha de nacimiento
     * @param {Date} date Fecha de nacimiento del usuario
     * @param {function} callback  Función que devolverá el objeto error o el resultado
     */
    parseAge (date, callback) {
        var year = new Date(date.toString());
        let age;
        var diff_ms = Date.now() -  year.getTime();
        var age_dt = new Date(diff_ms); 
        age = Math.abs(age_dt.getUTCFullYear() - 1970);
        callback (age);
    }
}

module.exports = DAOUsers;