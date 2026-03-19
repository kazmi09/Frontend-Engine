import { GridConfig, getGridConfig } from '../shared/grid-config'
import { GenericQueryBuilder, QueryParams } from './generic-query-builder'
import { DataResult } from '../shared/types'

export class GenericGridService {
  private queryBuilder: GenericQueryBuilder
  private config: GridConfig

  constructor(gridId: string) {
    const config = getGridConfig(gridId)
    if (!config) {
      throw new Error(`Grid configuration not found for ID: ${gridId}`)
    }
    
    this.config = config
    this.queryBuilder = new GenericQueryBuilder(config)
  }

  async getData(params: QueryParams): Promise<DataResult> {
    const queryResult = await this.queryBuilder.executeQuery(params)
    
    // Determine primary key based on data source type
    let primaryKey = 'id' // default
    if (this.config.dataSource.type === 'mysql' && this.config.dataSource.connection) {
      primaryKey = this.config.dataSource.connection.primaryKey
    } else if (this.config.dataSource.type === 'api') {
      // For API sources, use 'id' as default (can be customized per grid)
      primaryKey = 'id'
    }
    
    // Transform to DataResult format
    const result: DataResult = {
      primaryKey,
      columns: this.config.columns,
      rows: queryResult.rows,
      pagination: {
        pageIndex: queryResult.pageIndex,
        pageSize: queryResult.pageSize,
        totalRows: queryResult.totalRows,
      },
      gridId: this.config.id
    }

    // Add expandable configuration if enabled
    if (this.config.expandable?.enabled) {
      result.expandable = {
        renderer: this.config.expandable.component,
        requiredPermissions: this.config.expandable.requiredPermissions || [],
        canExpand: this.config.expandable.canExpand ? 
          eval(`(${this.config.expandable.canExpand})`) : () => true,
        singleExpand: this.config.expandable.singleExpand || false,
        defaultExpanded: this.config.expandable.defaultExpanded || false,
        lazyLoad: this.config.expandable.lazyLoad || false
      }
    }

    return result
  }

  async updateField(rowId: string, field: string, value: any) {
    return this.queryBuilder.updateField(rowId, field, value)
  }

  async bulkEdit(selectedIds: string[], updates: Record<string, any>) {
    if (!this.config.bulkActions?.enabled || !this.config.bulkActions.actions.edit) {
      throw new Error('Bulk edit is not enabled for this grid')
    }
    return this.queryBuilder.bulkEdit(selectedIds, updates)
  }

  async bulkDelete(selectedIds: string[]) {
    if (!this.config.bulkActions?.enabled || !this.config.bulkActions.actions.delete) {
      throw new Error('Bulk delete is not enabled for this grid')
    }
    return this.queryBuilder.bulkDelete(selectedIds)
  }

  async bulkArchive(selectedIds: string[]) {
    if (!this.config.bulkActions?.enabled || !this.config.bulkActions.actions.archive) {
      throw new Error('Bulk archive is not enabled for this grid')
    }
    return this.queryBuilder.bulkArchive(selectedIds)
  }

  async exportData(selectedIds: string[]) {
    if (!this.config.bulkActions?.enabled || !this.config.bulkActions.actions.export) {
      throw new Error('Export is not enabled for this grid')
    }
    return this.queryBuilder.exportData(selectedIds)
  }

  getConfig(): GridConfig {
    return this.config
  }
}