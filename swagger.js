import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Superhéroes',
      version: '1.0.0',
      description: 'API REST para gestionar superhéroes y villanos con arquitectura limpia',
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
        Hero: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID único del héroe' },
            name: { type: 'string', description: 'Nombre real del héroe' },
            alias: { type: 'string', description: 'Alias o nombre de superhéroe' },
            city: { type: 'string', description: 'Ciudad de origen del héroe' },
            team: { type: 'string', description: 'Equipo al que pertenece' }
          },
          required: ['name', 'alias']
        },
        Villain: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID único del villano' },
            name: { type: 'string', description: 'Nombre real del villano' },
            alias: { type: 'string', description: 'Alias o nombre de villano' },
            city: { type: 'string', description: 'Ciudad de origen del villano' },
            team: { type: 'string', description: 'Equipo al que pertenece' }
          },
          required: ['name', 'alias']
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Mensaje de error' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./controllers/*.js']
};

export const specs = swaggerJsdoc(options); 