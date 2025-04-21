import { createContext, useContext, useState } from "react";
import Alert from "../components/Alert";

// Crear el contexto
const GlobalContext = createContext();

// Proveedor del contexto
export const GlobalProvider = ({ children }) => {
  const htmlFilter = {
              // Etiquetas HTML permitidas (compatible con clientes de email)
              ALLOWED_TAGS: [
                  // Estructura básica
                  'html','meta', 'head', 'body', 'title',
                  // Texto y estructura
                  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6','div', 'span', 'br', 'hr',
                  // Formato de texto
                  'strong', 'em', 'b', 'i', 'u', 'sup', 'sub',
                  'font', // Para compatibilidad con emails antiguos
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
                  'center', 'pre'
              ],
  
              // Atributos permitidos
              ALLOWED_ATTR: [
                  'dir', 'lang', 'xml:lang', 'charset','content', 'http-equiv',
                  'class', 'style', 'id', 'title','name', 'placeholder', 'value',
                  'href', 'target', 'rel',
                  'src', 'alt', 'width', 'height', 'border',
                  'cellpadding', 'cellspacing', 'align', 'valign', 'role', 'colspan', 'rowspan', 'bgcolor',
                  'data-id', 'data-type', 'data-embed',
                  'color', 'face', 'size',
                  'data-embed', 'data-type', 'data-id'
              ],
              //PERMITIR HTML COMPLETO
              
              WHOLE_DOCUMENT: true,
              // Permitir estilos CSS seguros
              ALLOW_STYLE: true,
              // Permitir clases CSS específicas
              ALLOW_DATA_ATTR: false
          };


  const [selectedContacts, setSelectedContacts] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [blurContacts, setBlurContacts] = useState(false);
  const [singleSelect , setSingleSelect] = useState(false);

  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotification({ message, type, duration });
  };
  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <GlobalContext.Provider value={
      { selectedContacts, setSelectedContacts, 
      selectedGroups, setSelectedGroups,
      blurContacts, setBlurContacts,
      singleSelect, setSingleSelect,
      showNotification, hideNotification,
      htmlFilter 
      }
      }>
      {children}
      {notification && (
        <Alert
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={hideNotification}
        />
      )}
    </GlobalContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useGlobalContext = () => {
  return useContext(GlobalContext);
};
