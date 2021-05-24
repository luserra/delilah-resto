----- CARGA INICIAL METODOS DE PAGO -----
INSERT INTO pago (metodo)
VALUES  ('Efectivo'),
        ('Débito'),
        ('Crédito'),
        ('Transferencia');

----- CARGA INICIAL ESTADOS -----
INSERT INTO estado (nombre)
VALUES  ('Nuevo'),
        ('Confirmado'),
        ('Preparando'),
        ('Enviando'),
        ('Cancelado'),
        ('Entregado');


--------------- OPCIONALES ---------------
----- CARGA INICIAL PRODUCTOS -----
INSERT INTO productos (nombre, precio, imagen)
VALUES  ('Sandwich veggie', 430, 'sanveggie.jpg'),
        ('Hamburguesa clásica', 510, 'hamcla.jpg'),
        ('Verde veggie', 410, 'verde.jpg'),
        ('Focaccia', 390, 'focaccia.jpg');

