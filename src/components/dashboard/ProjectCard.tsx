/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Edit, Trash, Copy, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getUserProjects, saveProject as saveProjectToFirebase, updateProject } from '@/lib/projectOperations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectCardProps {
  id: string;
  name: string;
  category: string;
  createdAt: Date;
  recordCount: number;
  projectPin?: string;
  status?: 'active' | 'inactive';
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  category,
  createdAt,
  recordCount,
  projectPin,
  status = 'active',
  onDelete,
  onDuplicate,
}) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isDesigner = userData?.role === 'designer';

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(createdAt);

  const [isEndSurveyDialogOpen, setIsEndSurveyDialogOpen] = useState(false);
  const [isEnded, setIsEnded] = useState(status === 'inactive');
  const isInactive = status === 'inactive' || isEnded;

  // Save edited project function (localStorage or Firebase)
  const handleSaveEdit = async (editedProject: any) => {
    try {
      // Check if project is in Firebase (id exists in remote list)
      const userId = userData?.uid;
      let isFirebase = false;
      if (userId) {
        const firebaseProjects = await getUserProjects(userId);
        if (firebaseProjects.find(p => p.id === editedProject.id)) {
          isFirebase = true;
        }
      }

      if (isFirebase) {
        // Save to Firebase (relies on saveProject to update or create as needed)
        await saveProjectToFirebase(editedProject);
        toast.success('Project updated in the cloud!');
      } else {
        // Local update
        const stored = localStorage.getItem('myProjects');
        let arr = [];
        if (stored) arr = JSON.parse(stored);
        const idx = arr.findIndex((p: any) => p.id === editedProject.id);
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], ...editedProject };
          localStorage.setItem('myProjects', JSON.stringify(arr));
          toast.success('Project updated locally!');
        }
      }
    } catch (err: any) {
      toast.error('Error saving project: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEndSurvey = async () => {
    try {
      await updateProject(id, { status: 'inactive' });
      setIsEnded(true);
      toast.success('Survey ended successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to end survey');
    } finally {
      setIsEndSurveyDialogOpen(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md h-full">
      <CardContent className="p-4">
        <div className="flex flex-col mb-3">
          <h3 className="text-base font-medium line-clamp-2 mb-1">{name}</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className="text-xs">{category}</Badge>
            {isInactive && (
              <Badge variant="destructive" className="text-xs">Survey Ended</Badge>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-3">
          {formattedDate} • {recordCount} {recordCount === 1 ? 'record' : 'records'} collected
        </div>

        {projectPin && (
          <div className="mt-2 mb-2">
            <Badge variant="secondary" className="text-xs">PIN: {projectPin}</Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/dashboard/projects/${id}/form`)}
        >
          <FolderOpen className="h-4 w-4 mr-1" />
          Open
        </Button>

        {isDesigner && (
          <>
            <div className="grid grid-cols-4 gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/dashboard/projects/${id}/edit`)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-amber-500 hover:text-amber-600"
                onClick={() => setIsEndSurveyDialogOpen(true)}
                disabled={isInactive}
                title={isInactive ? 'Survey already ended' : 'End Survey'}
              >
                <Flag className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">End</span>
              </Button>

              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onDuplicate(id)}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1">Copy</span>
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => onDelete(id)}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                </Button>
              )}
            </div>

            <AlertDialog open={isEndSurveyDialogOpen} onOpenChange={setIsEndSurveyDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End this survey?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will close the survey and prevent any further submissions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndSurvey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    End Survey
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
