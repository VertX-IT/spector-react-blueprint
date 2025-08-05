import React from "react";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({ open, onOpenChange, onDelete }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">Are you absolutely sure?</h2>
        <p className="mb-4">This action cannot be undone. This will permanently delete the project and all associated data.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded border" onClick={() => onOpenChange(false)}>Cancel</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectDialog;
