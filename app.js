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
    response.render("friends");
})

app.post("/createnewquestion" , (request, response) =>{
    var data = {
        text: request.body.question_text,
        answers: [request.body.option_1, request.body.option_2]
    }
    if(request.body.option3 !== null) data.answers.push(request.body.option_3);
    if (request.body.option4 !== null) data.answers.push(request.body.option_4);
    daoquestions.newQuestion(data, (err) =>{
        if(err) console.log(err);
        else response.redirect("questions");
    })
})

app.get("/newQuestion", (request, response) =>{
    response.render("newQuestion")
})

app.get("/questions", (request, response) =>{
    daoquestions.getQuestions((err, result)=>{
        daoquestions.getQuestionData(result, (err, data) =>{
            if(err) console.log(err);
            else response.render("questions", {questions: data});
        })
    });
})

app.get("/question", (request, response) =>{
    var id = request.param.id;
    daoquestions.getQuestionData(id,(err)=>{

    })
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

app.listen(config.port, function (err) {
    if (err) {
        console.log("No se ha podido iniciar el servidor.");
        console.log(err);
    } else {
        console.log(`Servidor escuchando en puerto ${config.port}.`);
    }
});
