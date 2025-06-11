import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useNotificationStore } from '@/stores/verbeterplein/notification_store';
import i18n from '@/main';
const t = i18n.global.t;

const notification = useNotificationStore();
let ffmpeg: FFmpeg | null = null;

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  // Load FFmpeg with explicit URLs
  await ffmpeg.load({
    coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', 'text/javascript'),
    wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', 'application/wasm'),
    workerURL: await toBlobURL('https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/esm/worker.js', 'text/javascript')
  });

  return ffmpeg;
}

interface TranscodeOptions {
  inputFile: File;
  format: string;
  videoBitrate?: string;
  audioBitrate?: string;
  width?: number;
  height?: number;
}

interface TranscodeResult {
  outputFile: File;
}

async function transcodeVideo(options: TranscodeOptions): Promise<TranscodeResult> {
  const { inputFile, format, videoBitrate = '10000k', audioBitrate = '128k', width, height } = options;
  const ffmpeg = await loadFFmpeg();
  try {
    await ffmpeg.writeFile('input', await fetchFile(inputFile));
    let ffmpegArgs = ['-i', 'input', '-c:v', 'libx264', '-preset', 'ultrafast', '-b:v', videoBitrate, '-c:a', 'aac', '-b:a', audioBitrate];
    if (width && height) {
      ffmpegArgs = [...ffmpegArgs, '-vf', `scale=${width}:${height}`];
    }
    ffmpegArgs = [...ffmpegArgs, '-f', format, `output.${format}`];
    await ffmpeg.exec(ffmpegArgs);
    const outputData = await ffmpeg.readFile(`output.${format}`);
    const outputFile = new File([outputData], `output.${format}`, { type: `video/${format}` });
    return { outputFile };
  } catch (error: any) {
    notification.error({ message: t('errors.transcoding_error', { error: error }) });
    throw error;
  }
}

export { transcodeVideo };
export type { TranscodeOptions, TranscodeResult };
