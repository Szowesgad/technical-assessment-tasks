import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { transcribe, WhisperOptions } from './utils/whisper';
import { getPath } from './utils/paths';
import { WHISPER_CONFIG, validateWhisperSetup } from './config/whisper';
import { createValidationError, createTranscriptionError, createFileSystemError } from './utils/errors';
import type { 
  APIResult,
  TranscriptionRequest, 
  TranscriptionResponse,
  HealthCheckResponse 
} from './types/api';

const app = express();
const port = 3001;

// Allow both development endpoints
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.111:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

const UPLOADS_DIR = getPath('uploads');

const ensureDirectoryExists = async (dir: string) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// File filter function for multer
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'audio/wav',
    'audio/x-wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/m4a',
    'audio/mp4',
    'audio/x-m4a',
    'audio/x-hx-aac-adts'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`));
  }
};

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await ensureDirectoryExists(UPLOADS_DIR);
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Keep original extension
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
  // limits: { // <--- Usuń cały ten blok limits
  //   fileSize: 50 * 1024 * 1024 // 50MB limit
  // }
});

const cleanupUpload = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Warning: Failed to cleanup uploaded file:', error);
    throw createFileSystemError('delete', filePath, (error as Error).message);
  }
};

const validateUploadedFile = async (filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    console.log(`📁 Uploaded file stats:
      - Size: ${stats.size} bytes
      - Created: ${stats.birthtime}
      - Path: ${filePath}
    `);
    
    if (stats.size === 0) {
      throw new Error('Uploaded file is empty');
    }
    
    return true;
  } catch (error) {
    console.error('❌ File validation error:', error);
    throw error;
  }
};

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  // Validate request
  if (!req.file) {
    const response: APIResult<never> = {
      success: false,
      error: createValidationError('audio', 'No audio file provided')
    };
    return res.status(400).json(response);
  }

  try {
    // Validate uploaded file
    await validateUploadedFile(req.file.path);

    console.log(`🎵 Processing audio file:
      - Original name: ${req.file.originalname}
      - Mime type: ${req.file.mimetype}
      - Size: ${req.file.size} bytes
      - Saved as: ${req.file.filename}
    `);

    const whisperOptions: WhisperOptions = {
      modelPath: WHISPER_CONFIG.model.path,
      binaryPath: path.join(WHISPER_CONFIG.binary.path, WHISPER_CONFIG.binary.name),
      language: req.body.language || WHISPER_CONFIG.defaultOptions.language,
      task: req.body.task || WHISPER_CONFIG.defaultOptions.task,
      format: req.body.format || WHISPER_CONFIG.defaultOptions.format,
      timestamps: WHISPER_CONFIG.defaultOptions.timestamps,
      word_timestamps: WHISPER_CONFIG.defaultOptions.word_timestamps
    };

    console.log('🔄 Starting transcription with options:', whisperOptions);

    const transcript = await transcribe(req.file.path, whisperOptions);
    console.log('✅ Transcription completed successfully');

    const response: APIResult<TranscriptionResponse> = {
      success: true,
      data: {
        rawText: transcript
      }
    };

    await cleanupUpload(req.file.path);
    res.json(response);
  } catch (error) {
    console.error('❌ Transcription error:', error);
    if (req.file) {
      try {
        await cleanupUpload(req.file.path);
      } catch {
        // Ignore cleanup errors on transcription failure
      }
    }

    const response: APIResult<never> = {
      success: false,
      error: createTranscriptionError((error as Error).message, {
        audioFile: req.file?.originalname,
        modelName: WHISPER_CONFIG.model.name
      })
    };
    res.status(500).json(response);
  }
});

app.get('/health', (req, res) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    uploadDir: UPLOADS_DIR,
    modelPath: WHISPER_CONFIG.model.path,
    binaryPath: path.join(WHISPER_CONFIG.binary.path, WHISPER_CONFIG.binary.name),
    modelName: WHISPER_CONFIG.model.name,
    model: 'ready'
  };
  res.json(response);
});

const start = async () => {
  await ensureDirectoryExists(UPLOADS_DIR);
  await validateWhisperSetup();
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${port}`);
    console.log(`📁 Using uploads directory: ${UPLOADS_DIR}`);
    console.log(`🧠 Using model file: ${WHISPER_CONFIG.model.path}`);
    console.log(`⚙️  Using whisper binary: ${path.join(WHISPER_CONFIG.binary.path, WHISPER_CONFIG.binary.name)}`);
  });
};

start().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});