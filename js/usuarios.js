const express = require("express");
const bodyParser = require("body-parser");
const checkCors = require('cors');
const sequelize = require('../db/conect');
const jwt = require('jsonwebtoken');
const jwtClave = process.env.JWT_CLAVE;

// traer middlewares
const {armarClave, autenticarUsuario, verificarUsuario, verificarAdmin, verPedidos, verificarProducto} = require('../middleware/middle');

// Crear nuevo router
const router = new express.Router();

router.use(express.json());
router.use(checkCors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));


// Registro
router.post('/usuarios/registro', armarClave, (req, res) => {
    let nueva_cuenta = {
        usuario: req.body.usuario,
        nombre: req.body.nombre,
        correo: req.body.correo,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        clave: req.body.clave,
        rol: req.body.rol
    }

    let values = {
        usuario: nueva_cuenta.usuario,
        nombre: nueva_cuenta.nombre,
        correo: nueva_cuenta.correo,
        telefono: nueva_cuenta.telefono,
        direccion: nueva_cuenta.direccion,
        clave: nueva_cuenta.clave,
        rol: nueva_cuenta.rol
    };

    sequelize.query('SELECT * FROM usuarios WHERE usuario = :usuario OR correo = :correo',
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then ((projects) => {
        if (projects.length >= 1) {
            return res.status(400).json({status_code: 400, message: 'El usuario ya existe'});
        }
        sequelize.query('INSERT INTO usuarios (usuario, nombre, correo, telefono, direccion, clave, rol) VALUES (:usuario, :nombre, :correo, :telefono, :direccion, :clave, :rol)', {
            replacements: values})
            .then ((n) => res.status(201).send('Nueva cuenta creada'))
            .catch(err => console.error(err));
    })
})

// Ingresar
router.post('/usuarios/ingresar', armarClave, (req, res) => {
    let ingreso = {
        usuario: req.body.usuario,
        correo: req.body.correo,
        clave: req.body.clave,
    }

    let values = {
        usuario: ingreso.usuario,
        correo: ingreso.correo,
        clave: ingreso.clave,
    };

    sequelize.query('SELECT * from usuarios WHERE usuario = :usuario || correo = :correo',
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    )
    .then((projects) => {
        if (projects.length >= 1) {
            if (projects[0].clave == ingreso.clave) {
                let enviar_token = {
                    usuario: projects[0].usuario,
                    id_usuario: projects[0].id_usuario,
                    rol: projects[0].rol
                }
                let token = jwt.sign( enviar_token, jwtClave);
                return res.status(200).json({token: token});
            }
        }
        return res.status(400).json({status_code: 400, message: 'Datos incorrectos'});
    })
})


// Ver usuarios - rol admin
router.get('/usuarios', autenticarUsuario, verificarAdmin, (req, res) => {
    sequelize.query('SELECT * FROM usuarios', 
    { type: sequelize.QueryTypes.SELECT}
    ).then(function(projects) {
        res.json(projects);
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

// Ver un usuario
router.get('/usuarios/:id', autenticarUsuario, verificarUsuario, (req, res)=> {
    let values= [req.params.id];
    sequelize.query('SELECT * FROM usuarios WHERE id_usuario = ?', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then(function(projects) {
        if (projects.length <= 0) {
            throw new Error();
        } else {
            return res.json(projects)
        }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})  

// Productos favoritos de un usuario
router.get('/usuarios/:id/favoritos', autenticarUsuario, verificarUsuario, (req, res)=> {
    let id = req.params.id;
    let values = [id];

    sequelize.query('SELECT * FROM favoritos WHERE id_usuario = ?', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects) => {
        if (projects.length>0) {
            sequelize.query(`SELECT productos.nombre AS nombre_producto, productos.precio  
            FROM favoritos JOIN productos ON favoritos.id_producto = productos.id_producto 
            WHERE favoritos.id_usuario = ?`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT}
            ).then((c)=> {
                return res.json(c)
            })
        } else {
            return res.send('No tiene productos favoritos');
        }
    })
    .catch((err)=> res.status(404).json({status_code: 404}));
})

// Agregar un producto a favoritos 
router.post('/usuarios/:id/productos/:idProducto/favoritos', autenticarUsuario, verificarUsuario, verificarProducto, (req, res) => {
    let id_usuario = req.params.id;
    let id_producto = req.params.idProducto;
    let values= [id_usuario, id_producto];

    sequelize.query('SELECT * FROM favoritos WHERE id_usuario = ? AND id_producto = ?', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects) => {
        if (projects.length > 0) {
            return res.status(400).json({message: 'Ya agregaste este producto a tus favoritos'});
        } 
        sequelize.query('INSERT INTO favoritos (id_usuario, id_producto) VALUES (?, ?)', {
            replacements: values})
        .then((c)=> res.status(200).json({message: 'Producto agregado a favoritos exitosamente'}))
        .catch((err)=> res.status(404).json({status_code: 404}));
    })    
})

// Eliminar un producto de favoritos
router.delete('/usuarios/:id/favoritos/:idProducto', autenticarUsuario, verificarUsuario, verificarProducto, (req, res) => {
    let id_usuario = req.params.id;
    let id_producto = req.params.idProducto;
    let values= [id_usuario, id_producto];

    sequelize.query('DELETE FROM favoritos WHERE id_usuario = ? AND id_producto = ?', 
    { replacements: values})
    .then((r)=> {
        if (r[0].affectedRows == 0) {
            throw new Error();
        } else { 
        res.json({message: 'Eliminado de favoritos'})
        }
    })
    .catch((err)=>res.status(404).json({status_code: 404}));
  });




module.exports= router;