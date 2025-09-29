import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { UploadedFile } from '@/types'

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void
  accept?: Record<string, string[]>
}

export function FileUpload({ onFileUploaded, accept }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)

    try {
      // Simulate upload - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        path: `/uploads/${file.name}`,
      }

      setUploadedFile(uploadedFile)
      onFileUploaded(uploadedFile)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }, [onFileUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  })

  const clearFile = () => {
    setUploadedFile(null)
  }

  if (uploadedFile) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-green-600">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-jupyter-orange bg-orange-50'
          : 'border-gray-300 hover:border-gray-400',
        uploading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} disabled={uploading} />
      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      {uploading ? (
        <div>
          <p className="text-lg font-medium text-gray-700">Uploading...</p>
          <div className="mt-2 w-24 h-1 bg-gray-200 rounded mx-auto overflow-hidden">
            <div className="w-full h-full bg-jupyter-orange animate-pulse" />
          </div>
        </div>
      ) : isDragActive ? (
        <p className="text-lg font-medium text-jupyter-orange">
          Drop the file here...
        </p>
      ) : (
        <div>
          <p className="text-lg font-medium text-gray-700">
            Drag & drop a file here, or click to select
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Supports JSON, CSV, TXT files
          </p>
        </div>
      )}
    </div>
  )
}