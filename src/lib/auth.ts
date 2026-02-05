import { User } from '@/types'

const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@destek.com',
    name: 'Yönetici',
    role: 'admin'
  },
  {
    id: '2',
    username: 'teknisyen1',
    email: 'teknisyen1@destek.com',
    name: 'Ahmet Yılmaz',
    role: 'technician'
  },
  {
    id: '3',
    username: 'teknisyen2',
    email: 'teknisyen2@destek.com',
    name: 'Ayşe Demir',
    role: 'technician'
  }
]

export const mockLogin = async (username: string, password: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 1000))

  const user = MOCK_USERS.find(u => u.username === username)
  if (user && password === '123456') {
    return user
  }

  return null
}

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null

  const userStr = localStorage.getItem('currentUser')
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export const setCurrentUser = (user: User | null) => {
  if (typeof window === 'undefined') return

  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user))
  } else {
    localStorage.removeItem('currentUser')
  }
}

export const logout = () => {
  setCurrentUser(null)
}
