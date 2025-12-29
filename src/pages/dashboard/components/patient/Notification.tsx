import { Bell, Calendar, X, Inbox, History } from "lucide-react";
import { useState } from "react";
import { api } from "../../../../lib/api";

// 1. Definimos la estructura de la notificación para corregir los errores de tipo 'never'
interface Notification {
  id: number;
  title: string;
  message: string;
  entityType: string;
  isRead: boolean;
  createdAt: string;
}

// 2. Definimos las Props del componente para corregir los errores TS7031
interface NotificationsProps {
  notiUnread: Notification[];
  notiReaded: Notification[];
  viewNoti: () => void;
}

export const Notifications = ({ notiUnread, notiReaded, viewNoti }: NotificationsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Tipamos el estado para que pueda ser una Notificación o null
  const [selectedNoti, setSelectedNoti] = useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

  // Tipamos el parámetro 'id' como number
  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      viewNoti(); 
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(`/notifications/read-all`);
      viewNoti(); 
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  // Tipamos el parámetro 'notification'
  const handleOpenModal = (notification: Notification) => {
    setSelectedNoti(notification);
    setIsModalOpen(true);
    
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNoti(null);
  };

  const currentNotifications = activeTab === 'unread' ? notiUnread : notiReaded;

  return (
    <div className="relative">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
        
        {/* Cabecera y Selector de Pestañas */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Notificaciones</h2>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveTab('unread')}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors pb-1 border-b-2 ${
                  activeTab === 'unread' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Inbox size={16} /> No leídas ({notiUnread.length})
              </button>
              <button 
                onClick={() => setActiveTab('read')}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors pb-1 border-b-2 ${
                  activeTab === 'read' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <History size={16} /> Leídas ({notiReaded.length})
              </button>
            </div>
          </div>

          {activeTab === 'unread' && notiUnread.length > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors bg-teal-50 px-3 py-1.5 rounded-full"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Lista de Notificaciones */}
        <div className="space-y-3">
          {currentNotifications.length > 0 ? (
            currentNotifications.map((noti) => (
              <div 
                key={noti.id}
                onClick={() => handleOpenModal(noti)}
                className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full transition-all ${noti.isRead ? 'bg-slate-200' : 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]'}`} />
                  
                  <div>
                    <h3 className={`text-sm transition-colors ${noti.isRead ? 'text-slate-500 font-medium' : 'text-slate-900 font-bold'}`}>
                      {noti.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(noti.createdAt).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                
                {activeTab === 'unread' && (
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    Nuevo
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Bell className="text-slate-300" size={24} />
              </div>
              <p className="text-slate-400 italic text-sm">
                {activeTab === 'unread' ? 'No tienes notificaciones pendientes' : 'Tu historial está vacío'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLE */}
      {isModalOpen && selectedNoti && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                  <Bell size={18} />
                </div>
                <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Detalle de Notificación</span>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedNoti.title}</h2>
              <p className="text-slate-600 leading-relaxed">{selectedNoti.message}</p>
              
              <div className="mt-6 flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Tipo de evento:</span>
                  <span className="text-slate-700 capitalize">{selectedNoti.entityType}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Recibida el:</span>
                  <span className="text-slate-700">{new Date(selectedNoti.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={closeModal}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};