import axios from 'axios';

const api = axios.create({
  // Comment these only when serving React build from FastAPI
  baseURL: 'http://localhost:8000',
  // Uncomment these only when serving React build from FastAPI
  // baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;