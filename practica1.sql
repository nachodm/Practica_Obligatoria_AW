CREATE TABLE `users` (
    `email` VARCHAR(256) PRIMARY KEY,
    `name` VARCHAR (256) NOT NULL,
    `psw` VARCHAR(256) NOT NULL,
    `gender` CHAR(1) NOT NULL,
    `birthday` DATE DEFAULT NULL,
    `profile_picture` VARCHAR(256) DEFAULT NULL,
    `points` int(5) DEFAULT 0
);

CREATE TABLE `questions`(
    `question_ID` INTEGER ,
    `text` VARCHAR (256) NOT NULL,
    `answer` VARCHAR (256) NOT NULL,
    PRIMARY KEY (`question_ID`, `text`, `answer`)
);

CREATE TABLE `answers`(
    `question_ID` INTEGER NOT NULL, 
    `email` VARCHAR(256) NOT NULL,
    CONSTRAINT `email_fk4`FOREIGN KEY (`email`) REFERENCES `users`(`email`),
    CONSTRAINT `questions_ID_fk3`FOREIGN KEY (`question_ID`) REFERENCES `questions`(`question_ID`)
);


CREATE TABLE `friends`(
    `user1` VARCHAR(256) NOT NULL,
    `user2` VARCHAR(256) NOT NULL,
    `status` INTEGER NOT NULL,
    PRIMARY KEY (user1, user2),
    CONSTRAINT `friends_fk1`FOREIGN KEY (`user1`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `friends_fk2`FOREIGN KEY (`user2`) REFERENCES `users`(`email`) ON DELETE CASCADE ON UPDATE CASCADE
    
);