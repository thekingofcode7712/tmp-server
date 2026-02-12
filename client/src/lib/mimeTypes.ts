/**
 * MIME Type Detection Utility
 * Provides fallback MIME type detection for files where browser can't detect type
 */

const extensionToMimeType: Record<string, string> = {
  // Code files
  'js': 'text/javascript',
  'jsx': 'text/javascript',
  'ts': 'text/typescript',
  'tsx': 'text/typescript',
  'py': 'text/x-python',
  'java': 'text/x-java',
  'cpp': 'text/x-c++src',
  'c': 'text/x-csrc',
  'h': 'text/x-chdr',
  'cs': 'text/x-csharp',
  'php': 'text/x-php',
  'rb': 'text/x-ruby',
  'go': 'text/x-go',
  'rs': 'text/x-rustsrc',
  'swift': 'text/x-swift',
  'kt': 'text/x-kotlin',
  'scala': 'text/x-scala',
  'sh': 'text/x-shellscript',
  'bash': 'text/x-shellscript',
  'zsh': 'text/x-shellscript',
  'fish': 'text/x-shellscript',
  'sql': 'text/x-sql',
  
  // Config files
  'json': 'application/json',
  'xml': 'application/xml',
  'yaml': 'text/yaml',
  'yml': 'text/yaml',
  'toml': 'text/toml',
  'ini': 'text/plain',
  'conf': 'text/plain',
  'config': 'text/plain',
  'env': 'text/plain',
  
  // Markup/Styling
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'scss': 'text/x-scss',
  'sass': 'text/x-sass',
  'less': 'text/x-less',
  'md': 'text/markdown',
  'markdown': 'text/markdown',
  
  // Documents
  'txt': 'text/plain',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'odt': 'application/vnd.oasis.opendocument.text',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  'odp': 'application/vnd.oasis.opendocument.presentation',
  
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  'm4a': 'audio/mp4',
  'aac': 'audio/aac',
  'wma': 'audio/x-ms-wma',
  
  // Video
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
  'flv': 'video/x-flv',
  'webm': 'video/webm',
  'mkv': 'video/x-matroska',
  'm4v': 'video/x-m4v',
  
  // Archives
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
  'bz2': 'application/x-bzip2',
  'xz': 'application/x-xz',
  
  // Executables
  'exe': 'application/x-msdownload',
  'dll': 'application/x-msdownload',
  'app': 'application/x-executable',
  'dmg': 'application/x-apple-diskimage',
  'deb': 'application/x-debian-package',
  'rpm': 'application/x-rpm',
  'apk': 'application/vnd.android.package-archive',
  
  // Fonts
  'ttf': 'font/ttf',
  'otf': 'font/otf',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'eot': 'application/vnd.ms-fontobject',
  
  // Data files
  'csv': 'text/csv',
  'tsv': 'text/tab-separated-values',
  'sqlite': 'application/x-sqlite3',
  'db': 'application/x-sqlite3',
  
  // 3D/CAD
  'stl': 'model/stl',
  'obj': 'model/obj',
  'fbx': 'application/octet-stream',
  'blend': 'application/x-blender',
  
  // Other
  'iso': 'application/x-iso9660-image',
  'torrent': 'application/x-bittorrent',
  'psd': 'image/vnd.adobe.photoshop',
  'ai': 'application/postscript',
};

/**
 * Get MIME type from file name
 * Falls back to application/octet-stream if unknown
 */
export function getMimeType(fileName: string, browserMimeType?: string): string {
  // If browser detected a MIME type, use it
  if (browserMimeType && browserMimeType !== '') {
    return browserMimeType;
  }
  
  // Extract extension
  const parts = fileName.toLowerCase().split('.');
  if (parts.length < 2) {
    return 'application/octet-stream';
  }
  
  const extension = parts[parts.length - 1];
  return extensionToMimeType[extension] || 'application/octet-stream';
}

/**
 * Check if file type is supported for preview
 */
export function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith('image/') || 
         mimeType.startsWith('video/') || 
         mimeType.startsWith('audio/') ||
         mimeType === 'application/pdf' ||
         mimeType.startsWith('text/');
}

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) return 'Code/Text';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'Document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z')) return 'Archive';
  if (mimeType.includes('executable') || mimeType.includes('msdownload') || mimeType.includes('package')) return 'Executable';
  return 'Other';
}
