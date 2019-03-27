"use strict"

class DAOQuestions {


    constructor(pool) {
        this.pool = pool;
    }

    getQuestions(callback) {
        this.pool.getConnection((err, conn) => {
            if (err) callback("Error de acceso a la BBDD", undefined);
            else {
                conn.query("SELECT DISTINCT text FROM questions ORDER BY RAND() LIMIT 5 ", (err, rows) => {
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
                conn.query("SELECT MAX(question_ID) AS id FROM questions", (err, row) => {
                    if (err) callback("Error de conexion a la BBDD");
                    else {
                        data.answers.forEach(p => {
                            conn.query("INSERT INTO questions (question_ID, text, answer) VALUES (?,?,?)", [row[0].id + 1, data.text, p], (err) => {
                                if (err) callback("Error de conexion a la BBDD");
                            })
                        });
                        callback(false);
                    }
                })
            }
        })
    }

    getQuestionData(text, callback) {
        this.pool.getConnection((err, conn) => {
            if (err) callback("Error de acceso a la BBDD");
            else {
                var preguntas_data = [];
                text.forEach(p => {
                    conn.query("SELECT * FROM questions WHERE text = ?", [p.text], (err, rows) => {
                        if (err) callback("Error de conexion a la BBDD", undefined);
                        else if (rows.length > 0) {
                            var data = {
                                text: rows[0].text,
                                answers: [rows[0].option_1, rows[0].option_2, rows[0].option_3, rows[0].option_4]
                            }
                            preguntas_data.push(data);
                        }
                    });
                })
                callback(undefined, preguntas_data);
            }
        });
    }
}

module.exports = DAOQuestions;