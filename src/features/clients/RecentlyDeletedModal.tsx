import React, { useState, useEffect } from 'react';
import { RotateCcw, Trash2, UserX } from 'lucide-react';
import { clientService } from '../../services/clientService';
import { Client } from '../../types';
import { Modal } from '../../components/ui/Overlays';
import { Button } from '../../components/ui/Button';
import { formatDateAU } from '../../lib/formatters';
import { useToast } from '../../contexts/ToastContext';

interface RecentlyDeletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export const RecentlyDeletedModal: React.FC<RecentlyDeletedModalProps> = ({
  isOpen,
  onClose,
  onRestored,
}) => {
  const [deletedClients, setDeletedClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { success } = useToast();

  const loadDeleted = async () => {
    setIsLoading(true);
    try {
      const list = await clientService.getRecentlyDeleted();
      setDeletedClients(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDeleted();
    }
  }, [isOpen]);

  const handleRestore = async (id: string, name: string) => {
    await clientService.restore(id);
    success('Client Restored', `${name} has been restored to active clients.`);
    await loadDeleted();
    onRestored();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recently Deleted Clients"
      description="Clients are soft-deleted and can be recovered within 30 days."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {deletedClients.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No deleted clients found</p>
            <p className="text-xs text-slate-400 mt-0.5">Recycle bin is currently empty.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {deletedClients.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {c.firstName} {c.lastName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {c.email} • {c.address.suburb}, {c.address.state}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Deleted on: {formatDateAU(c.deletedAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-teal-600" />}
                  onClick={() => handleRestore(c.id, `${c.firstName} ${c.lastName}`)}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
