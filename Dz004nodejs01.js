// Для того, чтобы пользователи хранились постоянно, а не только, когда запущен сервер, необходимо реализовать хранение массива в файле.

const express = require("express");
const path = require("path");
const fs = require("fs");
const { validateUsers } = require("./joi");


const app = express();
const pathDB = path.join(__dirname, 'users.json'); // путь до файла с БД
const pathUsersId = path.join(__dirname, 'id.json'); // путь до файла с id Users

app.use(express.json()); // преобразует входящие запросы в JSON

// Чтение данных из файла users.json
const readUsersFile = () => {
    try {
        const usersData = fs.readFileSync(pathDB, 'utf8');
        return JSON.parse(usersData);
    } catch (err) {
        return [];
    }
};

/**
 * Отдаем список всех пользователей
 */
app.get('/users', (req, res) => {
    const users = readUsersFile();
    res.send(users);
});

/**
 * Отдаем конкретного пользователя по ID, если такой существует
 */
app.get('/users/:id', (req, res) => {
    const users = readUsersFile();
    const user = users.find((user) => user.id === Number(req.params.id));

    if (user) {
        res.send({ user });
    } else {
        res.status(404);
        res.send({ user: null });
    }
});

/**
 * Добавляем пользователя, предварительно валидируем полученные данные, увеличиваем id, формируем данные и отправляем в БД
 */
app.post('/users', (req, res) => {
    validateUsers(req.body, res);

    const uniqueID = getCountIdUser(pathUsersId);
    const users = readUsersFile();

    users.push({
        id: uniqueID.id,
        ...req.body
    });

    fs.writeFileSync(pathDB, JSON.stringify(users, null, 2));
    fs.writeFileSync(pathUsersId, JSON.stringify(uniqueID));

    res.send({
        id: uniqueID.id,
    });
});

app.put('/users/:id', (req, res) => {
    validateUsers(req.body, res);

    const users = readUsersFile();
    let user = users.find((user) => user.id === Number(req.params.id));

    if (user) {
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.age = req.body.age;
        user.city = req.body.city;
        
        fs.writeFileSync(pathDB, JSON.stringify(users, null, 2));
        res.send({ user });
    } else {
        res.status(404);
        res.send({ user: null });
    }
});

app.delete('/users/:id', (req, res) => {
    const users = readUsersFile();
    let userIndex = users.findIndex((user) => user.id === Number(req.params.id));

    if (userIndex !== -1) {
        users.splice(userIndex, 1);
        fs.writeFileSync(pathDB, JSON.stringify(users, null, 2));
        res.send({ user: users[userIndex] });
    } else {
        res.status(404);
        res.send({ user: null });
    }
});

app.listen(3000);

// Функция для получения уникального id пользователя
function getCountIdUser(pathUsersId) {
    let uniqueID = JSON.parse(fs.readFileSync(pathUsersId, 'utf8'));
    uniqueID.id += 1;
    return uniqueID;
}