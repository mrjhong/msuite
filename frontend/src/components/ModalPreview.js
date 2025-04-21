//import React from 'react';
import DOMPurify from 'dompurify';
import { useGlobalContext } from '../context/GlobalContext';

const ModalPreview = ({ isOpen, onClose, htmlContent, title }) => {
  const { htmlFilter } = useGlobalContext();
  // Sanitizar el contenido HTML
  if (!isOpen) return null;
  const cleanHtml = DOMPurify.sanitize(htmlContent, htmlFilter);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Fondo oscuro */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      {/* Contenedor del modal */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Espacio para evitar que el modal se cierre al hacer clic alrededor */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Contenido del modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cerrar
            </button>
            <h2 className="text-lg leading-6 font-medium text-gray-50 flex-1">
              {title || 'Vista previa de la plantilla'}
            </h2>
          </div>

          {/* Body */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                {/* Contenido sanitizado */}
                {/* <div 
                  className="prose max-w-none p-4 border rounded-lg"
                  dangerouslySetInnerHTML={{ __html: cleanHtml }}
                /> */}

                <iframe
                  srcDoc={cleanHtml}
                  sandbox=""
                  style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
                ></iframe>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPreview;