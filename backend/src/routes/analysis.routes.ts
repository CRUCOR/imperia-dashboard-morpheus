/**
 * Analysis Routes
 * Defines routes for analysis operations
 */

import { Router } from 'express';
import { analysisController } from '../controllers';
import upload from '../middleware/upload.middleware';

const router = Router();

/**
 * @swagger
 * /results:
 *   get:
 *     summary: List all analyses
 *     description: Retrieve a paginated list of all analyses
 *     tags: [Analysis]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of analyses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       analysisId:
 *                         type: string
 *                       modelName:
 *                         type: string
 *                       status:
 *                         type: string
 *                       duration_ms:
 *                         type: number
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       completed_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     count:
 *                       type: integer
 *             examples:
 *               success:
 *                 summary: List of analyses
 *                 value:
 *                   results:
 *                     - analysisId: analysis_1728168000_abc123
 *                       modelName: abp
 *                       status: completed
 *                       duration_ms: 2500
 *                       created_at: "2025-10-05T10:00:00.000Z"
 *                       completed_at: "2025-10-05T10:00:02.500Z"
 *                     - analysisId: analysis_1728168001_def456
 *                       modelName: abp
 *                       status: processing
 *                       created_at: "2025-10-05T10:05:00.000Z"
 *                   pagination:
 *                     limit: 50
 *                     offset: 0
 *                     count: 2
 *       500:
 *         description: Internal server error
 */
router.get('/results', analysisController.listAnalyses);

/**
 * @swagger
 * /analyze:
 *   post:
 *     summary: Create and start a new analysis
 *     description: Upload a file and start an ABP (Anomalous Behavior Profiling) analysis with configurable parameters
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Input file to analyze (max 100MB)
 *               model_name:
 *                 type: string
 *                 default: abp
 *                 description: Name of the model to use for analysis
 *                 example: abp
 *               pipeline_batch_size:
 *                 type: integer
 *                 description: Batch size for the pipeline processing
 *                 example: 256
 *               model_max_batch_size:
 *                 type: integer
 *                 description: Maximum batch size for the model
 *                 example: 32
 *               num_threads:
 *                 type: integer
 *                 description: Number of threads for parallel processing
 *                 example: 8
 *           examples:
 *             basic:
 *               summary: Basic ABP analysis
 *               value:
 *                 file: (binary)
 *                 model_name: abp
 *             optimized:
 *               summary: ABP analysis with optimized parameters
 *               value:
 *                 file: (binary)
 *                 model_name: abp
 *                 pipeline_batch_size: 256
 *                 model_max_batch_size: 32
 *                 num_threads: 8
 *     responses:
 *       202:
 *         description: Analysis started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysisId:
 *                   type: string
 *                   example: analysis_1728168000_abc123
 *                 status:
 *                   type: string
 *                   example: processing
 *                 message:
 *                   type: string
 *                   example: Analysis started successfully
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   analysisId: analysis_1728168000_abc123
 *                   status: processing
 *                   message: Analysis started successfully
 *       400:
 *         description: Bad request - No file uploaded or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               noFile:
 *                 summary: No file uploaded
 *                 value:
 *                   error: No file uploaded
 *               invalidType:
 *                 summary: Invalid file type
 *                 value:
 *                   error: Invalid file type. Only images and DICOM files are allowed.
 *       413:
 *         description: File too large (exceeds 100MB)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *             example:
 *               error: Payload Too Large
 *               message: File size exceeds the 100MB limit
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/analyze', upload.single('file'), analysisController.createAnalysis);

/**
 * @swagger
 * /results/{analysisId}:
 *   get:
 *     summary: Get analysis result by ID
 *     description: Retrieve the complete result of a specific analysis
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *         description: The analysis ID
 *         example: analysis_1728168000_abc123
 *     responses:
 *       200:
 *         description: Analysis result retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysisId:
 *                   type: string
 *                 modelName:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [processing, completed, failed]
 *                 result:
 *                   type: object
 *                 duration_ms:
 *                   type: number
 *                 error:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 completed_at:
 *                   type: string
 *                   format: date-time
 *             examples:
 *               completed:
 *                 summary: Completed analysis
 *                 value:
 *                   analysisId: analysis_1728168000_abc123
 *                   modelName: abp
 *                   status: completed
 *                   result:
 *                     analysisId: analysis_1728168000_abc123
 *                     model: abp
 *                     predictions:
 *                       - class: benign
 *                         confidence: 0.92
 *                         bounding_box:
 *                           x: 150
 *                           y: 200
 *                           width: 80
 *                           height: 90
 *                       - class: malignant
 *                         confidence: 0.08
 *                         bounding_box:
 *                           x: 450
 *                           y: 300
 *                           width: 60
 *                           height: 70
 *                     metadata:
 *                       file_name: mammogram.jpg
 *                       file_size_mb: 5.2
 *                       processing_time_sec: 3.5
 *                       gpu_used: false
 *                   duration_ms: 3500
 *                   created_at: "2025-10-05T10:00:00.000Z"
 *                   completed_at: "2025-10-05T10:00:03.500Z"
 *               processing:
 *                 summary: Analysis still processing
 *                 value:
 *                   analysisId: analysis_1728168000_abc123
 *                   modelName: abp
 *                   status: processing
 *                   created_at: "2025-10-05T10:00:00.000Z"
 *               failed:
 *                 summary: Failed analysis
 *                 value:
 *                   analysisId: analysis_1728168000_abc123
 *                   modelName: abp
 *                   status: failed
 *                   error: Connection timeout to Morpheus service
 *                   created_at: "2025-10-05T10:00:00.000Z"
 *                   completed_at: "2025-10-05T10:00:30.000Z"
 *       404:
 *         description: Analysis not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Analysis not found
 *       500:
 *         description: Internal server error
 */
