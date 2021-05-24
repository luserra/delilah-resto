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



// Confirmar un pedido - checkout
router.patch('/confirmar/pedidos/:id', autenticarUsuario, (req, res)=> {
    let idPedido = req.params.id;
    let usuario_id = req.usuario.id_usuario;

    let values = {
        idUsuario : usuario_id,
        idPedido: idPedido,
        idEstado: 2
    }
    sequelize.query('UPDATE pedidos SET id_estado = :idEstado WHERE id_pedido = :idPedido AND id_usuario = :idUsuario', 
    {replacements: values})
    .then((r)=> {
        if (r[0].info.includes('Rows matched: 1')) {
            res.json({message: 'Pedido confirmado'});     
        } else {
            throw new Error();
        }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})



// Actualizar un pedido - rol admin
router.patch('/pedidos/:id', autenticarUsuario, verificarAdmin, (req, res) => {
    let idPedido = req.params.id;
    let idEstado = req.body.id_estado;

    let values = {
        idPedido : idPedido,
        idEstado : idEstado
    }

    sequelize.query('UPDATE pedidos SET id_estado = :idEstado WHERE id_pedido = :idPedido',
    {replacements: values}
    ).then ((r) => {
        if (r[0].info.includes('Rows matched: 1')) {
            res.json({message: 'Estado del pedido modificado'});
        } else {
            throw new Error();
        }
    }).catch (err => res.status(404).json({status_code: 404}));

})


// Eliminar un pedido - rol admin
router.delete('/pedidos/:id', autenticarUsuario, verificarAdmin, (req, res) => {
    let idPedido = req.params.id;
    let values = [idPedido];
    sequelize.query(`DELETE FROM pedidos WHERE id_pedido = ?`,
    {replacements: values})
    .then ((r) => {
        if (r[0].affectedRows == 0) {
            throw new Error();
        } else {
            res.json({message: 'Pedido eliminado'})
        }
    })
        .then ((p) => {
            sequelize.query('DELETE FROM productos_pedido WHERE id_pedido = ?',
            {replacements: values})
            .then ((t) => {
                if (t[0].affectedRows == 0) {
                    throw new Error();
                } else {
                    res.json({message: 'Pedido eliminado de productos_pedido'})
                }
        })
    })
    .catch((err) => res.status(404).json({status_code: 404}));
})


//----------- Ver según estado del pedido -----------//
// 1) Ver pedidos nuevos - rol admin
router.get('/pedidos/nuevos', autenticarUsuario, verificarAdmin, (req, res) => {
    sequelize.query(`SELECT
    estado.nombre AS estado, pedidos.fecha, pedidos.id_pedido, pedidos.id_pago, pedidos.total, pedidos.id_usuario,
    usuarios.nombre, usuarios.direccion FROM pedidos JOIN usuarios ON pedidos.id_usuario = usuarios.id_usuario
    JOIN estado ON pedidos.id_estado = estado.id_estado WHERE pedidos.id_estado = 1 ORDER BY fecha`, 
    {type: sequelize.QueryTypes.SELECT})
    .then((pe)=> {
        if (pe.length > 0) { 
        for (let i = 0; i < pe.length; i++) {
            pe[i].descripcion = [];
            let values= [pe[i].id_pedido];
            sequelize.query(`SELECT productos_pedido.id_pedido AS pedido_id, productos.nombre AS nombre_producto, 
            productos_pedido.cantidad AS cantidad from productos_pedido JOIN productos 
            ON productos.id_producto = productos_pedido.id_producto WHERE productos_pedido.id_pedido = ?`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((re)=> {
                for (let x = 0; x < re.length; x++) {
                    if (re[x].id_pedido == pe[i].id) {
                        pe[i].descripcion.push(`${re[x].cantidad}x ${re[x].nombre_producto}`);
                    }
                }
                if (i == pe.length - 1) {
                    res.json(pe);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})


// 2) Ver pedidos confirmados - rol admin
router.get('/pedidos/confirmados', autenticarUsuario, verificarAdmin, (req, res) => {
    sequelize.query(`SELECT
    estado.nombre AS estado, pedidos.fecha, pedidos.id_pedido, pedidos.id_pago, pedidos.total, pedidos.id_usuario,
    usuarios.nombre, usuarios.direccion FROM pedidos JOIN usuarios ON pedidos.id_usuario = usuarios.id_usuario
    JOIN estado ON pedidos.id_estado = estado.id_estado WHERE pedidos.id_estado = 2 ORDER BY fecha`, 
    {type: sequelize.QueryTypes.SELECT})
    .then((pe)=> {
        if (pe.length > 0) { 
        for (let i = 0; i < pe.length; i++) {
            pe[i].descripcion = [];
            let values = [pe[i].id_pedido];
            sequelize.query(`SELECT productos_pedido.id_pedido AS pedido_id, productos.nombre AS nombre_producto, 
            productos_pedido.cantidad AS cantidad from productos_pedido JOIN productos 
            ON productos.id_producto = productos_pedido.id_producto WHERE productos_pedido.id_pedido = ?`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((re)=> {
                for (let x = 0; x < re.length; x++) {
                    if (re[x].id_pedido == pe[i].id) {
                        pe[i].descripcion.push(`${re[x].cantidad}x ${re[x].nombre_producto}`);
                    }
                }
                if (i == pe.length - 1) {
                    res.json(pe);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

// 3) Ver pedidos en preparación - rol admin
router.get('/pedidos/preparando', autenticarUsuario, verificarAdmin, (req, res) => {
    sequelize.query(`SELECT
    estado.nombre AS estado, pedidos.fecha, pedidos.id_pedido, pedidos.id_pago, pedidos.total, pedidos.id_usuario,
    usuarios.nombre, usuarios.direccion FROM pedidos JOIN usuarios ON pedidos.id_usuario = usuarios.id_usuario
    JOIN estado ON pedidos.id_estado = estado.id_estado WHERE pedidos.id_estado = 3 ORDER BY fecha`, 
    {type: sequelize.QueryTypes.SELECT})
    .then((pe)=> {
        if (pe.length > 0) { 
        for (let i = 0; i < pe.length; i++) {
            pe[i].descripcion = [];
            let values= [pe[i].id_pedido];
            sequelize.query(`SELECT productos_pedido.id_pedido AS pedido_id, productos.nombre AS nombre_producto, 
            productos_pedido.cantidad AS cantidad from productos_pedido JOIN productos 
            ON productos.id_producto = productos_pedido.id_producto WHERE productos_pedido.id_pedido = ?`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((re)=> {
                for (let x = 0; x < re.length; x++) {
                    if (re[x].id_pedido == pe[i].id) {
                        pe[i].descripcion.push(`${re[x].cantidad}x ${re[x].nombre_producto}`);
                    }
                }
                if (i == pe.length - 1) {
                    res.json(pe);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

// 4) Ver pedidos enviando - rol admin
router.get('/pedidos/enviando', autenticarUsuario, verificarAdmin, (req, res) => {
    sequelize.query(`SELECT
    estado.nombre AS estado, pedidos.fecha, pedidos.id_pedido, pedidos.id_pago, pedidos.total, pedidos.id_usuario,
    usuarios.nombre, usuarios.direccion FROM pedidos JOIN usuarios ON pedidos.id_usuario = usuarios.id_usuario
    JOIN estado ON pedidos.id_estado = estado.id_estado WHERE pedidos.id_estado = 4 ORDER BY fecha`, 
    {type: sequelize.QueryTypes.SELECT})
    .then((pe)=> {
        if (pe.length > 0) { 
        for (let i = 0; i < pe.length; i++) {
            pe[i].descripcion = [];
            let values= [pe[i].id_pedido];
            sequelize.query(`SELECT productos_pedido.id_pedido AS pedido_id, productos.nombre AS nombre_producto, 
            productos_pedido.cantidad AS cantidad from productos_pedido JOIN productos 
            ON productos.id_producto = productos_pedido.id_producto WHERE productos_pedido.id_pedido = ?`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((re)=> {
                for (let x = 0; x < re.length; x++) {
                    if (re[x].id_pedido == pe[i].id) {
                        pe[i].descripcion.push(`${re[x].cantidad}x ${re[x].nombre_producto}`);
                    }
                }
                if (i == pe.length - 1) {
                    res.json(pe);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

// 5) Ver pedidos cancelados - rol admin
router.get('/pedidos/cancelados', autenticarUsuario, verificarAdmin, (req, res) => {
    sequelize.query(`SELECT
    estado.nombre AS estado, pedidos.fecha, pedidos.id_pedido, pedidos.id_pago, pedidos.total, pedidos.id_usuario,
    usuarios.nombre, usuarios.direccion FROM pedidos JOIN usuarios ON pedidos.id_usuario = usuarios.id_usuario
    JOIN estado ON pedidos.id_estado = estado.id_estado WHERE pedidos.id_estado = 5 ORDER BY fecha`, 
    {type: sequelize.QueryTypes.SELECT})
    .then((pe)=> {
        if (pe.length > 0) { 
        for (let i = 0; i < pe.length; i++) {
            pe[i].descripcion = [];
            let values= [pe[i].id_pedido];
            sequelize.query(`SELECT productos_pedido.id_pedido AS pedido_id, productos.nombre AS nombre_producto, 
            productos_pedido.cantidad AS cantidad from productos_pedido JOIN productos 
            ON productos.id_producto = productos_pedido.id_producto WHERE productos_pedido.id_pedido = ?`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((re)=> {
                for (let x = 0; x < re.length; x++) {
                    if (re[x].id_pedido == pe[i].id) {
                        pe[i].descripcion.push(`${re[x].cantidad}x ${re[x].nombre_producto}`);
                    }
                }
                if (i == pe.length - 1) {
                    res.json(pe);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

// 6) Ver pedidos entregados - rol admin
router.get('/pedidos/entregados', autenticarUsuario, verificarAdmin, (req, res) => {
    sequelize.query(`SELECT
    estado.nombre AS estado, pedidos.fecha, pedidos.id_pedido, pedidos.id_pago, pedidos.total, pedidos.id_usuario,
    usuarios.nombre, usuarios.direccion FROM pedidos JOIN usuarios ON pedidos.id_usuario = usuarios.id_usuario
    JOIN estado ON pedidos.id_estado = estado.id_estado WHERE pedidos.id_estado = 6 ORDER BY fecha`, 
    {type: sequelize.QueryTypes.SELECT})
    .then((pe)=> {
        if (pe.length > 0) { 
        for (let i = 0; i < pe.length; i++) {
            pe[i].descripcion = [];
            let values= [pe[i].id_pedido];
            sequelize.query(`SELECT productos_pedido.id_pedido AS pedido_id, productos.nombre AS nombre_producto, 
            productos_pedido.cantidad AS cantidad from productos_pedido JOIN productos 
            ON productos.id_producto = productos_pedido.id_producto WHERE productos_pedido.id_pedido = ?`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((re)=> {
                for (let x = 0; x < re.length; x++) {
                    if (re[x].id_pedido == pe[i].id) {
                        pe[i].descripcion.push(`${re[x].cantidad}x ${re[x].nombre_producto}`);
                    }
                }
                if (i == pe.length - 1) {
                    res.json(pe);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})

   
// Ver todos los pedidos - rol admin
router.get('/pedidos', autenticarUsuario, verificarAdmin, (req, res) => {
    sequelize.query(`SELECT
    estado.nombre AS estado, pedidos.fecha, pedidos.id_pedido, pedidos.id_pago, pedidos.total, pedidos.id_usuario,
    usuarios.nombre, usuarios.direccion FROM pedidos JOIN usuarios ON pedidos.id_usuario = usuarios.id_usuario
    JOIN estado ON pedidos.id_estado = estado.id_estado ORDER BY fecha`, 
    {type: sequelize.QueryTypes.SELECT})
    .then((pe)=> {
        if (pe.length > 0) { 
        for (let i = 0; i < pe.length; i++) {
            pe[i].descripcion = [];
            let values= [pe[i].id_pedido];
            sequelize.query(`SELECT productos_pedido.id_pedido AS pedido_id, productos.nombre AS nombre_producto, 
            productos_pedido.cantidad AS cantidad from productos_pedido JOIN productos 
            ON productos.id_producto = productos_pedido.id_producto WHERE productos_pedido.id_pedido = ?`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((re)=> {
                for (let x = 0; x < re.length; x++) {
                    if (re[x].id_pedido == pe[i].id) {
                        pe[i].descripcion.push(`${re[x].cantidad}x ${re[x].nombre_producto}`);
                    }
                }
                if (i == pe.length - 1) {
                    res.json(pe);
                }
            })
        }
    } else {
        throw new Error();
    }
    })
    .catch(err=> res.status(404).json({status_code: 404}));
})


// Ver un pedido específico
router.get('/pedidos/:id', autenticarUsuario, verificarAdmin, verPedidos, (req, res) => {
    let idPedido = req.params.id;
    let values = {
        idPedido : idPedido
    }

    sequelize.query('SELECT * FROM pedidos WHERE pedidos.id_pedido = :idPedido', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT})
    .then((projects)=> {
        values.idUsuario = projects[0].id_usuario;
        sequelize.query(`SELECT productos.nombre AS nombre_producto, productos.precio, productos_pedido.precio_total, productos_pedido.cantidad FROM
        productos_pedido JOIN productos ON productos_pedido.id_producto = productos.id_producto WHERE 
        productos_pedido.id_pedido = :idPedido`, 
        { replacements: values,
        type: sequelize.QueryTypes.SELECT})
        .then((con)=> {
            sequelize.query('SELECT sum(precio_total) AS total FROM productos_pedido WHERE id_pedido = :idPedido', 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((te)=> {
                con.push(te[0]);
                sequelize.query('SELECT estado.nombre AS estado FROM pedidos JOIN estado ON pedidos.id_estado = estado.id_estado WHERE pedidos.id_pedido = :idPedido', 
                { replacements: values,
                type: sequelize.QueryTypes.SELECT})
                .then((status)=> {
                    con.push(status[0]);
                    sequelize.query(`SELECT usuarios.direccion, usuarios.nombre, usuarios.usuario, usuarios.correo, 
                    usuarios.telefono FROM pedidos JOIN usuarios ON pedidos.id_usuario = usuarios.id_usuario 
                    WHERE usuarios.id_usuario = :idUsuario`, 
                    { replacements: values,
                    type: sequelize.QueryTypes.SELECT})
                    .then((dir)=> {
                            let datos = [dir[0]]
                            con.push (datos);
                            return res.json(con);
                    })
                     
                })

            })
                       
        })
                
    })
   
})


module.exports = router;