
import React from 'react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus } from 'lucide-react';

// Temporary dummy data for demonstration
const dummyProjects = [
  {
    id: '1',
    name: 'Land Asset Survey',
    category: 'Land',
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    recordCount: 24
  },
  {
    id: '2',
    name: 'Equipment Inventory',
    category: 'Equipment',
    createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
    recordCount: 12
  },
  {
    id: '3',
    name: 'Vehicle Assessment',
    category: 'Motor Vehicles',
    createdAt: new Date(Date.now() - 86400000 * 14), // 14 days ago
    recordCount: 5
  },
  {
    id: '4',
    name: 'Building Condition Survey',
    category: 'Buildings',
    createdAt: new Date(Date.now() - 86400000 * 21), // 21 days ago
    recordCount: 8
  }
];

const MyProjectsPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const isDesigner = userData?.role === 'designer';

  const handleDeleteProject = (id: string) => {
    // TODO: Implement project deletion
    console.log('Delete project with ID:', id);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">
            {isDesigner ? 'Manage your surveys and data collection projects' : 'Access your data collection projects'}
          </p>
        </div>

        {isDesigner && (
          <Button onClick={() => navigate('/dashboard/new-project')}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {dummyProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dummyProjects.map(project => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              category={project.category}
              createdAt={project.createdAt}
              recordCount={project.recordCount}
              onDelete={isDesigner ? handleDeleteProject : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          description={isDesigner 
            ? "Create your first project to start collecting data" 
            : "Join a project to start collecting data"}
          buttonText={isDesigner ? "Create project" : "Join a project"}
          buttonLink={isDesigner ? "/dashboard/new-project" : "/dashboard/join-project"}
          icon={<FolderOpen size={48} />}
        />
      )}
    </>
  );
};

export default MyProjectsPage;
