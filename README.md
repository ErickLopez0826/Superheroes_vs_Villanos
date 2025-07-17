# API de Superhéroes

Una API REST completa para gestionar superhéroes utilizando arquitectura limpia en JavaScript.

## Arquitectura del Proyecto

```
/api-superheroes
│
├── /controllers     # Controladores - Manejan las peticiones HTTP
│   └── heroController.js
├── /services        # Servicios - Lógica de negocio
│   └── heroService.js
├── /repositories    # Repositorios - Acceso a datos
│   └── heroRepository.js
├── /models          # Modelos - Estructura de datos
│   └── heroModel.js
├── app.js           # Archivo principal de la aplicación
├── package.json     # Configuración del proyecto
├── superheroes.json # Archivo de datos (se crea automáticamente)
└── README.md        # Este archivo
```

## Instalación

1. Navega al directorio del proyecto:
```bash
cd api-superheroes
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor:
```bash
# Para desarrollo (con nodemon)
npm run dev

# Para producción
npm start
```

El servidor se ejecutará en `http://localhost:3000`

## Endpoints de la API

### Obtener todos los héroes
```
GET /api/heroes
```

### Obtener un héroe por ID
```
GET /api/heroes/:id
```

### Crear un nuevo héroe
```
POST /api/heroes
Content-Type: application/json

{
  "name": "Iron Man",
  "alias": "Tony Stark",
  "power": "Tecnología",
  "team": "Avengers",
  "origin": "Marvel"
}
```

### Actualizar un héroe
```
PUT /api/heroes/:id
Content-Type: application/json

{
  "power": "Tecnología Avanzada"
}
```

### Eliminar un héroe
```
DELETE /api/heroes/:id
```

## Estructura de Datos

Cada héroe tiene la siguiente estructura:

```json
{
  "id": "string",
  "name": "string",
  "alias": "string",
  "power": "string",
  "team": "string",
  "origin": "string",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

## Características

- ✅ Arquitectura limpia (Clean Architecture)
- ✅ Separación de responsabilidades
- ✅ Manejo de errores
- ✅ Validación de datos
- ✅ Persistencia en archivo JSON
- ✅ API REST completa
- ✅ Código modular y reutilizable

## Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **JavaScript ES6+** - Lenguaje de programación
- **JSON** - Almacenamiento de datos

## Desarrollo

Para desarrollo, se recomienda usar `nodemon` que reiniciará automáticamente el servidor cuando detecte cambios en los archivos:

```bash
npm run dev
```

## Pruebas

Puedes probar la API usando herramientas como:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

### Ejemplo con curl:

```bash
# Obtener todos los héroes
curl http://localhost:3000/api/heroes

# Crear un nuevo héroe
curl -X POST http://localhost:3000/api/heroes \
  -H "Content-Type: application/json" \
  -d '{"name":"Wonder Woman","alias":"Diana Prince","power":"Fuerza","team":"Justice League","origin":"DC Comics"}'
``` 