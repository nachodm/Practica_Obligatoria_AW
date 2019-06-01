"use strict"

const mysql = require("mysql");
const config = require("./config");
const path = require("path");
const express = require("express");
const expressValidator = require("express-validator");
const bodyParser = require("body-parser");
const session = require("express-session");
const mysqlSession = require("express-mysql-session");
const DAOUsers = require("./DAOs/DAOUsers");
const DAOQuestions = require("./DAOs/DAOQuestions");
const multer = require("multer");   

const multerFactory = multer();

const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

let pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

const middlewareSession = session({
    saveUninitialized: false,
    secret: "foobar34",
    resave: false,
    store: sessionStore
});

const daousers = new DAOUsers(pool);
const daoquestions = new DAOQuestions(pool);

const app = express();
app.use(expressValidator());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(middlewareSession);
const ficherosEstaticos = path.join(__dirname, "public");

app.use(express.static(ficherosEstaticos));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public/views"));

app.get("/", (request, response) => {
    response.redirect("login");
})

app.get("/login", (request, response)=>{
    if (request.session.currentUser !== undefined) {
        response.redirect("profile");
    }
    else {
        let msg = request.session.loginErr;
        delete request.session.loginErr;
        response.render("login", {errors: msg});
    }
})

app.get("/profile", (request, response) => {
    if (request.session.currentUser === undefined) {
        response.redirect("login");
    }
    else {
        if (request.query.email != undefined)
            daousers.getInfoUser(request.query.email, (err, fdata) =>{
                response.render("profile", { data: request.session.userData, fdata: fdata });
        })
        else  response.render("profile", {data: request.session.userData, fdata: null});
    }
})

app.get("/newUser", (request, response) => {
    if (request.session.currentUser !== undefined) {
        response.redirect("profile");
    }
    else {
        let msg = request.session.newUserErr;
        delete request.session.newUserErr;
        response.render("newUser" , {errors: msg});
    }
})

app.get("/friends", (request, response) => {
    if (request.session.currentUser === undefined) {
        response.redirect("login");
    }
    else {
        daousers.getFriendRequests(request.session.currentUser, (err, friendsRequest)=>{
            daousers.getUserFriends(request.session.currentUser, (err, friends)=>{
                response.render("friends", {search: request.session.search, friendsRequest: friendsRequest, friends: friends});
            });
        })
    }
})

app.get("/newquestion", (request, response) => {
    if (request.session.currentUser === undefined) {
        response.redirect("login");
    }
    else {
        response.render("newquestion", {user: request.session.currentUser, errors: request.session.newQuestErr});
    }
});

