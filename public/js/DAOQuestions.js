"use strict"

class DAOQuestions {


    constructor(pool) {
        this.pool = pool;
    }

    getQuestions(callback) {
        this.pool.getConnection((err, conn) => {
            if (err) callback("Error de acceso a la BBDD", undefined);
            else {
                conn.query("SELECT * FROM questions ORDER BY RAND() LIMIT 5 ", (err, rows) => {
                    if (err) callback("Error de conexion a la BBDD", undefined);
                    else {
                        if (rows.length > 0) {

                            //getInfo

                            callback(false, rows);
                        }
                        else callback(false, undefined);
                    }
                })
            }
        })
    }

    newQuestion(data, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) callback("Error de acceso a la BBDD");
            else {
                conn.query("INSERT INTO questions (text) VALUES (?)", [data.text], (err, row) => {
                    if (err) callback("Error de conexion a la BBDD");
                    else{
                        data.answers.forEach(p=>{
                            conn.query("INSERT INTO questions_answers (question_ID, answer) VALUES (?,?)",[row.insertId, p],
                            (err)=>{
                                if(err) callback("Error de acceso a la BBDD");
                                
                            })
                        })
                        
                    }
                })
                callback(false);
            }

        })
    }

    getQuestionData(id, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) callback("Error de acceso a la BBDD", undefined);
            else {
                conn.query("SELECT text, answer FROM questions NATURAL JOIN questions_answers WHERE question_ID = ?", [id],
                (err, rows)=>{
                    if(err) console.log(err);
                    else if (rows.length > 0){
                        callback(false, rows);
                    }
                })  
            }
        });
    }
}

module.exports = DAOQuestions;