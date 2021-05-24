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


// Agregar un producto al carrito
router.post('/carrito/pedidos/productos/:idProducto', autenticarUsuario, verificarProducto, (req, res) => {
    let idUsuario = req.usuario.id_usuario;
    let idProducto = req.params.idProducto;
    
    let values = {
        id_usuario : idUsuario,
        id_pago : 1,
        id_estado : 1,
        id_producto : idProducto
    };
   
    sequelize.query('SELECT * FROM pedidos JOIN productos ON pedidos.id_usuario = :id_usuario  AND pedidos.id_estado = 1', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then(function(projects) {
        if (projects.length > 0) {
            values.id_pedido = projects[0].id_pedido;
            sequelize.query(`SELECT * FROM productos_pedido JOIN productos ON productos_pedido.id_producto = :id_producto
             AND productos_pedido.id_pedido = :id_pedido AND productos.id_producto = :id_producto`, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((product)=> {
                if (product.length > 0) {
                    values.nuevaCant = product[0].cantidad + 1;
                    values.nuevoPrecio = product[0].precio * values.nuevaCant;
                    sequelize.query(`UPDATE productos_pedido SET cantidad = :nuevaCant, precio_total = :nuevoPrecio 
                                     WHERE id_pedido = :id_pedido AND id_producto = :id_producto`, 
                    { replacements: values})
                    .then((r)=> {
                        sequelize.query('SELECT sum(precio_total) AS total FROM productos_pedido WHERE id_pedido = :id_pedido', 
                        { replacements: values,
                        type: sequelize.QueryTypes.SELECT})
                        .then((sumaP) => {
                        values.precioTotal = sumaP[0].total;
                        sequelize.query('UPDATE pedidos SET total = :precioTotal WHERE id_pedido = :id_pedido', 
                        { replacements: values})
                            .then((r)=> {
                                res.json({message: 'Actualizaste tu carrito!'});
                            })
                        })   
                    })
                } else { //Si el producto no está en el carrito, lo agrego
                    sequelize.query('SELECT * FROM productos WHERE id_producto = :id_producto', 
                    { replacements: values, 
                        type: sequelize.QueryTypes.SELECT}
                    )
                    .then((pro) => { 
                        values.id_pedido = projects[0].id_pedido;
                        values.precio = pro[0].precio;
                        sequelize.query('INSERT INTO productos_pedido (id_pedido, id_producto, cantidad, precio_total) VALUES (:id_pedido, :id_producto, 1, :precio)', 
                        { replacements: values})
                        .then((r)=> {
                            sequelize.query('SELECT sum(precio_total) AS total FROM productos_pedido WHERE id_pedido = :id_pedido', 
                            { replacements: values,
                            type: sequelize.QueryTypes.SELECT}
                            ).then((sumaP)=> {
                            values.precioTotal= sumaP[0].total;
                            sequelize.query('UPDATE pedidos SET total = :precioTotal WHERE id_pedido = :id_pedido', 
                            { replacements: values})
                                .then((r)=> {
                                    res.json({message: 'Agregaste un producto a tu carrito!'});
                                })
                            })   
                        })
                    })
                }
            })
        
        } else  {
        //creo la orden con el estado 1 - Si no hay ya pedidos lo creo y agrego prod a carrito  
            sequelize.query('INSERT INTO pedidos (id_usuario, id_pago, id_estado, total) VALUES (:id_usuario, :id_pago, :id_estado, 0)', 
            { replacements: values}
            ).then((projects)=> {
                values.id_pedido = projects[0];
                sequelize.query('SELECT productos.precio AS precio_producto FROM productos WHERE productos.id_producto = :id_producto', 
                { replacements: values,
                type: sequelize.QueryTypes.SELECT}
                ).then((pre)=> {
                    values.precioProd = pre[0].precio_producto;
                    sequelize.query('INSERT INTO productos_pedido (id_pedido, id_producto, cantidad, precio_total) VALUES (:id_pedido, :id_producto, 1, :precioProd)', 
                    { replacements: values}
                        ).then((re)=> {
                            sequelize.query('SELECT sum(precio_total) AS total FROM productos_pedido WHERE id_pedido = :id_pedido', 
                            { replacements: values,
                            type: sequelize.QueryTypes.SELECT}
                            ).then((sumaP)=> {
                            values.precioTotal= sumaP[0].total;
                            sequelize.query('UPDATE pedidos SET total = :precioTotal WHERE id_pedido = :id_pedido', 
                            { replacements: values})
                                .then((r)=> {
                                    res.json({message: 'Nuevo Producto agregado a tu carrito!'});
                                })
                            })
                        })
                })
            })
        }
    })

})



// Ver carrito
router.get('/carrito/:idUsuario/pedidos/:id', autenticarUsuario, (req, res) => {
    const idUsuario = req.params.idUsuario;
    let idPedido = req.params.id;

    let values= {
        idUsuario: idUsuario,
        idPedido: idPedido
    }

    sequelize.query('SELECT * FROM pedidos WHERE id_usuario = :idUsuario AND id_pedido = :idPedido', 
    { replacements: values,
    type: sequelize.QueryTypes.SELECT}
    ).then((projects)=> {
        if (!projects[0].total) {
            return res.send('Carrito vacio');
        } 
        if (projects[0].id_estado = 1 ) {
            sequelize.query(`SELECT productos.nombre, productos.precio, productos_pedido.cantidad 
            FROM productos_pedido JOIN productos ON productos_pedido.id_producto = productos.id_producto
            WHERE productos_pedido.id_pedido = :idPedido `, 
            { replacements: values,
            type: sequelize.QueryTypes.SELECT})
            .then((result)=> {
                sequelize.query('SELECT sum(precio_total) AS total FROM productos_pedido WHERE id_pedido = :idPedido', 
                { replacements: values,
                type: sequelize.QueryTypes.SELECT})
                .then((final)=> {
                    result.push(final[0]);
                    sequelize.query(`SELECT usuarios.direccion FROM pedidos JOIN usuarios 
                    ON pedidos.id_usuario = usuarios.id_usuario WHERE usuarios.id_usuario = :idUsuario`, 
                    { replacements: values,
                    type: sequelize.QueryTypes.SELECT})
                    .then((address)=> {
                        result.push(address[0]);
                        res.json(result);
                    })
                })
            })
        }
        
    }).catch(err=> res.status(404).json({status_code: 404}));

})

// Eliminar un producto del carrito
router.delete('/carrito/pedidos/:idPedido/productos/:idProducto', autenticarUsuario, (req, res) => {
    let idPedido = req.params.idPedido;
    let idProducto = req.params.idProducto;

    let values = {
        idPedido : idPedido,
        idProducto : idProducto
    }

    sequelize.query(`SELECT * FROM productos_pedido WHERE id_pedido = :idPedido`,
    {replacements: values,
    type: sequelize.QueryTypes.SELECT })
        .then ((re) => {
            if (re == '[]') {
                res.status(404).json({status_code: 404});
            }
            sequelize.query(`DELETE FROM productos_pedido WHERE id_producto = :idProducto 
            AND id_pedido = :idPedido`,
            { replacements: values })
            .then ((j) => {
                if (j[0].affectedRows == 0) {
                    res.status(404).json({status_code: 404, message: 'Datos incorrectos'});
                } else {
                    sequelize.query('SELECT sum(precio_total) AS total FROM productos_pedido WHERE id_pedido = :idPedido',
                    {replacements: values,
                    type: sequelize.QueryTypes.SELECT }
                    ).then ((sumaP) => {
                        values.total = sumaP[0].total;
                        if (values.total  == null) {
                        sequelize.query('UPDATE pedidos SET total = 0, id_estado = 5 WHERE id_pedido = :idPedido',
                        { replacements: values })
                        .then((s) => {
                            res.json({message: 'Eliminaste el único producto de tu carrito!'});
                        })
                        } else {
                            sequelize.query('UPDATE pedidos SET total = :total WHERE id_pedido = :idPedido',
                            { replacements: values })
                            .then((l) => {
                                res.json({message: 'Eliminaste un producto de tu carrito!'});
                            })
                        }
                    })
                
                }
        })
        .catch( err => res.status(404).json({status_code: 404}));
    })
})



module.exports = router;