
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  onDelete?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  category,
  createdAt,
  recordCount,
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
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{name}</CardTitle>
            <CardDescription>{formattedDate}</CardDescription>
          </div>
          <Badge variant="outline">{category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {recordCount} {recordCount === 1 ? 'record' : 'records'} collected
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => navigate(`/dashboard/projects/${id}`)}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          View
        </Button>
        
        {isDesigner && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/dashboard/projects/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(id)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};
