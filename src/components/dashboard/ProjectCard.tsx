
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
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-medium line-clamp-2">{name}</h3>
          <Badge variant="outline" className="text-xs shrink-0 ml-2">{category}</Badge>
        </div>
        
        <div className="text-xs text-muted-foreground mb-3">
          {formattedDate} • {recordCount} {recordCount === 1 ? 'record' : 'records'} collected
        </div>
        
        <div className="mt-2 mb-2 flex flex-wrap gap-2">
          {projectPin && (
            <Badge variant="secondary" className="text-xs">PIN: {projectPin}</Badge>
          )}
          
          {isInactive && (
            <Badge variant="destructive" className="text-xs">Survey Ended</Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 gap-2 flex flex-col">
        <div className="flex w-full">
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => navigate(`/dashboard/projects/${id}/form`)}
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            Open
          </Button>
        </div>
        
        {isDesigner && (
          <div className="flex w-full gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[80px]"
              onClick={() => navigate(`/dashboard/projects/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            
            {onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-[80px]"
                onClick={() => onDuplicate(id)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
            )}
            
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
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
