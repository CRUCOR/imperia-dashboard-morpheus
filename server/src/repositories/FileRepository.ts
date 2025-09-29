import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { UploadedFile } from '@/types'

export interface IFileRepository {
  save(file: Express.Multer.File): Promise<UploadedFile>
  findById(id: string): Promise<UploadedFile | null>
  findByPath(filePath: string): Promise<UploadedFile | null>
  delete(id: string): Promise<boolean>
  exists(filePath: string): Promise<boolean>
}

export class LocalFileRepository implements IFileRepository {
  private files: Map<string, UploadedFile> = new Map()
  private pathIndex: Map<string, string> = new Map() // path -> id mapping

  async save(file: Express.Multer.File): Promise<UploadedFile> {
    const uploadedFile: UploadedFile = {
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadTime: new Date(),
    }

    this.files.set(uploadedFile.id, uploadedFile)
    this.pathIndex.set(uploadedFile.path, uploadedFile.id)

    return uploadedFile
  }

  async findById(id: string): Promise<UploadedFile | null> {
    return this.files.get(id) || null
  }

  async findByPath(filePath: string): Promise<UploadedFile | null> {
    const id = this.pathIndex.get(filePath)
    return id ? this.files.get(id) || null : null
  }

  async delete(id: string): Promise<boolean> {
    const file = this.files.get(id)
    if (!file) return false

    try {
      await fs.unlink(file.path)
      this.files.delete(id)
      this.pathIndex.delete(file.path)
      return true
    } catch (error) {
      return false
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async getFileInfo(filePath: string): Promise<{ size: number; mtime: Date } | null> {
    try {
      const stats = await fs.stat(filePath)
      return {
        size: stats.size,
        mtime: stats.mtime,
      }
    } catch {
      return null
    }
  }
}