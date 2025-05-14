
import React, { useState, useEffect } from 'react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { getUserProjects, deleteProject, Project } from '@/lib/projectOperations';

const MyProjectsPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const isDesigner = userData?.role === 'designer';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load projects from Firebase or localStorage on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        // For now, use localStorage until Firebase implementation is ready
        const storedProjects = localStorage.getItem('myProjects');
        if (storedProjects) {
          const parsedProjects = JSON.parse(storedProjects);
          const projectsWithDates = parsedProjects.map((project: any) => ({
            ...project,
            createdAt: new Date(project.createdAt)
          }));
          setProjects(projectsWithDates);
        } else {
          // Initialize empty projects array in localStorage
          localStorage.setItem('myProjects', JSON.stringify([]));
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, [userData]);

  const handleDeleteProject = async (id: string) => {
    try {
      // Delete from localStorage for now
      const storedProjects = localStorage.getItem('myProjects');
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        const updatedProjects = parsedProjects.filter((p: any) => p.id !== id);
        localStorage.setItem('myProjects', JSON.stringify(updatedProjects));
      }
      
      // Update state
      const updatedProjects = projects.filter(project => project.id !== id);
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

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              id={project.id || ''}
              name={project.name}
              category={project.category}
              createdAt={new Date(project.createdAt)}
              recordCount={project.recordCount || 0}
              projectPin={project.projectPin}
              status={project.status || 'active'}
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
