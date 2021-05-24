# delilah-resto
API de pedidos online para un restaurante.

Instrucciones:

* Base de datos.

Este sistema funciona con bases de datos MySQL / MaríaDB.
1 - Instalar MaríaDB (si es necesario, crear variable de entorno con la ruta donde esté instalada MariaDB).
2 - Abrir Heidi o trabajar desde la terminal de comandos.
3 - Crear una nueva base de datos: delilah_resto.
4 - Dentro de la DB delilah_resto crear las tablas e insertar carga inicial (guiarse de los archivos dentro de la carpeta db de este proyecto).

* Express server.

1 - Debes configurar el archivo .env con los datos de configuración de tu base de datos MySQL (similar al arhivo example.env).
2 - Instalar NodeJS (https://nodejs.org/es/).
3 - Abrir la terminal de Visual Studio Code. Verificar que la ruta que muestre la terminal sea la misma en donde se aloja la carpeta en tu pc.
4 - Correr npm install y esperar que finalice.
5 - Correr "node app.js" / "nodemon app.js".

* Swagger.

Dentro de la carpeta 'swagger' encontrarás el archivo spec con la documentación de la API para su correcto uso.

* Postman.

Dentro de la carpeta 'postman' encontrarás la colección 'Delilah_Resto' para probar el funcionamiento de la API.

