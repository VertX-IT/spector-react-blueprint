import React from "react";
import { NavLink } from "react-router-dom";
import { FolderOpen, User, Plus, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/contexts/MobileContext";
import { useAuth } from "@/contexts/AuthContext";

export const MobileNavBar: React.FC = () => {
  const { isMobile } = useMobile();
  const { userData } = useAuth();
  const isDesigner = userData?.role === "designer";

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-40 flex items-center justify-around px-2 pb-safe">
      <NavLink
        to="/dashboard/my-projects"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center w-16 h-full text-xs",
            isActive ? "text-primary" : "text-muted-foreground"
          )
        }
      >
        <FolderOpen className="h-5 w-5 mb-1" />
        <span>Projects</span>
      </NavLink>

      {isDesigner && (
        <NavLink
          to="/dashboard/new-project"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-16 h-full text-xs",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <Plus className="h-5 w-5 mb-1" />
          <span>Create</span>
        </NavLink>
      )}

      <NavLink
        to="/dashboard/join-project"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center w-16 h-full text-xs",
            isActive ? "text-primary" : "text-muted-foreground"
          )
        }
      >
        <LogIn className="h-5 w-5 mb-1" />
        <span>Join</span>
      </NavLink>

      <NavLink
        to="/dashboard/profile"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center w-16 h-full text-xs",
            isActive ? "text-primary" : "text-muted-foreground"
          )
        }
      >
        <User className="h-5 w-5 mb-1" />
        <span>Profile</span>
      </NavLink>
    </div>
  );
};
