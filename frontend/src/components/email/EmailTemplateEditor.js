import React, { useState, useCallback } from 'react';
import { apiCreateEmailTemplate } from '../../services/emailApiService';
import { FiSave, FiEye } from 'react-icons/fi';
import Editor from "@monaco-editor/react";
import { useGlobalContext } from '../../context/GlobalContext';
import DOMPurify from 'dompurify';
import ModalPreview from '../ModalPreview';

const EmailTemplateEditor = () => {
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const { showNotification,htmlFilter } = useGlobalContext();

    // Sanitizar el contenido HTML antes de mostrarlo o enviarlo
    const sanitizeHTML = useCallback((html) => {
        return DOMPurify.sanitize(html, htmlFilter);
    }, []);



    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación básica
        if (!htmlContent.trim()) {
            showNotification('El contenido HTML no puede estar vacío', 'error');
            return;
        }

        setIsLoading(true);

        try {
            // Sanitizar el contenido antes de enviarlo
            const sanitizedContent = sanitizeHTML(htmlContent);

            const result = await apiCreateEmailTemplate({
                name,
                subject,
                htmlContent: sanitizedContent,
                variables: {} // Eliminamos las variables por seguridad
            });

            if (result.success) {
                showNotification('Plantilla creada exitosamente', 'success');
                resetForm();
            } else {
                showNotification(result.error, 'error');
            }
        } catch (error) {
            showNotification('Error al crear la plantilla', 'error');
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setSubject('');
        setHtmlContent('');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="p-6 w-full">
                <div className="flex-1 bg-white p-6 shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
                    <h2 className="text-2xl font-bold mb-4">Crear Plantilla de Correo Segura</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        maxLength={100}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Asunto*</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                        maxLength={150}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Contenido HTML*</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="flex items-center text-sm text-purple-600 hover:text-purple-800"
                                    >
                                        <FiEye className="mr-1" /> {showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
                                    </button>
                                </div>



                                <div className="flex flex-col h-full">
                                    {/* Controles del editor */}
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-700">Editor HTML</label>
                                    </div>

                                    {/* Contenedor del editor responsivo - IMPORTANTE agregar relative */}
                                    <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm relative"
                                        style={{
                                            minHeight: '240px',
                                            height: '60vh',
                                            maxHeight: '250px'
                                        }}
                                    >
                                        <Editor
                                            defaultLanguage="html"
                                            defaultValue={htmlContent}
                                            onChange={(value) => setHtmlContent(value || "")}
                                            height="100%"
                                            theme="vs-dark" // puedes cambiar a "light"
                                            options={{
                                                minimap: { enabled: false },
                                                lineNumbers: "on",
                                                wordWrap: "on",
                                                scrollBeyondLastLine: false,
                                                fontSize: 14,
                                                automaticLayout: true,
                                            }}
                                        />
                                    </div>
                                </div>
                                <ModalPreview
                                    isOpen={showPreview}
                                    onClose={() => setShowPreview(false)}
                                    htmlContent={htmlContent}
                                    title="Vista previa de tu plantilla de correo"
                                />



                            </div>

                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    * Campos obligatorios
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando...' : (
                                        <>
                                            <FiSave className="mr-2" />
                                            Guardar Plantilla
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplateEditor;