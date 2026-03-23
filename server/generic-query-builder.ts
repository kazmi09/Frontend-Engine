import { GridConfig, GridDataSource } from '../shared/grid-config'
import { queryMySQL, getMySQLPool } from './mysql-db'
import PDFDocument from 'pdfkit'

export interface QueryParams {
  pageIndex?: number
  pageSize?: number
  searchText?: string
  filterBy?: Record<string, any>
  sorting?: Array<{ id: string; desc: boolean }>
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
      filterBy = {} as Record<string, any>,
      sorting = []
    } = params

    const limit = Math.min(pageSize, 1000000) // Allow up to 1M rows for "All" option
    const offset = pageIndex * limit
    
    console.log('[GenericQueryBuilder] Query params:', { pageIndex, pageSize, limit, offset, searchText, filterBy })

    // Build WHERE clause
    let whereClause = ''
    const queryParams: any[] = []

    if (searchText && this.config.search?.enabled) {
      const searchableColumns = this.config.search.searchableColumns || []
      if (searchableColumns.length > 0) {
        const conditions = searchableColumns.map(col => `${col} LIKE ?`)
        whereClause = `WHERE (${conditions.join(' OR ')})`
        searchableColumns.forEach(() => queryParams.push(`%${searchText}%`))
      }
    }

    if (filterBy && Object.keys(filterBy).length > 0) {
      const filterConditions = Object.entries(filterBy).map(([col, val]) => {
        queryParams.push(`%${val}%`)
        return `${col} LIKE ?`
      })
      if (whereClause) {
        whereClause += ` AND ${filterConditions.join(' AND ')}`
      } else {
        whereClause = `WHERE ${filterConditions.join(' AND ')}`
      }
    }

    // Build ORDER BY clause
    let orderByClause = ''
    if (sorting && sorting.length > 0) {
      const sortConditions = sorting.map((sort: any) => `${sort.id} ${sort.desc ? 'DESC' : 'ASC'}`)
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

    const mappedRows = rows.map((row) => ({
      ...row,
      id: row[connection.primaryKey]?.toString() // Use primary key as ID
    }))
    
    console.log('[GenericQueryBuilder] MySQL Query Result:')
    console.log('  - Query:', dataQuery)
    console.log('  - Primary Key:', connection.primaryKey)
    console.log('  - Total Rows in DB:', totalRows)
    console.log('  - Requested limit:', limit)
    console.log('  - Requested offset:', offset)
    console.log('  - Returned Rows:', mappedRows.length)
    if (mappedRows.length > 0) {
      console.log('  - First Row ID:', mappedRows[0].id)
      console.log('  - Last Row ID:', mappedRows[mappedRows.length - 1].id)
      console.log('  - First Row Sample:', JSON.stringify(mappedRows[0]).substring(0, 200))
    }

    return {
      rows: mappedRows,
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
      searchText = '',
      filterBy = {} as Record<string, any>
    } = params

    const requestedSkip = pageIndex * pageSize
    const targetLimit = pageSize

    // If searching, we skip the virtual pagination for now and let the API handle it
    let endpoint = api.endpoints.list
    if (searchText && this.config.search?.enabled) {
      endpoint = api.endpoints.list.includes('?') ? `${api.endpoints.list}&q=${searchText}` : `${api.endpoints.list}/search?q=${searchText}`
    } else if (filterBy && Object.keys(filterBy).length > 0) {
      const filterKey = Object.keys(filterBy)[0]
      const filterValue = filterBy[filterKey]
      endpoint = `/filter?key=${filterKey}&value=${filterValue}`
    }

    const limitParam = api.queryMapping?.limitParam || 'limit'
    const skipParam = api.queryMapping?.skipParam || 'skip'
    const pageParam = api.queryMapping?.pageParam

    const getPaginationQuery = (skipPos: number) => {
      if (pageParam) {
        const page = Math.floor(skipPos / targetLimit) + 1
        return `${pageParam}=${page}&${limitParam}=${targetLimit}`
      }
      return `${limitParam}=${targetLimit}&${skipParam}=${skipPos}`
    }

    let apiSkip = requestedSkip
    let response = await fetch(`${api.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}${getPaginationQuery(apiSkip)}`, {
      headers: api.headers || {}
    })

    if (!response.ok && (searchText || Object.keys(filterBy).length > 0)) {
      // Fallback if search/filter endpoint didn't work as expected
      response = await fetch(`${api.baseUrl}${api.endpoints.list}${api.endpoints.list.includes('?') ? '&' : '?'}${getPaginationQuery(apiSkip)}`, {
        headers: api.headers || {}
      })
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    let responseData = await response.json()
    
    // Dynamically find the data array
    let listKey = ''
    let allData: any[] = []
    
    for (const key in responseData) {
      if (Array.isArray(responseData[key])) {
        listKey = key
        allData = responseData[key]
        break
      }
    }

    if (!listKey && !Array.isArray(responseData)) {
      throw new Error('Unsupported API response format. Could not find data array.')
    }

    if (Array.isArray(responseData)) {
      allData = responseData
    }

    // If the API doesn't provide a total, estimate it conservatively to enable infinite scrolling.
    // E.g. If we asked for 20 and got 20, assume there's at least one more page.
    let apiTotal = responseData.total || responseData.totalRows || responseData.count

    if (apiTotal === undefined) {
      if (allData.length === targetLimit) {
        // We probably have more pages to load since we got a full page
        apiTotal = requestedSkip + targetLimit + 1
      } else {
        // We reached the end of the data (got less than limit or empty)
        apiTotal = requestedSkip + allData.length
      }
    }

    return {
      rows: allData,
      totalRows: apiTotal,
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
    if (this.config.dataSource.type === 'mysql') {
      const { connection } = this.config.dataSource
      if (!connection) {
        throw new Error('MySQL connection config is required')
      }

      const pool = getMySQLPool()
      const connection_db = await pool.getConnection()

      try {
        let updatedCount = 0
        const errors: string[] = []

        for (const id of selectedIds) {
          const primaryKeyValue = String(id).split('-')[0]

          try {
            // Handle regular field updates
            for (const [field, value] of Object.entries(updates)) {
              // Validate field is editable
              const column = this.config.columns.find(col => col.id === field)
              if (!column || column.editable === false) continue

              const updateQuery = `UPDATE \`${connection.table}\` SET \`${field}\` = ? WHERE \`${connection.primaryKey}\` = ?`
              await connection_db.execute(updateQuery, [value, primaryKeyValue])
            }
            updatedCount++
          } catch (error: any) {
            // Collect errors but continue with other rows
            if (error.code === 'ER_DUP_ENTRY') {
              errors.push(`Row ${primaryKeyValue}: Duplicate value - ${error.sqlMessage}`)
            } else {
              errors.push(`Row ${primaryKeyValue}: ${error.message}`)
            }
          }
        }

        if (errors.length > 0 && updatedCount === 0) {
          // All updates failed
          throw new Error(`Bulk edit failed: ${errors.join('; ')}`)
        }

        return {
          success: true,
          message: `Successfully updated ${updatedCount} records${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
          updatedCount,
          errors: errors.length > 0 ? errors : undefined
        }
      } finally {
        connection_db.release()
      }
    } else if (this.config.dataSource.type === 'api') {
      const { api } = this.config.dataSource
      if (!api) {
        throw new Error('API config is required')
      }

      let updatedCount = 0
      const errors: string[] = []

      // Loop through each ID and update each field
      for (const id of selectedIds) {
        try {
          for (const [field, value] of Object.entries(updates)) {
            // Validate field is editable
            const column = this.config.columns.find(col => col.id === field)
            if (!column || column.editable === false) continue

            await this.updateField(id, field, value)
          }
          updatedCount++
        } catch (error: any) {
          errors.push(`Row ${id}: ${error.message}`)
        }
      }

      return {
        success: updatedCount > 0,
        message: `Successfully updated ${updatedCount} records${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    } else {
      throw new Error('Bulk operations only supported for MySQL and API data sources')
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

          const deleteQuery = `DELETE FROM \`${connection.table}\` WHERE \`${connection.primaryKey}\` = ?`
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
            errors.push(`Failed to delete record ${userId}: ${response.statusText}`)
          }
        } catch (error) {
          errors.push(`Error deleting record ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    if (this.config.dataSource.type === 'mysql') {
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

          const updateQuery = `UPDATE \`${connection.table}\` SET archived = TRUE WHERE \`${connection.primaryKey}\` = ?`
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
    } else if (this.config.dataSource.type === 'api') {
      // Simulate archive by updating an 'archived' field if it exists, 
      // or just call update for each record.
      let archivedCount = 0
      const errors: string[] = []

      for (const id of selectedIds) {
        try {
          await this.updateField(id, 'archived', true)
          archivedCount++
        } catch (error: any) {
          // If the field doesn't exist, this might fail, which is expected for some APIs
          errors.push(`Row ${id}: ${error.message}`)
        }
      }

      return {
        success: archivedCount > 0,
        message: `Successfully archived ${archivedCount} records${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
        archivedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    } else {
      throw new Error('Bulk operations only supported for MySQL and API data sources')
    }
  }

  async exportData(selectedIds: string[], format: 'csv' | 'pdf' = 'csv', sorting?: any[], visibleColumnIds?: string[]): Promise<Buffer | string> {
    const isPDF = format === 'pdf'
    
    // Filter columns to export based on visibility and respect their order
    let columnsToExport = this.config.columns
    if (visibleColumnIds && visibleColumnIds.length > 0) {
      const columnMap = new Map(this.config.columns.map(col => [col.id, col]))
      columnsToExport = visibleColumnIds
        .map(id => columnMap.get(id))
        .filter((col): col is typeof this.config.columns[0] => col !== undefined)
    }
    
    if (this.config.dataSource.type === 'mysql') {
      const { connection } = this.config.dataSource
      if (!connection) {
        throw new Error('MySQL connection config is required')
      }

      const pool = getMySQLPool()
      const connection_db = await pool.getConnection()

      try {
        const primaryKeyValues = selectedIds.map(id => id.split('-')[0])
        const placeholders = primaryKeyValues.map(() => '?').join(',')
        const columnNames = columnsToExport.map(col => `\`${col.id}\``).join(', ')

        // Build sorting clause
        let orderBy = `ORDER BY \`${connection.primaryKey}\``
        if (sorting && sorting.length > 0) {
          const sortClauses = sorting.map(s => `\`${s.id}\` ${s.desc ? 'DESC' : 'ASC'}`)
          orderBy = `ORDER BY ${sortClauses.join(', ')}`
        }

        const query = `
          SELECT ${columnNames}
          FROM \`${connection.table}\` 
          WHERE \`${connection.primaryKey}\` IN (${placeholders})
          ${orderBy}
        `

        const [rows] = await connection_db.execute(query, primaryKeyValues) as any

        if (isPDF) {
          return this.generatePDF(rows, columnsToExport)
        }

        // Generate CSV
        const headers = columnsToExport.map(col => col.label)
        const csvRows = [headers.join(',')]

        rows.forEach((row: any) => {
          const values = columnsToExport.map(col => {
            const value = row[col.id] || ''
            return typeof value === 'string' ? `"${value}"` : value
          })
          csvRows.push(values.join(','))
        })

        return csvRows.join('\n')
      } finally {
        connection_db.release()
      }
    } else if (this.config.dataSource.type === 'api') {
      const { api } = this.config.dataSource
      if (!api) {
        throw new Error('API config is required')
      }

      // Fetch each record
      let rows: any[] = []
      for (const id of selectedIds) {
        try {
          const userId = id.split('-')[0]
          const getUrl = `${api.baseUrl}${api.endpoints.get?.replace('{id}', userId)}`
          const response = await fetch(getUrl, { headers: api.headers || {} })
          if (response.ok) {
            rows.push(await response.json())
          }
        } catch (e) {
          console.error(`Export failed for row ${id}:`, e)
        }
      }

      // Sort rows in memory with null-safe and type-aware comparison
      if (sorting && sorting.length > 0) {
        rows.sort((a, b) => {
          for (const s of sorting) {
            const valA = a[s.id] ?? ''
            const valB = b[s.id] ?? ''
            if (valA === valB) continue
            const comparison = valA < valB ? -1 : 1
            return s.desc ? -comparison : comparison
          }
          return 0
        })
      }

      if (isPDF) {
        return this.generatePDF(rows, columnsToExport)
      }

      // Generate CSV
      const headers = columnsToExport.map(col => col.label)
      const csvRows = [headers.join(',')]

      rows.forEach((row: any) => {
        const values = columnsToExport.map(col => {
          const value = row[col.id] || ''
          return typeof value === 'string' ? `"${value}"` : value
        })
        csvRows.push(values.join(','))
      })

      return csvRows.join('\n')
    } else {
      throw new Error('Export only supported for MySQL and API data sources')
    }
  }

  private async generatePDF(rows: any[], columnsToDrawOverrides?: any[]): Promise<Buffer> {
    const columnsToDraw = columnsToDrawOverrides || this.config.columns
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' })
        const chunks: Buffer[] = []
        
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', err => reject(err))

        // Document Title
        doc.font('Helvetica-Bold').fontSize(16).text(`${this.config.name} Export`, { align: 'center' })
        doc.fontSize(8).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' })
        doc.moveDown(0.5)

        const pageWidth = doc.page.width - 60
        const colCount = columnsToDraw.length
        
        // Dynamic font sizing based on column count to prevent overlap
        const headerSize = colCount > 10 ? 7 : (colCount > 7 ? 8 : 9)
        const rowSize = colCount > 10 ? 6 : (colCount > 7 ? 7 : 8)
        const colWidth = pageWidth / colCount
        const padding = 5

        let currentY = doc.y + 10

        // Draw Table Header
        doc.font('Helvetica-Bold').fontSize(headerSize)
        columnsToDraw.forEach((col: any, i: number) => {
          doc.text(col.label.toUpperCase(), 30 + (i * colWidth), currentY, {
            width: colWidth - padding,
            align: 'left',
            lineBreak: true
          })
        })

        // Measure header height and draw separator
        currentY += 15
        doc.moveTo(30, currentY).lineTo(doc.page.width - 30, currentY).stroke('#cccccc')
        currentY += 10

        // Draw Rows
        doc.font('Helvetica').fontSize(rowSize)
        rows.forEach((row, rowIndex) => {
          // Check for page break
          if (currentY > doc.page.height - 60) {
            doc.addPage({ layout: 'landscape' })
            currentY = 40
            
            // Re-draw header on new page
            doc.font('Helvetica-Bold').fontSize(headerSize)
            columnsToDraw.forEach((col: any, i: number) => {
              doc.text(col.label.toUpperCase(), 30 + (i * colWidth), currentY, {
                width: colWidth - padding,
                align: 'left'
              })
            })
            currentY += 15
            doc.moveTo(30, currentY).lineTo(doc.page.width - 30, currentY).stroke('#cccccc')
            currentY += 10
            doc.font('Helvetica').fontSize(rowSize)
          }

          let maxHeightInRow = rowSize + 2

          columnsToDraw.forEach((col: any, i: number) => {
            const val = row[col.id] ?? ''
            const text = typeof val === 'object' ? JSON.stringify(val) : String(val)
            
            const textOptions = {
              width: colWidth - padding,
              align: 'left' as const,
              lineBreak: true,
              height: 30, // Cap individual cell height to prevent runaway rows
              ellipsis: true
            }
            
            doc.text(text, 30 + (i * colWidth), currentY, textOptions)
          })

          currentY += 35 // Advance by capped cell height + margin
          
          // Row separator line
          doc.moveTo(30, currentY - 2).lineTo(doc.page.width - 30, currentY - 2).lineWidth(0.5).stroke('#eeeeee')
        })

        doc.end()
      } catch (err) {
        reject(err)
      }
    })
  }
}