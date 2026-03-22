export interface AuditLog {
  id: number
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  component: string
  action: string
  user: string
  ipAddress: string
  status: number
  responseTime: number
}

const TOTAL_ROWS = 100000
const COMPONENTS = ['AuthService', 'PaymentGateway', 'DataEngine', 'UserAPI', 'NotificationSvc', 'StorageLayer']
const ACTIONS = ['LOGIN', 'LOGOUT', 'TOKEN_REFRESH', 'PAYMENT_PROCESSED', 'RECORD_CREATED', 'RECORD_UPDATED', 'FILE_UPLOADED', 'SEARCH_QUERY']
const USERS = ['admin', 'jdoe', 'asmith', 'bkline', 'system', 'anonymous']
const LEVELS: Array<AuditLog['level']> = ['info', 'warn', 'error', 'debug']

export class MockDataService {
  static getAuditLogs(skip: number, limit: number, search?: string): { data: AuditLog[], total: number } {
    let allLogs: AuditLog[] = []
    
    // In a real high-volume mock service, we'd generate only the requested page.
    // However, to support global search/sort mock-style, we might need a stable stable set or 
    // a deterministic generation.
    // For this demonstration, we'll generate the precise slice requested deterministically 
    // based on the ID to maintain consistency across calls.
    
    const count = Math.min(limit, TOTAL_ROWS - skip)
    const logs: AuditLog[] = []
    
    for (let i = 0; i < count; i++) {
      const id = skip + i + 1
      logs.push(this.generateLogEntry(id))
    }
    
    return {
      data: logs,
      total: TOTAL_ROWS
    }
  }

  private static generateLogEntry(id: number): AuditLog {
    // Deterministic random-like values based on ID
    const component = COMPONENTS[id % COMPONENTS.length]
    const action = ACTIONS[(id * 3) % ACTIONS.length]
    const user = USERS[(id * 7) % USERS.length]
    const level = LEVELS[(id * 11) % LEVELS.length]
    const status = (id % 13 === 0) ? 500 : (id % 7 === 0) ? 403 : 200
    
    // Create a stable timestamp starting from 2024-01-01
    const date = new Date('2024-01-01T00:00:00Z')
    date.setMinutes(date.getMinutes() + id) 
    
    return {
      id,
      timestamp: date.toISOString(),
      level,
      component,
      action,
      user,
      ipAddress: `192.168.1.${id % 255}`,
      status,
      responseTime: 10 + (id % 500)
    }
  }
}
