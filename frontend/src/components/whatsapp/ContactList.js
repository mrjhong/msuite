import React, { useState, useEffect,useCallback } from 'react';
import { apiGetWhatsappContacts } from '../../services/whatsappApiService';
import { useGlobalContext } from '../../context/GlobalContext';

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { showNotification,selectedContacts, setSelectedContacts, selectedGroups, setSelectedGroups, blurContacts, singleSelect } = useGlobalContext();
  const [ error , setError ] = useState(false);
  const stableShowNotification = useCallback((message, type) => {
    if (error === false){
      showNotification(message, type);
    }
  }, [showNotification, error]); 

  useEffect(() => {
    const fetchContactsAndGroups = async () => {
      try {
        const response = await apiGetWhatsappContacts();

        if (!response || response.failure) {
          setError(true);
          stableShowNotification('Error al obtener contactos y grupos', 'error');
          return;
        }

        // Asegurarse de que los datos vengan con la estructura correcta
        const safeContacts = Array.isArray(response.contacts)
          ? response.contacts.map(c => ({
            id: c.id || '',
            name: c.name || '',
            phone: c.phone || ''
          }))
          : [];

        const safeGroups = Array.isArray(response.groups)
          ? response.groups.map(g => ({
            id: g.id || '',
            name: g.name || ''
          }))
          : [];

        setContacts(safeContacts);
        setGroups(safeGroups);
      } catch (error) {
        console.error('Error obteniendo contactos y grupos:', error);
        setError(true);
        stableShowNotification('Error al obtener contactos y grupos', 'error');
      }
    };

    fetchContactsAndGroups();
  }, [stableShowNotification]);

  // Función de filtrado simplificada sin useMemo
  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      // Verificar si el item tiene las propiedades necesarias
      if (item.name && typeof item.name === 'string') {
        return item.name.toLowerCase().includes(term);
      }
      return false;
    });
  };

  const filteredContacts = filterItems(contacts, searchTerm);
  const filteredGroups = filterItems(groups, searchTerm);

  const handleContactSelect = (contactId) => {
    if (blurContacts) return;
    if (singleSelect) {
      setSelectedContacts([contactId]);
      setSelectedGroups([]);
    }
    else {
      setSelectedContacts(prev =>
        prev.includes(contactId)
          ? prev.filter(id => id !== contactId)
          : [...prev, contactId]
      );
    }
  };

  const handleGroupSelect = (groupId) => {
    if (blurContacts) return;
    if (singleSelect) {
      setSelectedGroups([groupId]);
      setSelectedContacts([]);
    }
    else {
      setSelectedGroups(prev =>
        prev.includes(groupId)
          ? prev.filter(id => id !== groupId)
          : [...prev, groupId]
      );
    }
  };

  return (
    <div className={`w-1/3 bg-gray-100 px-4 shadow-lg overflow-y-auto h-screen relative ${blurContacts ? 'blur-sm' : ''}`}>
      {/* Capa difuminada si blurContacts es true */}
      {blurContacts && (
        <div className="absolute inset-0 bg-white bg-opacity-50 backdrop-blur-sm z-10"></div>
      )}

      {/* Barra de búsqueda */}
      <div className="mb-4 sticky top-0 bg-gray-100 pt-6 pb-4 z-20">
        <input
          type="text"
          placeholder="Buscar contactos o grupos..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de contactos */}
      <h3 className="text-xl font-medium mb-3">Contactos ({filteredContacts.length})</h3>
      <div className="space-y-2 mb-6">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-3 border rounded-lg cursor-pointer transition ${selectedContacts.includes(contact.id)
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
                }`}
              onClick={() => handleContactSelect(contact.id)}
            >
              <div className="font-medium">{contact.name || 'Sin nombre'}</div>
              <div className="text-sm">{contact.phone || 'Sin teléfono'}</div>
            </div>
          ))
        ) : (
          <div className="p-3 text-center text-gray-500">
            {searchTerm ? 'No se encontraron contactos' : 'No hay contactos disponibles'}
          </div>
        )}
      </div>

      {/* Lista de grupos */}
      <h3 className="text-xl font-medium mb-3">Grupos ({filteredGroups.length})</h3>
      <div className="space-y-2">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`p-3 border rounded-lg cursor-pointer transition ${selectedGroups.includes(group.id)
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
                }`}
              onClick={() => handleGroupSelect(group.id)}
            >
              {group.name || 'Grupo sin nombre'}
            </div>
          ))
        ) : (
          <div className="p-3 text-center text-gray-500">
            {searchTerm ? 'No se encontraron grupos' : 'No hay grupos disponibles'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;