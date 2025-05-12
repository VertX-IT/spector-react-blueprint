
import React, { useState, useEffect } from 'react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  category: string;
  createdAt: string | Date; // String from localStorage, Date when created
  recordCount: number;
  projectPin?: string;
}

const MyProjectsPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const isDesigner = userData?.role === 'designer';
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Load projects from localStorage on component mount
  useEffect(() => {
    const storedProjects = localStorage.getItem('myProjects');
    
    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects);
        // Convert string dates back to Date objects
        const projectsWithDates = parsedProjects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
        setProjects(projectsWithDates);
      } catch (error) {
        console.error('Error parsing projects from localStorage:', error);
        setProjects([]);
      }
    }
  }, []);

  const handleDeleteProject = (id: string) => {
    try {
      const updatedProjects = projects.filter(project => project.id !== id);
      localStorage.setItem('myProjects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">My Projects</h1>
        <p className="text-sm text-muted-foreground">
          {isDesigner ? 'Manage your surveys and data collection projects' : 'Access your data collection projects'}
        </p>
      </div>

      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              category={project.category}
              createdAt={new Date(project.createdAt)} // Ensure we always pass a Date object
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
