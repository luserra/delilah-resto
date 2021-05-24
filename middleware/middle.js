const jwt = require('jsonwebtoken');
const md5 = require('md5');
const sequelize = require('../db/conect');
const jwtClave = process.env.JWT_CLAVE;


const armarClave = (req, res, next) => {
    let clave = req.body.clave;
    req.body.clave = md5(clave);
    next ();
}

const autenticarUsuario = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verificarToken = jwt.verify(token, jwtClave);
            if (verificarToken) {
                req.usuario = verificarToken;
                return next();
            }
        }
    catch(err) {
        res.status(400).json({message: "Para verificar la identidad el header debe contener un token"})
    }
}

const verificarUsuario = (req, res, next) => {
    try {
        let id = req.params.id;
        const token = req.headers.authorization.split(' ')[1];
        const verificarToken =  jwt.verify(token, jwtClave);
            if (verificarToken.rol == 1) {
                return next();
            } else if (verificarToken.id_usuario == id) {
                return next();
            }
            throw new Error();
    }
    catch(err) {
        res.status(403).json({status_code: 403, message: "Acceso prohibido - Datos incorrectos"});
    }
}

const verificarAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const verificarToken = jwt.verify(token, jwtClave);
            if (verificarToken.rol == 1) {
                return next(); 
            }
        throw new Error();
    }
    catch(err) {
        res.status(403).json({message: 'Acceso prohibido. Solo se permiten usuarios administradores'})
    }
}

const verificarProducto = (req, res, next) => {
    try {
        let id_prod = req.params.idProducto;
        let values = [id_prod];

        sequelize.query('SELECT * FROM productos WHERE id_producto = ?',
        { replacements: values,
        type: sequelize.QueryTypes.SELECT}
        ).then(function(projects) {
            if (projects.length == 0) {
                throw new Error();
            } else {
                return next();
            }
        })
        .catch(err => res.status(404).json({status_code: 404}))
    }
    catch(err) {
        res.status(404).json({status_code: 404})
    }
}

const verPedidos = (req, res, next) => {
    try {
        let id_pedido = req.params.id;
        let rol = req.usuario.rol;
        let values = [id_pedido];

        sequelize.query('SELECT * FROM pedidos WHERE id_pedido = ?',
        { replacements: values,
        type: sequelize.QueryTypes.SELECT}
        ).then(function(projects) {
            if (projects[0].id_estado == 1 || projects[0].id_estado == 5) { // NUEVO - CANCELADO solo pueden verlo administradores
                if (rol == 1) {
                    return next();
                } else if (rol == 0) {
                    res.status(403).json({message: 'Acceso prohibido. Solo se permiten usuarios administradores'})
                }
            } else {
                return next();
            }
        }).catch (err => res.status(404).json({status_code: 404}));
    }
    catch (err) {
        res.json({error: "Acceso no autorizado"})
    }
}

module.exports = {
    armarClave,
    autenticarUsuario,
    verificarUsuario,
    verificarAdmin,
    verificarProducto,
    verPedidos
}