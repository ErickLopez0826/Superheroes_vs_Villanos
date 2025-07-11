import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Personajes',
      version: '1.0.0',
      description: 'API REST para gestionar personajes (superhéroes y villanos) y peleas entre ellos. Solo se permiten peleas entre un superhéroe y un villano.',
      contact: {
        name: 'Desarrollador',
        email: 'tu-email@ejemplo.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: {
        Personaje: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID único del personaje' },
            nombre: { type: 'string', description: 'Nombre del personaje' },
            ciudad: { type: 'string', description: 'Ciudad de origen' },
            tipo: { type: 'string', enum: ['superheroe', 'villano'], description: 'Tipo de personaje' },
            vida: { type: 'integer', description: 'Vida actual del personaje', default: 100 }
          },
          required: ['nombre', 'tipo']
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Mensaje de error' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Autenticación' },
      { name: 'Usuarios', description: 'Gestión de usuarios' },
      { name: 'Personajes', description: 'Gestión de personajes (superhéroes y villanos)' },
      { name: 'Equipos', description: 'Gestión de equipos' },
      { name: 'Peleas', description: 'Gestión de peleas' }
    ]
  },
  apis: ['./controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec; 