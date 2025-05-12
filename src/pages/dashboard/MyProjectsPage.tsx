
import React, { useState, useEffect } from 'react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { getUserProjects, deleteProject, Project } from '@/lib/projectOperations';

const MyProjectsPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const isDesigner = userData?.role === 'designer';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load projects from Firebase on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (userData?.uid) {
          const userProjects = await getUserProjects(userData.uid);
          setProjects(userProjects);
        } else {
          // Fallback to localStorage if user is not authenticated properly
          const storedProjects = localStorage.getItem('myProjects');
          if (storedProjects) {
            const parsedProjects = JSON.parse(storedProjects);
            const projectsWithDates = parsedProjects.map((project: any) => ({
              ...project,
              createdAt: new Date(project.createdAt)
            }));
            setProjects(projectsWithDates);
          }
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
      // Delete from Firebase if it's a Firebase project (has Firebase ID format)
      if (id && id.length > 10) {
        await deleteProject(id);
      }
      
      // Also delete from localStorage for backward compatibility
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
