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

    newQuestion(question, callback){
        this.pool.getConnection((err, connection)=>{
            if (err) {
                callback("Error de conexión a la BBDD", false);
            }
            connection.query("INSERT INTO questions (question_text, numbanswers) VALUES (?, ?)",
            [question.question_text, question.numbanswers],
            (err) => {
                connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD", false);
                }
                else {
                    callback(null, true)
                }
            });
        });
    }


    getLastQid(callback) {
        this.pool.getConnection((err, connection)=>{
            if (err) {
                callback("Error de conexión a la BBDD", false);
            }
            connection.query("SELECT `AUTO_INCREMENT` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
            ["practica1", "questions"],
            (err, rows) => {
                connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD", false);
                }
                else {
                    if (rows.length == 0) callback(null, 1);
                    else callback(null, rows[0].AUTO_INCREMENT);
                }
            });
        });
    }

    insertAnswer(Qid, Aid, text, callback){
        this.pool.getConnection((err, connection) =>{
            if (err) {
                callback("Error de conexion a la BBDD");
            }
            connection.query("INSERT INTO answers (Qid, Aid, text) VALUES (?, ?, ?)",
            [Qid, Aid, text],
            (err) => {
                connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD");
                }
                else {
                    callback(null);
                }
            });
        });
    }


    getQuestionData(id, callback){
        this.pool.getConnection((err, connection)=>{
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            connection.query("SELECT id, question_text, Aid, text FROM questions JOIN answers ON id=Qid WHERE id = ?",
            [id], (err, rows)=>{
                if (err) {
                    callback("Error de acceso a la BBDD", undefined);
                }
                if (rows.length > 0) {
                    let data = {
                        id: rows[0].id,
                        question_text: rows[0].question_text,
                        answers: []
                    }
                    rows.forEach(row => {
                        data.answers.push({ id: row.Aid, text: row.text });
                    });
                    callback(null, data);
                }
            })
        });
    }

    isAnswered(id, email, callback){
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            connection.query("SELECT text FROM ownanswers WHERE Qid = ? and email = ?", [id, email],
            (err, rows)=>{
                connection.release();
                if (err) {
                    callback("Error de acceso a la BBDD", undefined);
                }
                if (rows.length > 0) {
                    callback(null, true);
                }
                else callback (null, false);
            });
        });
    }


    checkFriendAnswer(Qid, email, friends, callback){
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            
            conn.query("SELECT DISTINCT name, ownanswers.email, status, Qid, text FROM users NATURAL JOIN friends NATURAL JOIN ownanswers where Qid = ?  and friends.status = 2", [Qid], (err, rows)=>{
                if(err){
                    callback(err, undefined);
                }
                if(rows.length >  0 && friends.length > 0){
                    let fanswers = [];
                        rows.forEach(p=>{
                            var i = 0;
                            var encontrado = false;
                            while (!encontrado && i < friends.length){
                                if (p.email == email) encontrado = true;
                                else if(p.email == friends[i].email){
                                    fanswers.push(p.name);
                                    encontrado = true;
                                }
                                ++i;
                            }
                        })
                        callback(null, fanswers);
                    }
                else{
                    callback(null, null);
                }
            })
            
        });
    }

    answerQuestion(Obj, callback){
        this.pool.getConnection((err, connection)=>{
            if (err) {
                callback("Error de conexión con la BBDD", false);
            }
            connection.query("INSERT INTO ownanswers (email, Qid, text) VALUES (?, ?, ?)", 
            [Obj.email, Obj.Qid, Obj.text],
            (err) => {
                connection.release();
                 if (err) {
                     callback("Error de acceso a la BBDD", false);
                 }
                 else {
                     callback(null, true);
                 }
            });
        })
    }
    randomQuestion(callback){
        this.pool.getConnection((err,connection) =>{
            if(err){
                callback("Error de conexión a la BBDD", undefined);  
            }
            connection.query("SELECT id, question_text FROM questions ORDER BY rand() LIMIT 5",
            (err, rows)=>{
                connection.release();
                if(err){
                    callback("Error de acceso a la BBDD", undefined);
                }
                else {
                    let questions = [];
                    if (rows.length > 0){
                        rows.forEach( p => {
                            questions.push({text:p.question_text, id:p.id});
                        });
                        
                    }
                    callback(null, questions);
                }

            });
        });
    }

 }
 

module.exports = DAOQuestions;