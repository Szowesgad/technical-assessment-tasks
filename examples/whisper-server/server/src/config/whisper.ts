import { getPath } from '../utils/paths';
import path from 'path';

export const WHISPER_CONFIG = {
  model: {
    name: 'ggml-large-v3-turbo.bin',
    path: getPath('models', 'ggml-large-v3-turbo.bin')
  },
  binary: {
    name: 'whisper-cli',
    path: path.dirname(getPath('models', 'whisper-cli'))
  },
  defaultOptions: {
    language: 'pl',
    task: 'transcribe',
    format: 'text',
    timestamps: true,
    word_timestamps: true
  }
} as const;

// Verify paths exist
import { promises as fs } from 'fs';

export const validateWhisperSetup = async () => {
  try {
    await fs.access(WHISPER_CONFIG.model.path);
    console.log(`✅ Model file found at: ${WHISPER_CONFIG.model.path}`);
    
    const binaryFullPath = path.join(WHISPER_CONFIG.binary.path, WHISPER_CONFIG.binary.name);
    await fs.access(binaryFullPath);
    console.log(`✅ Whisper binary found at: ${binaryFullPath}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error validating whisper setup:', error);
    return false;
  }
};