import { generateOpenAPI } from '@orpc/openapi'
import { createFetchHandler } from '@orpc/server/fetch'
import { createServerAdapter } from '@whatwg-node/server'
import express from 'express'
import { router } from './router'

const app = express()

const orpcHandler = createFetchHandler({
  router,
  async hooks(context, hooks) {
    try {
      return hooks.next()
    }
    catch (e) {
      console.error(e)
      throw e
    }
  },
})

app.all(
  '/api/*',
  createServerAdapter((request: Request) => {
    const context = request.headers.get('Authorization')
      ? { user: { id: 'test', name: 'John Doe', email: 'john@doe.com' } }
      : {}

    return orpcHandler({
      request,
      prefix: '/api',
      context,
    })
  }),
)

app.get('/spec.json', async (req, res) => {
  const spec = generateOpenAPI({
    router,
    info: {
      title: 'ORPC Playground',
      version: '1.0.0',
      description: `
The example OpenAPI Playground for ORPC.

## Resources

* [Github](https://github.com/unnoq/orpc)
* [Documentation](https://orpc.unnoq.com)
          `,
    },
    servers: [{ url: '/api' /** Should use absolute URLs in production */ }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  })

  res.json(spec)
})

app.get('/', (req, res) => {
  const html = `
      <!doctype html>
      <html>
      <head>
          <title>ORPC Playground</title>
          <meta charset="utf-8" />
          <meta
          name="viewport"
          content="width=device-width, initial-scale=1" />

          <link rel="icon" type="image/svg+xml" href="https://orpc.unnoq.com/icon.svg" />
      </head>
      <body>
          <script
          id="api-reference"
          data-url="/spec.json"
          data-configuration="${JSON.stringify({
            authentication: {
              preferredSecurityScheme: 'bearerAuth',
              http: {
                bearer: {
                  token: 'default-token',
                },
              },
            },
          }).replaceAll('"', '&quot;')}"
          ></script>

          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
      </html>
    `

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
})

app.listen(2026, () => {
  // eslint-disable-next-line no-console
  console.log('Playground is available at http://localhost:2026')
})
