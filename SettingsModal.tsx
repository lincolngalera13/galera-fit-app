import React, { useState } from 'react';
import { X, Save, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string | undefined;
  onSave: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUrl, onSave }) => {
  const [url, setUrl] = useState(currentUrl || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 w-full max-w-md rounded-xl border border-slate-700 shadow-2xl animate-fadeIn">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            Configurar Planilha
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
              URL do Google Apps Script
              <div className="group relative">
                 <HelpCircle className="w-4 h-4 text-slate-500 cursor-help" />
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-xs text-slate-300 p-3 rounded border border-slate-700 hidden group-hover:block z-10 shadow-xl">
                    IMPORTANTE:<br/>
                    Para funcionar, a implantação DEVE ter acesso público.<br/><br/>
                    1. Implantar > Gerenciar Implantações<br/>
                    2. Editar (Lápis)<br/>
                    3. Executar como: Eu<br/>
                    4. Quem pode acessar: <strong>Qualquer pessoa (Anyone)</strong>
                 </div>
              </div>
            </label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none break-all"
            />
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              <strong className="text-amber-500">Atenção:</strong> Se o botão de login/registro não funcionar, verifique se a permissão do script está como "Qualquer pessoa".
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
           <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { onSave(url); onClose(); }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar URL
          </button>
        </div>
      </div>
    </div>
  );
};