import type { Express } from "express";
import { GenericGridService } from './generic-grid-service'
import { getGridConfig, getAllGridConfigs } from '../shared/grid-config'

export function registerGenericGridRoutes(app: Express) {
  
  // Get all available grid configurations
  app.get("/api/grids", async (req, res) => {
    try {
      const configs = getAllGridConfigs()
      const publicConfigs = configs.map(config => ({
        id: config.id,
        name: config.name,
        description: config.description,
        columns: config.columns.map(col => ({
          id: col.id,
          label: col.label,
          type: col.type
        }))
      }))
      
      res.json(publicConfigs)
    } catch (error: any) {
      console.error("[API] Error fetching grid configs:", error)
      res.status(500).json({ 
        error: "Failed to fetch grid configurations", 
        message: error.message 
      })
    }
  })

  // Get grid configuration
  app.get("/api/grid/:gridId/config", async (req, res) => {
    try {
      const { gridId } = req.params
      const config = getGridConfig(gridId)
      
      if (!config) {
        return res.status(404).json({ error: `Grid configuration not found: ${gridId}` })
      }
      
      res.json(config)
    } catch (error: any) {
      console.error("[API] Error fetching grid config:", error)
      res.status(500).json({ 
        error: "Failed to fetch grid configuration", 
        message: error.message 
      })
    }
  })

  // Get grid data with pagination, search, and filtering
  app.get("/api/grid/:gridId/data", async (req, res) => {
    try {
      const { gridId } = req.params
      
      // Parse query parameters
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 1000)
      const offset = parseInt(req.query.offset as string) || 0
      const pageIndex = Math.floor(offset / limit)
      const searchText = (req.query.search as string) || ""
      const filterBy = (req.query.filterBy as string) || ""
      
      // Parse sorting
      let sortBy: Array<{ id: string; desc: boolean }> = []
      if (req.query.sortBy) {
        try {
          sortBy = JSON.parse(req.query.sortBy as string)
        } catch (e) {
          // Invalid sort format, ignore
        }
      }
      
      const gridService = new GenericGridService(gridId)
      const result = await gridService.getData({
        pageIndex,
        pageSize: limit,
        searchText,
        filterBy,
        sortBy
      })
      
      res.json(result)
    } catch (error: any) {
      console.error(`[API] Error fetching data for grid ${req.params.gridId}:`, error)
      res.status(500).json({ 
        error: "Failed to fetch grid data", 
        message: error.message 
      })
    }
  })

  // Update a single field
  app.patch("/api/grid/:gridId/field", async (req, res) => {
    try {
      const { gridId } = req.params
      const { rowId, field, value } = req.body
      
      if (!rowId || !field || value === undefined) {
        return res.status(400).json({ error: "rowId, field, and value are required" })
      }
      
      const gridService = new GenericGridService(gridId)
      const result = await gridService.updateField(rowId, field, value)
      
      res.json(result)
    } catch (error: any) {
      console.error(`[API] Error updating field for grid ${req.params.gridId}:`, error)
      res.status(500).json({ 
        error: "Failed to update field", 
        message: error.message 
      })
    }
  })

  // Bulk edit
  app.patch("/api/grid/:gridId/bulk/edit", async (req, res) => {
    try {
      const { gridId } = req.params
      const { selectedIds, updates } = req.body
      
      if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
        return res.status(400).json({ error: "selectedIds array is required" })
      }
      
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: "updates object is required" })
      }
      
      const gridService = new GenericGridService(gridId)
      const result = await gridService.bulkEdit(selectedIds, updates)
      
      res.json(result)
    } catch (error: any) {
      console.error(`[API] Error in bulk edit for grid ${req.params.gridId}:`, error)
      res.status(500).json({ 
        error: "Failed to bulk edit records", 
        message: error.message 
      })
    }
  })

  // Bulk archive
  app.patch("/api/grid/:gridId/bulk/archive", async (req, res) => {
    try {
      const { gridId } = req.params
      const { selectedIds } = req.body
      
      if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
        return res.status(400).json({ error: "selectedIds array is required" })
      }
      
      const gridService = new GenericGridService(gridId)
      const result = await gridService.bulkArchive(selectedIds)
      
      res.json(result)
    } catch (error: any) {
      console.error(`[API] Error in bulk archive for grid ${req.params.gridId}:`, error)
      res.status(500).json({ 
        error: "Failed to archive records", 
        message: error.message 
      })
    }
  })

  // Bulk delete
  app.delete("/api/grid/:gridId/bulk/delete", async (req, res) => {
    try {
      const { gridId } = req.params
      const { selectedIds } = req.body
      
      if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
        return res.status(400).json({ error: "selectedIds array is required" })
      }
      
      const gridService = new GenericGridService(gridId)
      const result = await gridService.bulkDelete(selectedIds)
      
      res.json(result)
    } catch (error: any) {
      console.error(`[API] Error in bulk delete for grid ${req.params.gridId}:`, error)
      res.status(500).json({ 
        error: "Failed to delete records", 
        message: error.message 
      })
    }
  })

  // Export data
  app.post("/api/grid/:gridId/export", async (req, res) => {
    try {
      const { gridId } = req.params
      const { selectedIds } = req.body
      
      if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
        return res.status(400).json({ error: "selectedIds array is required" })
      }
      
      const gridService = new GenericGridService(gridId)
      const csvContent = await gridService.exportData(selectedIds)
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${gridId}_export_${new Date().toISOString().split('T')[0]}.csv"`)
      res.send(csvContent)
    } catch (error: any) {
      console.error(`[API] Error in export for grid ${req.params.gridId}:`, error)
      res.status(500).json({ 
        error: "Failed to export data", 
        message: error.message 
      })
    }
  })
}