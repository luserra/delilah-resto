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

// Ver productos
router.get('/productos', autenticarUsuario, (req, res) => {
    sequelize.query('SELECT id_producto, nombre, precio, imagen FROM productos',
    { type: sequelize.QueryTypes.SELECT }
    ).then(function(projects) {
        res.json(projects);
    })
    .catch( err => res.status(404).json({status_code: 404}));
})


// Crear nuevo producto - rol admin
router.post('/productos', autenticarUsuario, verificarAdmin, (req, res) => {
    let nuevo_prod = {
        nombre: req.body.nombre,
        precio: req.body.precio,
        imagen: req.body.imagen,
    }

    let values = {
        nombre: nuevo_prod.nombre,
        precio: nuevo_prod.precio,
        imagen: nuevo_prod.imagen,
    };

    sequelize.query('SELECT * FROM productos where nombre = :nombre',
    { replacements: values,
    type: sequelize.QueryTypes.SELECT }
    ).then ((projects) => {
        if (projects.length >= 1) {
            return res.status(400).json({message: 'El producto ya existe'});
        }
        sequelize.query('INSERT INTO productos (nombre, precio, imagen) VALUES (:nombre, :precio, :imagen)', {
        replacements: values})
        .then((x) => {
            res.status(201).json({message: 'Nuevo producto creado exitosamente'});
        })
    })

})


// Actualizar producto - rol admin
router.patch('/productos/:id', autenticarUsuario, verificarAdmin, (req, res) => {
    let id_producto = req.params.id;

    let prod_actualizado = {
        nombre: req.body.nombre,
        precio: req.body.precio,
        imagen: req.body.imagen
    }

    let actualizar = {};
    for (const property in prod_actualizado) {
        if (prod_actualizado[property] == undefined) {
            console.log('Omitir');
        } else {
            actualizar[`${property}`] = prod_actualizado[property];
        }
    }

    let uno = 'UPDATE productos SET';
    let dos = [];
    for (const nuevo in actualizar) {
        dos.push(` ${nuevo} = '${actualizar[nuevo]}'`);
    }
    let tres = ` WHERE id_producto = ${id_producto}`
    let cuatro = uno + dos + tres;

    sequelize.query(cuatro)
    .then((r) => { 
        if (r[0].info.includes('Rows matched: 1')) {
            res.status(200).json({message: 'Producto actualizado exitosamente'})
        } else {
            throw new Error();
        }       
    })
    .catch((err) => res.status(404).json({status_code: 404}));
    })


// Eliminar producto - rol admin
router.delete('/productos/:id', autenticarUsuario, verificarAdmin, (req, res) => {
    let id_producto = req.params.id;
    let values = [id_producto];

    sequelize.query('DELETE FROM productos WHERE id_producto = ?', {
        replacements: values
    })
    .then((r) => {
        if (r[0].affectedRows == 0) {
            throw new Error();
        } else {
            res.json({message: 'Producto eliminado correctamente'})
        }
    })
    .catch((err) => res.status(404).json({status_code: 404}));
})




module.exports= router;