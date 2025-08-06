import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EndSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEndSurvey: () => void;
}

const EndSurveyDialog: React.FC<EndSurveyDialogProps> = ({
  open,
  onOpenChange,
  onEndSurvey,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End this survey?</AlertDialogTitle>
          <AlertDialogDescription>
            This will close the survey and prevent any further submissions. You will
            still be able to view collected data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onEndSurvey}>
            End Survey
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EndSurveyDialog;
