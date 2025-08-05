import React from "react";

interface EndSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEndSurvey: () => void;
}

const EndSurveyDialog: React.FC<EndSurveyDialogProps> = ({ open, onOpenChange, onEndSurvey }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">End this survey?</h2>
        <p className="mb-4">This will close the survey and prevent any further submissions. You will still be able to view collected data.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded border" onClick={() => onOpenChange(false)}>Cancel</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onEndSurvey}>End Survey</button>
        </div>
      </div>
    </div>
  );
};

export default EndSurveyDialog;
