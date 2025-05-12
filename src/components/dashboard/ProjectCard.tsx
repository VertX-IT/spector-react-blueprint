
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Edit, Trash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectCardProps {
  id: string;
  name: string;
  category: string;
  createdAt: Date;
  recordCount: number;
  projectPin?: string;
  onDelete?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  category,
  createdAt,
  recordCount,
  projectPin,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isDesigner = userData?.role === 'designer';
  
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(createdAt);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium">{name}</h3>
          <Badge variant="outline" className="text-xs">{category}</Badge>
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">
          {formattedDate} • {recordCount} {recordCount === 1 ? 'record' : 'records'} collected
        </div>
        
        {projectPin && (
          <div className="mt-2 mb-2">
            <Badge variant="secondary" className="text-xs">PIN: {projectPin}</Badge>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0 px-4 pb-4 gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/dashboard/projects/${id}/form`)}
        >
          <FolderOpen className="h-4 w-4 mr-1" />
          Open
        </Button>
        
        {isDesigner && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/dashboard/projects/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(id)}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};