router.get('/results/:analysisId', analysisController.getAnalysisResult);

/**
 * @swagger
 * /metrics/{analysisId}:
 *   get:
 *     summary: Get analysis metrics by ID
 *     description: Retrieve all metrics collected during a specific analysis (collected every 5 seconds)
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *         description: The analysis ID
 *         example: analysis_1728168000_abc123
 *     responses:
 *       200:
 *         description: Analysis metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysisId:
 *                   type: string
 *                 metrics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       analysis_id:
 *                         type: string
 *                       gpu_usage:
 *                         type: number
 *                         description: GPU usage percentage
 *                       gpu_mem_mb:
 *                         type: number
 *                         description: GPU memory usage in MB
 *                       cpu_usage:
 *                         type: number
 *                         description: CPU usage percentage
 *                       ram_mb:
 *                         type: number
 *                         description: RAM usage in MB
 *                       duration_ms:
 *                         type: number
 *                         description: Elapsed time since analysis start in milliseconds
 *                       throughput:
 *                         type: number
 *                         description: Processing throughput
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *             examples:
 *               success:
 *                 summary: Metrics for completed analysis
 *                 value:
 *                   analysisId: analysis_1728168000_abc123
 *                   metrics:
 *                     - id: 1
 *                       analysis_id: analysis_1728168000_abc123
 *                       gpu_usage: 75.2
 *                       gpu_mem_mb: 4096.5
 *                       cpu_usage: 45.3
 *                       ram_mb: 2048.7
 *                       duration_ms: 0
 *                       throughput: 125.4
 *                       timestamp: "2025-10-05T10:00:00.000Z"
 *                     - id: 2
 *                       analysis_id: analysis_1728168000_abc123
 *                       gpu_usage: 78.5
 *                       gpu_mem_mb: 4200.2
 *                       cpu_usage: 48.1
 *                       ram_mb: 2100.3
 *                       duration_ms: 5000
 *                       throughput: 130.2
 *                       timestamp: "2025-10-05T10:00:05.000Z"
 *       404:
 *         description: Analysis not found or no metrics available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Analysis not found or no metrics available
 *       500:
 *         description: Internal server error
 */
router.get('/metrics/:analysisId', analysisController.getAnalysisMetrics);

export default router;
