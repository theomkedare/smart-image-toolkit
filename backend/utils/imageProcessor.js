import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DIRS } from './fileUtils.js';

export const processImage = async (options) => {
  const { inputPath, originalName, settings } = options;

  const outputFormat = settings.format || 'jpeg';
  const outputFileName = `${uuidv4()}.${outputFormat}`;
  const outputPath = path.join(DIRS.processed, outputFileName);

  let image = sharp(inputPath);

  if (settings.width || settings.height) {
    image = image.resize({
      width: settings.width || null,
      height: settings.height || null,
      fit: 'inside',
    });
  }

  await image
    .toFormat(outputFormat, { quality: settings.quality || 80 })
    .toFile(outputPath);

  return {
    outputPath,
    outputFileName,
  };
};