app.post("/createnewquestion", (request, response) => {
    request.checkBody("option_1", "No puedes introducir una respuesta en blanco").notEmpty();
    request.checkBody("option_2", "No puedes introducir una respuesta en blacno").notEmpty();
    request.checkBody("option_3","No puedes introducir una respuesta en blacno").notEmpty();
    request.checkBody("option_4","No puedes introducir una respuesta en blacno").notEmpty();
    request.checkBody("option_1","Solo se puede usar carácteres alfanuméricos").matches(/^[A-Z0-9]+$/i)
    request.checkBody("option_2","Solo se puede usar carácteres alfanuméricos").matches(/^[A-Z0-9]+$/i)
    request.checkBody("option_3","Solo se puede usar carácteres alfanuméricos").matches(/^[A-Z0-9]+$/i)
    request.checkBody("option_3","Solo se puede usar carácteres alfanuméricos").matches(/^[A-Z0-9]+$/i)

    request.getValidationResult().then(function(results){
        if(!results.isEmpty()){
            request.session.newQuestErr = results.array();
            response.redirect("/newquestion");
        }
        else{
            let numbanswers = 2, Qid;
            if (request.body.option_3 !== "") {
                numbanswers++;
                if (request.body.option_4 !== "") {
                    numbanswers++;
                }
            }
            let question = {
                question_text: request.body.question_text,
                numbanswers: numbanswers
            }
            daoquestions.newQuestion(question, (err) => {
                if (!err) {
                    daoquestions.getLastQid((err, result) => {
                        if (!err) {
                            Qid = result - 1;
                            daoquestions.insertAnswer(Qid, 1, request.body.option_1, (err) => {
                                if (!err) {
                                    daoquestions.insertAnswer(Qid, 2, request.body.option_2, (err) => {
                                        if ((!err) && (numbanswers >=3)) {
                                            daoquestions.insertAnswer(Qid, 3, request.body.option_3, (err) => {
                                                if ((!err) && (numbanswers >=4)) {
                                                    daoquestions.insertAnswer(Qid, 4, request.body.option_4, (err) => {
                                                        if (err) {
                                                            response.status(500).send('Error 500: Internal server error');
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                    response.redirect("questions");
                }
            });
        }
    })
});
app.get("/questions", (request, response) => {
    if (request.session.currentUser === undefined) {
        response.redirect("login");
    }
    else {
        daoquestions.randomQuestion((err, questions) => {
            response.render("questions", {user: request.session.currentUser, questions: questions});
        }); 
    }
})

app.get("/question", (request, response) => {
    daoquestions.getQuestionData(request.query.id, (err, question)=>{
        daoquestions.isAnswered(request.query.id, request.session.currentUser, (err, answered) => {
            daousers.getUserFriends(request.session.currentUser, (err, friends) => {
                    daoquestions.checkFriendAnswer(request.query.id, request.session.currentUser, friends, (err, fanswers) => {
                        response.render("question", {user: request.session.currentUser, question: question, answered:answered, fanswers: fanswers});
                    });
            })
        });      
    });
})

app.post("/answerQuestion", (request, response) => {
    let answer =  {
        email: request.session.currentUser,
        Qid: request.body.qid,
        text: request.body.answer
    }
    daoquestions.answerQuestion(answer, (err, result) => {
        if (err) {
            response.status(500).send('Error 500: Internal server error');
        }
        if (result) {
            response.redirect("questions");
        }
    });
})

app.get("/answerquestion", (request, response) => {
    if (request.session.currentUser === undefined) {
        response.redirect("login");
    }
    else {
        daoquestions.getQuestionData(request.query.id, (err, data) =>{
            response.render("answerquestion", {user: request.session.currentUser, data: data, guessing: false});
        });
    }
})


app.post("/isUserCorrect", (request, response) => {
    request.checkBody("email", "El email no puede estar vacio").notEmpty();
    request.checkBody("email", "Email no válido").isEmail();
    request.checkBody("psw","La contraseña no puede estar vacía").notEmpty();
    request.getValidationResult().then(function(result){
        if(!result.isEmpty()){
            request.session.loginErr = result.array();
            response.redirect("login");
        }
        else{
            daousers.isUserCorrect(request.body.email, request.body.psw, (err, success, user) => {
                if (err)
                    response.status(500).send('Error 500: Internal server error');
                else {
                    if (success) {
                        request.session.currentUser = user.email;
                        request.session.userData = user;
                        response.redirect("profile");
                    }
                    else {
                        request.session.loginErr = "Email o contraseña incorrecta."
                        response.redirect("login");
                    }
                }
            })
        }
    })
})

app.post("/search", (request, response)=>{
    daousers.search(request.body.name, request.session.currentUser, (err, friends)=>{
        request.session.search = friends;
        response.redirect("friends");
    })
})

app.post("/friendResponse", (request, response)=>{
    let responsebtn = false;
    if (request.body.btn === "Aceptar") {
        responsebtn = true;
    }
    daousers.friendRequestResponse(request.body.friendrequest, request.session.currentUser, responsebtn, (err, result) => {
        if (result) {
            response.redirect("friends");
        }
    });
});


app.post("/sendFriendRequest", (request, response) => {
    daousers.sendFriendRequest(request.session.currentUser, request.body.friendrequest, (err, result) => {
        if (result) {
            console.log("hola " + result);
            request.session.search = null;
            response.redirect("friends");
        }
    });
});

app.post("/guessquestion", (request, response)=>{
    
    response.render("questions/::id");
})

app.post("/signUp", multerFactory.single("picture"),(request, response) => {
    request.checkBody("email", "Direccion de correo no válida").isEmail();
    request.checkBody("name", "Nombre de usuario no válido").matches(/^[a-zA-Z0-9 ]+$/i);
    if(request.body.bdate !== ""){
        request.checkBody("bdate", "Fecha de nacimiento no válida").isBefore();
    }

    request.getValidationResult().then(function(result){
        if(result.isEmpty()){
            let file = "";
            if (request.file) {
                file = request.file.filename;
            }
            var userData = {
                email: request.body.email,
                password: request.body.psw,
                name: request.body.name,
                gender: request.body.gender,
                birthday: request.body.bdate,
                profile_picture: file, 
                points: 0
            }
            daousers.newUser(userData, (err) => {
                if (err) {
                    response.status(500).send('Error 500: Internal server error');
                }
                else {
                    request.session.currentUser = userData.email;
                    request.session.userData = userData;
                    response.redirect("profile");
                }
            })
        }
        else{
            request.session.newUserErr = result.array();
            response.redirect("newUser");
        }
    })
})

app.get("/logout", (request, response)=>{
    request.session.destroy();
    response.redirect("/");
})

app.listen(config.port, function (err) {
    if (err) {
        console.log("No se ha podido iniciar el servidor.");
        console.log(err);
    } else {
        console.log(`Servidor escuchando en puerto ${config.port}.`);
    }
}); 


app.use((request, response, next) => {     
    response.status(404);     
    response.render("error", { url: request.url }); 
}); 

app.use((request, response, next) => {
    response.setFlash = (msg) => {
        request.session.flashMsg = msg;
    };          
    response.locals.getAndClearFlash = () => {
        let msg = request.session.flashMsg;         
        delete request.session.flashMsg;         
        return msg;     
    }; 
});