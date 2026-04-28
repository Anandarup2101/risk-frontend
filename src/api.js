import axios from 'axios';

const api = axios.create({
  // Comment these only when serving React build from FastAPI code
  baseURL: "https://risk-analysis-gtczgeh0gse2f5a5.southindia-01.azurewebsites.net",
  // baseURL: "http://localhost:8000",
  // Uncomment these only when serving React build from FastAPI
  // baseURL: '',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;