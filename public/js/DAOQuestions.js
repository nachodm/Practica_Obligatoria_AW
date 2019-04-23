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

    isAnswered(id,email, callback){
        this.pool.getConnection((err, conn)=>{
            if(err) callback("Error de acceso a la BBDD");
            else{
                conn.query("SELECT answer FROM user_answers WHERE question_id = ? AND email = ?", [id, email], (err, row)=>{
                    if(err) callback("Error de conexion a la BBDD");
                    else{
                        if (row.answer !== null) callback(undefined, false);
                        else callback(undefined, true);
                    }
                })
            }
        })
    }

    friendsAnswers(user1, id, callback){
        this.pool.getConnection((err,conn)=>{
            if(err) callback("Error de acceso a la BBDD", false);
            else{
                conn.query("SELECT * FROM `friends` INNER JOIN user_answers WHERE user1 = ? AND question_ID = ? AND status = ?",
                [user1, id, 2], (err, rows) =>{             
                    if(err) callback("Error de conexion a la BBDD", false);
                    else{
                        console.log(rows);
                        callback(false, rows);
                    }
                })
            }
        })
    }

    answer_guesses(user){}
}

module.exports = DAOQuestions;