import axios from 'axios'

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config) => {
        // Token will be added here from NextAuth session
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor for handling errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default apiClient
