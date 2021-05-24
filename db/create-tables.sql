CREATE DATABASE delilah_resto;

------------- USUARIOS -------------
CREATE TABLE `usuarios` (
	`id_usuario` INT(11) NOT NULL AUTO_INCREMENT,
	`usuario` VARCHAR(200) NOT NULL COLLATE 'latin1_swedish_ci',
	`nombre` VARCHAR(400) NOT NULL COLLATE 'latin1_swedish_ci',
	`correo` VARCHAR(400) NOT NULL COLLATE 'latin1_swedish_ci',
	`telefono` VARCHAR(200) NOT NULL COLLATE 'latin1_swedish_ci',
	`direccion` VARCHAR(800) NOT NULL COLLATE 'latin1_swedish_ci',
	`clave` VARCHAR(400) NOT NULL COLLATE 'latin1_swedish_ci',
	`rol` INT(11) NOT NULL DEFAULT '0' COMMENT '0 Cliente | 1 Admin',
	PRIMARY KEY (`id_usuario`) USING BTREE
)
COMMENT='Datos de usuarios administradores y clientes'
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

------------- PRODUCTOS -------------
CREATE TABLE `productos` (
	`id_producto` INT(11) NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(400) NOT NULL COLLATE 'latin1_swedish_ci',
	`precio` FLOAT NOT NULL DEFAULT '0',
	`imagen` VARCHAR(400) NOT NULL COLLATE 'latin1_swedish_ci',
	PRIMARY KEY (`id_producto`) USING BTREE
)
COMMENT='Listado de productos en el menú'
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

------------- FAVORITOS -------------
CREATE TABLE `favoritos` (
	`id_usuario` INT(11) NOT NULL,
	`id_producto` INT(11) NOT NULL
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

------------- PAGO -------------
CREATE TABLE `pago` (
	`id_pago` INT(11) NOT NULL AUTO_INCREMENT,
	`metodo` VARCHAR(200) NOT NULL COLLATE 'latin1_swedish_ci',
	PRIMARY KEY (`id_pago`) USING BTREE
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

------------- ESTADO -------------
CREATE TABLE `estado` (
	`id_estado` INT(11) NOT NULL AUTO_INCREMENT,
	`nombre` VARCHAR(200) NOT NULL COLLATE 'latin1_swedish_ci',
	PRIMARY KEY (`id_estado`) USING BTREE
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

------------- PEDIDOS -------------
CREATE TABLE `pedidos` (
	`id_pedido` INT(11) NOT NULL AUTO_INCREMENT,
	`fecha` DATETIME NOT NULL DEFAULT current_timestamp(),
	`id_usuario` INT(11) NOT NULL DEFAULT '0',
	`id_pago` INT(11) NOT NULL DEFAULT '1',
	`id_estado` INT(11) NOT NULL DEFAULT '1',
	`total` FLOAT NOT NULL,
	PRIMARY KEY (`id_pedido`) USING BTREE,
	INDEX `FKusuario` (`id_usuario`) USING BTREE,
	INDEX `FKestado` (`id_estado`) USING BTREE,
	INDEX `FKpago` (`id_pago`) USING BTREE,
	CONSTRAINT `FKestado` FOREIGN KEY (`id_estado`) REFERENCES `delilah_resto`.`estado` (`id_estado`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	CONSTRAINT `FKpago` FOREIGN KEY (`id_pago`) REFERENCES `delilah_resto`.`pago` (`id_pago`) ON UPDATE RESTRICT ON DELETE RESTRICT,
	CONSTRAINT `FKusuario` FOREIGN KEY (`id_usuario`) REFERENCES `delilah_resto`.`usuarios` (`id_usuario`) ON UPDATE RESTRICT ON DELETE RESTRICT
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;


------------- PRODUCTOS EN EL PEDIDO -------------
CREATE TABLE `productos_pedido` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`id_pedido` INT(11) NOT NULL DEFAULT '0',
	`id_producto` INT(11) NOT NULL DEFAULT '0',
	`cantidad` INT(11) NOT NULL DEFAULT '0',
	`precio_total` FLOAT NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `FKprod` (`id_producto`) USING BTREE,
	CONSTRAINT `FKprod` FOREIGN KEY (`id_producto`) REFERENCES `delilah_resto`.`productos` (`id_producto`) ON UPDATE RESTRICT ON DELETE RESTRICT
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;
