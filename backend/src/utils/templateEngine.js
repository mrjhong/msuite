import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sanitizeHtml from 'sanitize-html';


// Obtener __dirname equivalente en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directorio donde se guardarán las plantillas compiladas
const STORAGE_PATH = path.join(__dirname, '../../storagehtml');

// Crear directorio si no existe
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}
// Filtro de sanitización para HTML
const htmlFilter = {
  allowedTags: [ 
    // Estructura básica
    'html', 'meta', 'head', 'body', 'title',
    // Texto y estructura
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'br', 'hr',
    // Formato de texto
    'strong', 'em', 'b', 'i', 'u', 'sup', 'sub',
    // Listas
    'ul', 'ol', 'li',
    // Enlaces
    'a',
    // Imágenes
    'img',
    // Tablas (esenciales para layouts de email)
    'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot',
    // Estilos en línea
    'style',
    // Compatibilidad con emails
    'center'

  ],
  allowedAttributes: {
    '*': [   'dir', 'lang', 'xml:lang', 'charset','content', 'http-equiv',
                  'class', 'style', 'id', 'title','name', 'placeholder', 'value',
                  'href', 'target', 'rel',
                  'src', 'alt', 'width', 'height', 'border',
                  'cellpadding', 'cellspacing', 'align', 'valign', 'role', 'colspan', 'rowspan', 'bgcolor',
                  'data-id', 'data-type', 'data-embed',
                  'color', 'face', 'size',
                  'data-embed', 'data-type', 'data-id']
  },
  allowedSchemes: ['http', 'https', 'data'],
  allowVulnerableTags: true
};


// Compilar y guardar plantilla
export async function compileAndSaveTemplate(templateName, htmlContent) {
  try {
    const template = sanitizeHtml(htmlContent, htmlFilter);
    const fileName = `${templateName}-${Date.now()}.html`;
    const filePath = path.join(STORAGE_PATH, fileName);

    fs.writeFileSync(filePath, template.toString());

    return filePath;
  } catch (error) {
    console.error('Error compiling template:', error);
    throw error;
  }
}

// Renderizar plantilla con datos
export async function renderTemplate(templatePath) {
  try {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
 

    return templateContent
  } catch (error) {
    console.error('Error rendering template:', error);
    throw error;
  }
}
