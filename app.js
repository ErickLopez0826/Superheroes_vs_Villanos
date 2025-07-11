import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'
import heroController from './controllers/heroController.js'
import userController from './controllers/userController.js'
import fightController from './controllers/fightController.js'
import authController from './controllers/authController.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import userRepository from './repositories/userRepository.js'

const app = express()
const JWT_SECRET = 'supersecretkey123' // En producción, usa variable de entorno

app.use(express.json())

// Endpoint de login (ahora en authController)
app.use('/api', authController)

// Endpoint de registro de usuario (antes del middleware de autenticación)
app.use('/api', userController)

// Middleware de autenticación JWT (debe ir antes de las rutas protegidas)
function authenticateJWT(req, res, next) {
  if (req.path === '/api/login' || req.path === '/api/users' || req.path.startsWith('/api-docs')) {
    return next()
  }
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' })
      }
      req.user = user
      next()
    })
  } else {
    res.status(401).json({ error: 'Token no proporcionado' })
  }
}
app.use(authenticateJWT)

// Endpoints protegidos
app.use('/api', fightController)
app.use('/api', heroController)

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API de Personajes - Documentación'
}))

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API de Personajes funcionando correctamente',
    documentation: 'http://localhost:3000/api-docs',
    endpoints: {
      users: 'http://localhost:3000/api/users',
      personajes: 'http://localhost:3000/api/personajes',
      personajesByTipo: 'http://localhost:3000/api/personajes/tipo/{tipo}',
      personajesByCiudad: 'http://localhost:3000/api/personajes/ciudad/{ciudad}',
      fights: 'http://localhost:3000/api/fights',
      login: 'http://localhost:3000/api/login'
    }
  })
})

const PORT = 3000
app.listen(PORT, _ => {
    console.log(`Servidor corriendo en el puerto ${PORT}`)
    console.log(`📚 Documentación Swagger: http://localhost:${PORT}/api-docs`)
})