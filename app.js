const express = require("express");
const bodyParser = require("body-parser");
const checkCors = require('cors');
const sequelize = require('./db/conect');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const app = express();
const jwtClave = process.env.JWT_CLAVE;
const port= process.env.PORT;

const r_usuarios = require('./js/usuarios');
const r_productos = require('./js/productos');
const r_carrito = require('./js/carrito');
const r_pedidos = require('./js/pedidos');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(checkCors());
app.use(helmet());
app.use(express.json());

app.use(r_usuarios);
app.use(r_productos);
app.use(r_carrito);
app.use(r_pedidos);

app.listen(3000, () => {
  console.log("El servidor está inicializado en el puerto: " + port);
});
