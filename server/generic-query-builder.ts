import { GridConfig, GridDataSource } from '../shared/grid-config'
import { queryMySQL, getMySQLPool } from './mysql-db'

export interface QueryParams {
  pageIndex?: number
  pageSize?: number
  searchText?: string
  filterBy?: string
  sortBy?: Array<{ id: string; desc: boolean }>
}

export interface QueryResult {
  rows: any[]
  totalRows: number
  pageIndex: number
  pageSize: number
}

export class GenericQueryBuilder {
  private config: GridConfig

  constructor(config: GridConfig) {
    this.config = config
  }

  async executeQuery(params: QueryParams): Promise<QueryResult> {
    switch (this.config.dataSource.type) {
      case 'mysql':
        return this.executeMySQLQuery(params)
      case 'api':
        return this.executeAPIQuery(params)
      case 'static':
        return this.executeStaticQuery(params)
      default:
        throw new Error(`Unsupported data source type: ${this.config.dataSource.type}`)
    }
  }

  private async executeMySQLQuery(params: QueryParams): Promise<QueryResult> {
    const { connection } = this.config.dataSource
    if (!connection) {
      throw new Error('MySQL connection config is required')
    }

    const {
      pageIndex = 0,
      pageSize = 20,
      searchText = '',
      filterBy = '',
      sortBy = []
    } = params

    const limit = Math.min(pageSize, 1000)
    const offset = pageIndex * limit

    // Build WHERE clause
    let whereClause = ''
    const queryParams: any[] = []

    if (searchText && this.config.search?.enabled) {
      const searchableColumns = this.config.search.searchableColumns || []
      
      if (filterBy && searchableColumns.includes(filterBy)) {
        // Filter by specific column
        whereClause = `WHERE ${filterBy} LIKE ?`
        queryParams.push(`%${searchText}%`)
      } else if (searchableColumns.length > 0) {
        // Search across all searchable columns
        const conditions = searchableColumns.map(col => `${col} LIKE ?`)
        whereClause = `WHERE (${conditions.join(' OR ')})`
        searchableColumns.forEach(() => queryParams.push(`%${searchText}%`))
      }
    }

    // Build ORDER BY clause
    let orderByClause = ''
    if (sortBy.length > 0) {
      const sortConditions = sortBy.map(sort => `${sort.id} ${sort.desc ? 'DESC' : 'ASC'}`)
      orderByClause = `ORDER BY ${sortConditions.join(', ')}`
    } else {
      orderByClause = `ORDER BY ${connection.primaryKey} DESC`
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${connection.table} ${whereClause}`
    const countResult = await queryMySQL<any>(countQuery, queryParams)
    const totalRows = countResult[0]?.total || 0

    // Get column names from config
    const columnNames = this.config.columns.map(col => col.id).join(', ')

    // Get paginated data
    const dataQuery = `
      SELECT ${columnNames}
      FROM ${connection.table}
      ${whereClause}
      ${orderByClause}
      LIMIT ${limit} OFFSET ${offset}
    `

    const rows = await queryMySQL<any>(dataQuery, queryParams)

    return {
      rows: rows.map((row, index) => ({
        ...row,
        id: `${row[connection.primaryKey]}-${index}` // Create unique ID
      })),
      totalRows,
      pageIndex,
      pageSize: limit
    }
  }

  private async executeAPIQuery(params: QueryParams): Promise<QueryResult> {
    const { api } = this.config.dataSource
    if (!api) {
      throw new Error('API config is required')
    }

    const {
      pageIndex = 0,
      pageSize = 20,
      searchText = ''
    } = params

    // Build URL with pagination parameters
    let url = `${api.baseUrl}${api.endpoints.list}`
    const urlParams = new URLSearchParams()
    
    // DummyJSON uses limit and skip for pagination
    urlParams.append('limit', pageSize.toString())
    urlParams.append('skip', (pageIndex * pageSize).toString())
    
    // Add search if supported
    if (searchText && this.config.search?.enabled) {
      // For DummyJSON, we'll fetch all data and filter client-side
      // since their search API is limited
      urlParams.delete('limit')
      urlParams.delete('skip')
      urlParams.append('limit', '0') // Get all data for client-side filtering
    }
    
    url += `?${urlParams.toString()}`

    // Fetch data from API
    const response = await fetch(url, {
      headers: api.headers || {}
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    let responseData = await response.json()
    let allData: any[] = []
    let totalRows = 0

    // Handle different API response formats
    if (responseData.users) {
      // DummyJSON format: { users: [...], total: 208, skip: 0, limit: 30 }
      allData = responseData.users
      totalRows = responseData.total || allData.length
    } else if (Array.isArray(responseData)) {
      // Simple array format
      allData = responseData
      totalRows = allData.length
    } else {
      throw new Error('Unsupported API response format')
    }

    // Client-side filtering for search
    if (searchText && this.config.search?.enabled) {
      const searchableColumns = this.config.search.searchableColumns || []
      allData = allData.filter((item: any) => {
        return searchableColumns.some(col => {
          const value = item[col]
          return value && value.toString().toLowerCase().includes(searchText.toLowerCase())
        })
      })
      totalRows = allData.length
    }

    // Client-side pagination (if we fetched all data for search)
    let paginatedData = allData
    if (searchText || !responseData.users) {
      const startIndex = pageIndex * pageSize
      const endIndex = startIndex + pageSize
      paginatedData = allData.slice(startIndex, endIndex)
    }

    return {
      rows: paginatedData.map((row: any) => ({ 
        ...row, 
        id: row.id || row.pk_id || `row-${Math.random()}` 
      })),
      totalRows,
      pageIndex,
      pageSize
    }
  }

  private async executeStaticQuery(params: QueryParams): Promise<QueryResult> {
    const { static: staticData } = this.config.dataSource
    if (!staticData) {
      throw new Error('Static data config is required')
    }

    const {
      pageIndex = 0,
      pageSize = 20,
      searchText = ''
    } = params

    let data = [...staticData.data]

    // Client-side filtering
    if (searchText && this.config.search?.enabled) {
      const searchableColumns = this.config.search.searchableColumns || []
      data = data.filter(item => {
        return searchableColumns.some(col => {
          const value = item[col]
          return value && value.toString().toLowerCase().includes(searchText.toLowerCase())
        })
      })
    }

    // Client-side pagination
    const totalRows = data.length
    const startIndex = pageIndex * pageSize
    const endIndex = startIndex + pageSize
    const rows = data.slice(startIndex, endIndex)

    return {
      rows: rows.map((row, index) => ({ ...row, id: row.id || `static-${index}` })),
      totalRows,
      pageIndex,
      pageSize
    }
  }

  async updateField(rowId: string, field: string, value: any): Promise<any> {
    // Ensure rowId is a string
    const rowIdStr = String(rowId)
    
    if (this.config.dataSource.type === 'mysql') {
      // MySQL implementation (existing code)
      const { connection } = this.config.dataSource
      if (!connection) {
        throw new Error('MySQL connection config is required')
      }

      // Parse the row ID to get the primary key value
      const primaryKeyValue = rowIdStr.split('-')[0]

      // Validate field is editable
      const column = this.config.columns.find(col => col.id === field)
      if (!column || column.editable === false) {
        throw new Error(`Field '${field}' is not editable`)
      }

      const pool = getMySQLPool()
      const connection_db = await pool.getConnection()

      try {
        const updateQuery = `UPDATE ${connection.table} SET ${field} = ? WHERE ${connection.primaryKey} = ?`
        const [result] = await connection_db.execute(updateQuery, [value, primaryKeyValue]) as any

        if (result.affectedRows === 0) {
          throw new Error('No rows were updated')
        }

        return {
          success: true,
          message: `Updated ${field} successfully`,
          rowId: rowIdStr,
          field,
          value,
          affectedRows: result.affectedRows
        }
      } finally {
        connection_db.release()
      }
    } else if (this.config.dataSource.type === 'api') {
      // API implementation for external APIs like DummyJSON
      const { api } = this.config.dataSource
      if (!api) {
        throw new Error('API config is required')
      }

      // For DummyJSON, we need to send a PUT request to update the user
      const userId = rowIdStr.split('-')[0] // Extract actual user ID
      const updateUrl = `${api.baseUrl}${api.endpoints.update?.replace('{id}', userId)}`
      
      if (!updateUrl || !api.endpoints.update) {
        throw new Error('Update endpoint not configured for this API')
      }

      // Prepare the update payload
      const updatePayload = { [field]: value }

      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(api.headers || {})
        },
        body: JSON.stringify(updatePayload)
      })

      if (!response.ok) {
        throw new Error(`API update failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        success: true,
        message: `Updated ${field} successfully`,
        rowId: rowIdStr,
        field,
        value,
        apiResponse: result
      }
    } else {
      throw new Error('Field updates only supported for MySQL and API data sources')
    }
  }

  async bulkEdit(selectedIds: string[], updates: Record<string, any>): Promise<any> {
    if (this.config.dataSource.type !== 'mysql') {
      throw new Error('Bulk operations only supported for MySQL data sources')
    }

    const { connection } = this.config.dataSource
    if (!connection) {
      throw new Error('MySQL connection config is required')
    }

    const pool = getMySQLPool()
    const connection_db = await pool.getConnection()

    try {
      let updatedCount = 0

      for (const id of selectedIds) {
        const primaryKeyValue = String(id).split('-')[0]

        // Handle salary adjustment
        if (updates._salaryAdjustment) {
          const { type, value } = updates._salaryAdjustment
          let salaryUpdateQuery = ""

          if (type === 'percentage') {
            salaryUpdateQuery = `UPDATE ${connection.table} SET salary = ROUND(salary * (1 + ? / 100), 2) WHERE ${connection.primaryKey} = ?`
            await connection_db.execute(salaryUpdateQuery, [value, primaryKeyValue])
          } else if (type === 'amount') {
            salaryUpdateQuery = `UPDATE ${connection.table} SET salary = salary + ? WHERE ${connection.primaryKey} = ?`
            await connection_db.execute(salaryUpdateQuery, [value, primaryKeyValue])
          }
          updatedCount++
        }

        // Handle regular field updates
        for (const [field, value] of Object.entries(updates)) {
          if (field === '_salaryAdjustment') continue

          // Validate field is editable
          const column = this.config.columns.find(col => col.id === field)
          if (!column || column.editable === false) continue

          const updateQuery = `UPDATE ${connection.table} SET ${field} = ? WHERE ${connection.primaryKey} = ?`
          await connection_db.execute(updateQuery, [value, primaryKeyValue])
          updatedCount++
        }
      }

      return {
        success: true,
        message: `Successfully updated ${selectedIds.length} records`,
        updatedCount: selectedIds.length
      }
    } finally {
      connection_db.release()
    }
  }

  async bulkDelete(selectedIds: string[]): Promise<any> {
    if (this.config.dataSource.type === 'mysql') {
      // MySQL implementation (existing code)
      const { connection } = this.config.dataSource
      if (!connection) {
        throw new Error('MySQL connection config is required')
      }

      const pool = getMySQLPool()
      const connection_db = await pool.getConnection()

      try {
        let deletedCount = 0

        for (const id of selectedIds) {
          const primaryKeyValue = String(id).split('-')[0]

          const deleteQuery = `DELETE FROM ${connection.table} WHERE ${connection.primaryKey} = ?`
          const [result] = await connection_db.execute(deleteQuery, [primaryKeyValue]) as any

          if (result.affectedRows > 0) {
            deletedCount++
          }
        }

        return {
          success: true,
          message: `Successfully deleted ${deletedCount} records`,
          deletedCount
        }
      } finally {
        connection_db.release()
      }
    } else if (this.config.dataSource.type === 'api') {
      // API implementation for external APIs like DummyJSON
      const { api } = this.config.dataSource
      if (!api) {
        throw new Error('API config is required')
      }

      let deletedCount = 0
      const errors: string[] = []

      // Delete each record individually
      for (const id of selectedIds) {
        try {
          const userId = String(id).split('-')[0]
          const deleteUrl = `${api.baseUrl}${api.endpoints.delete?.replace('{id}', userId)}`
          
          if (!deleteUrl || !api.endpoints.delete) {
            throw new Error('Delete endpoint not configured for this API')
          }

          const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: api.headers || {}
          })

          if (response.ok) {
            deletedCount++
          } else {
            errors.push(`Failed to delete user ${userId}: ${response.statusText}`)
          }
        } catch (error) {
          errors.push(`Error deleting user ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return {
        success: deletedCount > 0,
        message: `Successfully deleted ${deletedCount} records${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    } else {
      throw new Error('Bulk operations only supported for MySQL and API data sources')
    }
  }

  async bulkArchive(selectedIds: string[]): Promise<any> {
    if (this.config.dataSource.type !== 'mysql') {
      throw new Error('Bulk operations only supported for MySQL data sources')
    }

    const { connection } = this.config.dataSource
    if (!connection) {
      throw new Error('MySQL connection config is required')
    }

    const pool = getMySQLPool()
    const connection_db = await pool.getConnection()

    try {
      // Try to add archived column if it doesn't exist
      try {
        await connection_db.execute(`ALTER TABLE ${connection.table} ADD COLUMN archived BOOLEAN DEFAULT FALSE`)
      } catch (e) {
        // Column might already exist, ignore error
      }

      for (const id of selectedIds) {
        const primaryKeyValue = String(id).split('-')[0]

        const updateQuery = `UPDATE ${connection.table} SET archived = TRUE WHERE ${connection.primaryKey} = ?`
        await connection_db.execute(updateQuery, [primaryKeyValue])
      }

      return {
        success: true,
        message: `Successfully archived ${selectedIds.length} records`,
        archivedCount: selectedIds.length
      }
    } finally {
      connection_db.release()
    }
  }

  async exportData(selectedIds: string[]): Promise<string> {
    if (this.config.dataSource.type !== 'mysql') {
      throw new Error('Export only supported for MySQL data sources')
    }

    const { connection } = this.config.dataSource
    if (!connection) {
      throw new Error('MySQL connection config is required')
    }

    const pool = getMySQLPool()
    const connection_db = await pool.getConnection()

    try {
      const primaryKeyValues = selectedIds.map(id => id.split('-')[0])
      const placeholders = primaryKeyValues.map(() => '?').join(',')
      const columnNames = this.config.columns.map(col => col.id).join(', ')

      const query = `
        SELECT ${columnNames}
        FROM ${connection.table} 
        WHERE ${connection.primaryKey} IN (${placeholders})
        ORDER BY ${connection.primaryKey}
      `

      const [rows] = await connection_db.execute(query, primaryKeyValues) as any

      // Generate CSV
      const headers = this.config.columns.map(col => col.label)
      const csvRows = [headers.join(',')]

      rows.forEach((row: any) => {
        const values = this.config.columns.map(col => {
          const value = row[col.id] || ''
          return typeof value === 'string' ? `"${value}"` : value
        })
        csvRows.push(values.join(','))
      })

      return csvRows.join('\n')
    } finally {
      connection_db.release()
    }
  }
}