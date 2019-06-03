"use strict"

class DAOQuestions {


    constructor(pool) {
        this.pool = pool;
    }

    /**
     * 
     * @param {*} callback 
     */
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

   /**
    * 
    * @param {*} question 
    * @param {*} answers 
    * @param {*} callback 
    */
    newQuestion(question, answers, callback){
        this.pool.getConnection((err, connection)=>{
            if (err) {
                callback("Error de conexión a la BBDD");
            }
            connection.query("INSERT INTO questions (question_text, numbanswers) VALUES (?, ?)",
            [question.question_text, question.numbanswers],
            (err, result) => {
                if (err) {
                    connection.release();
                    callback(err);
                } else {
                    let lastId = result.insertId;
                    if (answers.length > 0) {
                        let ans = [];
                        let id = 1;
                        answers.forEach(an => {
                            ans.push([lastId, id, an]);
                            id++;
                        })
                        connection.query("INSERT INTO answers (Qid, Aid, text) VALUES ?", [ans],
                            (err) => {
                                connection.release();
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                callback(null);
                            }
                        );
                    }
                }
            });
        });
    }

    /**
     * 
     * @param {*} id 
     * @param {*} callback 
     */
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

    /**
     * 
     * @param {*} id 
     * @param {*} email 
     * @param {*} callback 
     */
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

    /**
     * 
     * @param {*} Qid 
     * @param {*} email 
     * @param {*} friends 
     * @param {*} callback 
     */
    checkFriendAnswer(Qid, email, friends, callback){
        this.pool.getConnection((err, conn) => {
            if (err) {
                callback("Error de conexion a la BBDD", undefined);
            }
            
            conn.query("SELECT DISTINCT email, name, profile_picture, ownanswers.email, status, Qid, text FROM users NATURAL JOIN friends NATURAL JOIN ownanswers where Qid = ?  and friends.status = 2", [Qid], (err, rows)=>{
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
                                    let friend = {name: p.name, picture: p.profile_picture, email: p.email};
                                    fanswers.push(friend);
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

    /**
     * 
     * @param {*} Qid 
     * @param {*} friendEmail 
     * @param {*} callback 
     */
    getRandomAnswers(Qid, friendEmail,callback){
        this.pool.getConnection((err, conn)=>{
            if (err) {
                callback("Error de conexión con la BBDD", false);
            }
            else {
                conn.query("SELECT a.Qid, a.text FROM answers a where a.Qid=? UNION SELECT o.Qid, o.text FROM ownanswers o where o.Qid = ? and o.email=?"),
                [Qid,Qid, friendEmail], (err, rows)=>{
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        conn.query("SELECT text from ownanswers where Qid = ? and email = ?"),[Qid, friendEmail],
                        (err, goodAnswer) =>{
                            conn.release();
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                var randomquest = [];
                                randomquest.push(goodAnswer);
                                var salir = false;
                                var i = 1;
                                while(!salir && i < rows.length){
                                var rand = myArray[Math.floor(Math.random() * rows.length)];
                                    randomquest.push(rows[rand].text);
                                    ++i;
                                }
                                var sol = [];
                                sol.push(Qid);
                                sol.push(randomquest);
                                callback(undefined, sol);
                            }
                        }
                    }
                }
            }
           
        })
    }

    /**
     * 
     * @param {*} Obj 
     * @param {*} callback 
     */
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

    /**
     * 
     * @param {*} callback 
     */
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