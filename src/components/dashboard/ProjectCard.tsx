import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Edit, Trash, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

  const isInactive = status === 'inactive';

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
          <div className="grid grid-cols-2 gap-2 w-full">{/* REMOVE Edit Button */}
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
        )}
      </CardFooter>
    </Card>
  );
};
