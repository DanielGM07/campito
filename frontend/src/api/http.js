// File: frontend/src/api/http.js

const BASE_URL = 'http://localhost/campito/backend/public/index.php'

async function request(action, { method = 'GET', body } = {}) {
  const url = `${BASE_URL}?action=${encodeURIComponent(action)}`

  const options = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)

  let data
  try {
    data = await res.json()
  } catch (e) {
    throw new Error('Respuesta inválida del servidor')
  }

  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición')
  }

  return data
}

export const api = {
  get(action) {
    return request(action, { method: 'GET' })
  },
  post(action, body) {
    return request(action, { method: 'POST', body })
  },
  put(action, body) {
    return request(action, { method: 'PUT', body })
  },
  delete(action, body) {
    return request(action, { method: 'DELETE', body })
  },
}
