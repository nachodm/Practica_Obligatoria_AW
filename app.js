"use strict"

const mysql = require("mysql");
const config = require("./config");
const path = require("path");
const express = require("express");
const expressValidator = require("express-validator");
const bodyParser = require("body-parser");
const session = require("express-session");
const mysqlSession = require("express-mysql-session");
const DAOUsers = require("./public/js/DAOUsers");
const DAOQuestions = require("./public/js/DAOQuestions");
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
    response.render("login");

})

app.get("/profile", (request, response) => {

    response.render("profile", { data: request.session.userData });

})

app.get("/newUser", (request, response) => {
    response.render("newUser");
})

app.get("/friends", (request, response) => {
    daousers.getFriendRequests(request.session.currentUser, (err, friendsRequest)=>{
        daousers.getUserFriends(request.session.currentUser, (err, friends)=>{
            console.log(friends);
            console.log(friendsRequest);
            response.render("friends", {search: request.session.search, friendsRequest: friendsRequest, friends: friends});
        });
    })
})

app.get("/newquestion", (request, response) => {
    if (request.session.currentUser === undefined) {
        response.redirect("login");
    }
    else {
        response.render("newquestion", {user: request.session.currentUser});
    }
});

app.post("/createnewquestion", (request, response) => {
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
                                                    response.write(err);
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
                if (!err) {
                    let answers = [];
                
                    response.render("question", {user: request.session.currentUser, question: question, answered:answered, friends: friends});
                }
            });
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
            response.redirect("error");
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
            response.render("answerquestion", {user: request.session.currentUser, data: data});
        });
    }
})


app.post("/isUserCorrect", (request, response) => {

    daousers.isUserCorrect(request.body.email, request.body.psw, (err) => {

        if (err)
            console.log(err);
        else {
            request.session.currentUser = request.body.email;
            daousers.getInfoUser(request.body.email, (err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    request.session.userData = result;
                    response.redirect("profile");
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

app.post("/signUp", (request, response) => {
    var userData = {
        email: request.body.email,
        password: request.body.psw,
        name: request.body.name,
        gender: request.body.gender,
        birthday: request.body.birthday,
        profile_picture: request.body.profile_picture
    }
    daousers.newUser(userData, (err) => {
        if (err) console.log(err);
        else {
            request.session.userData = userData;
            response.redirect("profile");
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